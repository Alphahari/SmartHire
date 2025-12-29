import os
import logging
import whisper
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field
from dotenv import load_dotenv
# --- CONFIGURATION ---
# Ideally, move this to os.environ for security
load_dotenv()  # Loads variables from .env into os.environ
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

print("Loading Whisper model...")
whisper_model = whisper.load_model("base")
print("Whisper model loaded.")

# --- LLM SETUP ---
evaluator_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,
    max_retries=2,
)

final_summarizer_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_retries=2,
)

# --- SCHEMAS ---
class EvaluationOutput(BaseModel):
    analysis: str = Field(..., description="Concise analysis of the answer")
    next_question: str = Field(..., description="One specific follow-up or new question")
    score: int = Field(..., description="Score for this specific answer out of 100")

class FinalSummary(BaseModel):
    summary: str = Field(..., description="Overall summary of the interview")
    strengths: str = Field(..., description="Key strengths")
    weaknesses: str = Field(..., description="Weaknesses and improvement opportunities")
    suggestions: str = Field(..., description="Recommendations to improve")
    rating: int = Field(..., description="Overall Rating out of 100")

structured_eval = evaluator_llm.with_structured_output(EvaluationOutput)
structured_final = final_summarizer_llm.with_structured_output(FinalSummary)

# --- FUNCTIONS ---

def transcribe_audio(audio_path):
    """Transcribes audio using Whisper."""
    try:
        result = whisper_model.transcribe(audio_path, language="en")
        return result.get("text", "").strip()
    except Exception as e:
        logging.error(f"Whisper Transcription Error: {e}")
        return ""

def analyze_answer_and_generate_next(current_question, user_transcript, conversation_history):
    """
    Evaluates the current answer and generates the NEXT question.
    """
    if not user_transcript:
        return {
            "analysis": "No speech detected.",
            "next_question": "Could you please repeat that? I didn't catch it.",
            "score": 0
        }

    # Format history for context
    history_text = "\n".join([f"Q: {h['question']}\nA: {h['user_answer']}" for h in conversation_history])

    msg = [
        SystemMessage(content="""You are an expert interview evaluator. 
        1. Analyze the candidate's answer for clarity, depth, and relevance.
        2. Assign a score out of 100.
        3. Generate the NEXT question based on the candidate's answer (follow-up) or move to a new relevant topic if the answer was sufficient.
        """),
        HumanMessage(content=f"""
        Previous Context:
        {history_text}

        Current Question: {current_question}
        Candidate's Answer: {user_transcript}

        Provide the analysis, the score, and the NEXT question.
        """)
    ]

    try:
        result = structured_eval.invoke(msg)
        return {
            "analysis": result.analysis,
            "next_question": result.next_question,
            "score": result.score
        }
    except Exception as e:
        logging.error(f"LLM Evaluation Error: {e}")
        return {
            "analysis": "Error analyzing response.",
            "next_question": "Let's move to the next topic. Tell me about your strengths.",
            "score": 50
        }

def generate_final_summary(conversation_history):
    """
    Generates the comprehensive final report.
    """
    conversation = "\n\n".join([
        f"Q{i+1}: {item['question']}\nA{i+1}: {item['user_answer']}"
        for i, item in enumerate(conversation_history)
    ])
    
    msg = [
        SystemMessage(content="You are a senior hiring manager. Provide a comprehensive final evaluation."),
        HumanMessage(content=f"""
        Complete Interview Transcript:
        {conversation}

        Provide a structured final summary including:
        1. Overall summary and impression
        2. Key strengths demonstrated
        3. Areas for improvement
        4. Specific suggestions for future interviews
        5. Overall rating (0-100 scale)
        """)
    ]

    try:
        result = structured_final.invoke(msg)
        return result.dict()
    except Exception as e:
        logging.error(f"Summary Generation Error: {e}")
        return {
            "summary": "Could not generate summary.",
            "strengths": "N/A",
            "weaknesses": "N/A",
            "suggestions": "N/A",
            "rating": 0
        }