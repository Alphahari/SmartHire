import os
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
from sqlalchemy.orm import joinedload
from models import QuizAttempt, Score, Quiz, Chapter

class AIReportGenerator:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-70b-versatile",
            groq_api_key=os.getenv('GROQ_API_KEY'),
            temperature=0.7
        )
    
    def get_user_performance_data(self, user_id, month_start, month_end):
        """Get comprehensive user performance data for the month"""
        
        # Get quiz attempts for the month
        quiz_attempts = QuizAttempt.query.filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.end_time != None,
            QuizAttempt.end_time >= month_start,
            QuizAttempt.end_time < month_end
        ).options(
            joinedload(QuizAttempt.quiz)
            .joinedload(Quiz.chapter)
            .joinedload(Chapter.subject)
        ).all()
        
        # Calculate quiz performance
        quiz_performance = []
        total_correct = 0
        total_questions = 0
        
        for attempt in quiz_attempts:
            scores = Score.query.filter_by(attempt_id=attempt.id).all()
            correct_in_attempt = sum(
                1 for score in scores 
                if score.selected_option == score.question.correct_option
            )
            total_in_attempt = len(scores)
            
            quiz_performance.append({
                'quiz_name': f"{attempt.quiz.chapter.subject.name} - {attempt.quiz.chapter.name}",
                'score_percentage': round((correct_in_attempt / total_in_attempt) * 100, 1) if total_in_attempt else 0,
                'correct_answers': correct_in_attempt,
                'total_questions': total_in_attempt,
                'completion_date': attempt.end_time.strftime('%Y-%m-%d')
            })
            
            total_correct += correct_in_attempt
            total_questions += total_in_attempt
        
        # Calculate subject-wise performance
        subject_performance = {}
        for attempt in quiz_attempts:
            subject_name = attempt.quiz.chapter.subject.name
            if subject_name not in subject_performance:
                subject_performance[subject_name] = {'correct': 0, 'total': 0}
            
            scores = Score.query.filter_by(attempt_id=attempt.id).all()
            correct_in_attempt = sum(
                1 for score in scores 
                if score.selected_option == score.question.correct_option
            )
            total_in_attempt = len(scores)
            
            subject_performance[subject_name]['correct'] += correct_in_attempt
            subject_performance[subject_name]['total'] += total_in_attempt
        
        # Format subject performance
        subject_breakdown = []
        for subject, stats in subject_performance.items():
            accuracy = (stats['correct'] / stats['total']) * 100 if stats['total'] else 0
            subject_breakdown.append({
                'subject': subject,
                'accuracy': round(accuracy, 1),
                'correct': stats['correct'],
                'total': stats['total']
            })
        
        # Sort by accuracy
        subject_breakdown.sort(key=lambda x: x['accuracy'])
        
        return {
            'quiz_performance': quiz_performance,
            'subject_breakdown': subject_breakdown,
            'total_quizzes': len(quiz_attempts),
            'overall_accuracy': round((total_correct / total_questions) * 100, 1) if total_questions else 0,
            'total_correct': total_correct,
            'total_questions': total_questions
        }
    
    def generate_insightful_report(self, user_data, user_name, month):
        """Generate AI-powered insightful report using Groq"""
        
        prompt_template = PromptTemplate(
            input_variables=["user_name", "month", "quiz_performance", "subject_breakdown", "overall_stats"],
            template="""
            You are an experienced educational advisor and performance analyst. Generate a personalized, insightful performance report for a student based on their quiz performance data.

            Student Name: {user_name}
            Report Period: {month}
            
            PERFORMANCE DATA:
            - Total Quizzes Taken: {overall_stats[total_quizzes]}
            - Overall Accuracy: {overall_stats[overall_accuracy]}%
            - Total Questions: {overall_stats[total_questions]}
            - Correct Answers: {overall_stats[total_correct]}
            
            QUIZ PERFORMANCE DETAILS:
            {quiz_performance}
            
            SUBJECT-WISE BREAKDOWN:
            {subject_breakdown}
            
            Please generate a comprehensive performance report that includes:
            
            1. EXECUTIVE SUMMARY:
               - Overall performance assessment
               - Key achievements and areas of excellence
               - Main challenges identified
            
            2. STRENGTHS ANALYSIS:
               - Highlight specific subjects/topics where the student excels
               - Identify patterns of success
               - Acknowledge consistency and improvement
            
            3. AREAS FOR IMPROVEMENT:
               - Pinpoint specific weak areas with actionable insights
               - Suggest targeted learning strategies
               - Recommend focus areas for the next month
            
            4. LEARNING STRATEGIES:
               - Personalized study recommendations
               - Time management suggestions
               - Resource utilization tips
            
            5. GOAL SETTING:
               - Specific, measurable goals for next month
               - Milestone recommendations
               - Confidence-building exercises
            
            Make the report encouraging, constructive, and highly personalized. Use educational psychology principles to provide meaningful insights that will motivate the student to continue improving.
            
            Format the response in clear sections with appropriate headings. Be specific about the data points and provide concrete examples from their performance data.
            """
        )
        
        # Format the data for the prompt
        formatted_quiz_performance = "\n".join([
            f"- {qp['quiz_name']}: {qp['score_percentage']}% ({qp['correct_answers']}/{qp['total_questions']}) on {qp['completion_date']}"
            for qp in user_data['quiz_performance']
        ])
        
        formatted_subject_breakdown = "\n".join([
            f"- {sb['subject']}: {sb['accuracy']}% accuracy ({sb['correct']}/{sb['total']} correct)"
            for sb in user_data['subject_breakdown']
        ])
        
        overall_stats = {
            'total_quizzes': user_data['total_quizzes'],
            'overall_accuracy': user_data['overall_accuracy'],
            'total_questions': user_data['total_questions'],
            'total_correct': user_data['total_correct']
        }
        
        prompt = prompt_template.format(
            user_name=user_name,
            month=month,
            quiz_performance=formatted_quiz_performance,
            subject_breakdown=formatted_subject_breakdown,
            overall_stats=overall_stats
        )
        
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return response.content
        except Exception as e:
            return f"Unable to generate AI-powered report at this time. Error: {str(e)}"

# Singleton instance
ai_report_generator = AIReportGenerator()