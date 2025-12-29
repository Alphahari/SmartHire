import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from session_manager import create_session, get_session

import audio_module
import video_module

logging.basicConfig(level=logging.INFO)
app = Flask(__name__)
CORS(app) 

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/interview/start-session', methods=['POST'])
def start_interview_session():
    """Start a new interview session"""
    # Create session (optionally with resume text if you keep that logic)
    session = create_session("") 
    
    # Initial Question
    initial_question = "Tell me about yourself and your background."
    
    return jsonify({
        "session_id": session.session_id,
        "next_question": initial_question,
        "message": "Interview session started successfully"
    }), 200

@app.route('/api/interview/submit-answer', methods=['POST'])
def submit_answer_route():
    """
    1. Transcribe Audio
    2. Analyze Audio & Video
    3. Save interaction
    4. Generate NEXT question
    """
    session_id = request.form.get('session_id')
    current_question = request.form.get('question')
    
    session = get_session(session_id)
    if not session:
        return jsonify({"error": "Invalid session ID"}), 404
    
    audio_file = request.files.get('audio')
    video_file = request.files.get('video')
    
    if not all([audio_file, video_file, current_question]):
        return jsonify({"error": "Missing required data"}), 400
    
    # Save files temporarily
    audio_path = os.path.join(app.config['UPLOAD_FOLDER'], f"audio_{session_id}.webm")
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], f"video_{session_id}.webm")
    audio_file.save(audio_path)
    video_file.save(video_path)
    
    try:
        # 1. Transcribe
        transcript = audio_module.transcribe_audio(audio_path)
        
        # 2. Analyze Audio (Get Score + Analysis + NEXT Question)
        ai_result = audio_module.analyze_answer_and_generate_next(
            current_question, 
            transcript, 
            session.conversation_history
        )
        
        # 3. Analyze Video
        video_score = video_module.analyze_video(video_path)
        
        # 4. Calculate Combined Score for this turn
        combined_score = (0.6 * ai_result['score']) + (0.4 * video_score)
        
        # 5. Save Interaction to History
        # We pass an empty list for topics for now as we are relying on LLM context
        session.add_interaction(current_question, transcript, [])
        
        return jsonify({
            "success": True,
            "transcript": transcript,
            "feedback": ai_result['analysis'],
            "audio_score": ai_result['score'],
            "video_score": round(video_score),
            "immediate_score": round(combined_score),
            "next_question": ai_result['next_question'] # The Dynamic Question
        })
        
    except Exception as e:
        logging.error(f"Error processing answer: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(audio_path): os.remove(audio_path)
        if os.path.exists(video_path): os.remove(video_path)

@app.route('/api/interview/final-score', methods=['POST'])
def get_final_score():
    """Generate the structured final summary"""
    session_id = request.json.get('session_id')
    session = get_session(session_id)
    
    if not session:
        return jsonify({"error": "Invalid session ID"}), 404
    
    # Generate summary using the new LangGraph-style logic
    summary_data = audio_module.generate_final_summary(session.conversation_history)
    
    return jsonify({
        "final_score": summary_data['rating'],
        "summary": summary_data['summary'],
        "strengths": summary_data['strengths'],
        "weaknesses": summary_data['weaknesses'],
        "suggestions": summary_data['suggestions'],
        "total_questions": len(session.conversation_history)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5054)