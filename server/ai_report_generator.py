import os
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
from sqlalchemy.orm import joinedload
from models import QuizAttempt, Score, Quiz, Chapter, Submission, CodingQuestion, Topic, InterviewSession
from collections import defaultdict
from datetime import datetime, timedelta

class AIReportGenerator:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=os.getenv('GROQ_API_KEY'),
            temperature=0.7
        )
    
    def get_user_performance_data(self, user_id, month_start, month_end):
        """Get comprehensive user performance data for the month including quizzes, coding, and interviews"""
        
        # Track if any activity exists
        has_activity = False
        
        # --- Quiz Performance ---
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
        
        subject_breakdown = []
        for subject, stats in subject_performance.items():
            accuracy = (stats['correct'] / stats['total']) * 100 if stats['total'] else 0
            subject_breakdown.append({
                'subject': subject,
                'accuracy': round(accuracy, 1),
                'correct': stats['correct'],
                'total': stats['total']
            })
        subject_breakdown.sort(key=lambda x: x['accuracy'])
        
        # --- Coding Performance ---
        coding_submissions = Submission.query.filter(
            Submission.user_id == user_id,
            Submission.timestamp >= month_start,
            Submission.timestamp < month_end
        ).options(
            joinedload(Submission.question).joinedload(CodingQuestion.topic)
        ).all()
        
        coding_performance = []
        topic_performance = defaultdict(lambda: {'attempts': 0, 'accepted': 0})
        difficulty_performance = defaultdict(lambda: {'attempts': 0, 'accepted': 0})
        
        for submission in coding_submissions:
            # Track overall coding performance
            is_accepted = submission.status == 'Accepted'
            
            coding_performance.append({
                'problem_title': submission.question.title,
                'topic': submission.question.topic.name,
                'difficulty': submission.question.difficulty,
                'status': submission.status,
                'passed_cases': submission.passed_testcases,
                'total_cases': submission.total_testcases,
                'timestamp': submission.timestamp.strftime('%Y-%m-%d'),
                'language': submission.language
            })
            
            # Track topic performance
            topic_name = submission.question.topic.name
            topic_performance[topic_name]['attempts'] += 1
            if is_accepted:
                topic_performance[topic_name]['accepted'] += 1
            
            # Track difficulty performance
            difficulty = submission.question.difficulty
            difficulty_performance[difficulty]['attempts'] += 1
            if is_accepted:
                difficulty_performance[difficulty]['accepted'] += 1
        
        # Format topic breakdown for coding
        coding_topic_breakdown = []
        for topic, stats in topic_performance.items():
            acceptance_rate = (stats['accepted'] / stats['attempts'] * 100) if stats['attempts'] else 0
            coding_topic_breakdown.append({
                'topic': topic,
                'attempts': stats['attempts'],
                'accepted': stats['accepted'],
                'acceptance_rate': round(acceptance_rate, 1)
            })
        coding_topic_breakdown.sort(key=lambda x: x['acceptance_rate'])
        
        # Format difficulty breakdown for coding
        coding_difficulty_breakdown = []
        for difficulty, stats in difficulty_performance.items():
            acceptance_rate = (stats['accepted'] / stats['attempts'] * 100) if stats['attempts'] else 0
            coding_difficulty_breakdown.append({
                'difficulty': difficulty,
                'attempts': stats['attempts'],
                'accepted': stats['accepted'],
                'acceptance_rate': round(acceptance_rate, 1)
            })
        
        # --- Interview Performance ---
        interview_sessions = InterviewSession.query.filter(
            InterviewSession.user_id == user_id,
            InterviewSession.created_at >= month_start,
            InterviewSession.created_at < month_end
        ).all()
        
        interview_performance = []
        overall_interview_score = 0
        
        for session in interview_sessions:
            interview_performance.append({
                'date': session.created_at.strftime('%Y-%m-%d'),
                'score': session.final_score,
                'total_questions': session.total_questions,
                'weaknesses': session.weaknesses[:100] + '...' if session.weaknesses and len(session.weaknesses) > 100 else session.weaknesses
            })
            overall_interview_score += session.final_score
        
        # Calculate averages
        avg_interview_score = round(overall_interview_score / len(interview_sessions), 2) if interview_sessions else 0
        
        # Check if any activity exists
        has_activity = (
            len(quiz_attempts) > 0 or 
            len(coding_submissions) > 0 or 
            len(interview_sessions) > 0
        )
        
        return {
            # General activity flag
            'has_activity': has_activity,
            
            # Quiz data
            'quiz_performance': quiz_performance,
            'subject_breakdown': subject_breakdown,
            'quiz_stats': {
                'total_quizzes': len(quiz_attempts),
                'overall_accuracy': round((total_correct / total_questions) * 100, 1) if total_questions else 0,
                'total_correct': total_correct,
                'total_questions': total_questions,
            },
            'total_quizzes': len(quiz_attempts),
            'overall_accuracy': round((total_correct / total_questions) * 100, 1) if total_questions else 0,
            'total_correct': total_correct,
            'total_questions': total_questions,
            
            # Coding data
            'coding_performance': coding_performance,
            'coding_topic_breakdown': coding_topic_breakdown,
            'coding_difficulty_breakdown': coding_difficulty_breakdown,
            'coding_stats': {
                'total_submissions': len(coding_submissions),
                'accepted_submissions': len([s for s in coding_submissions if s.status == 'Accepted']),
                'acceptance_rate': round((len([s for s in coding_submissions if s.status == 'Accepted']) / len(coding_submissions) * 100), 1) if coding_submissions else 0,
                'problems_solved': len([s for s in coding_submissions if s.status == 'Accepted'])
            },
            'total_coding_submissions': len(coding_submissions),
            'accepted_coding_submissions': len([s for s in coding_submissions if s.status == 'Accepted']),
            'coding_acceptance_rate': round((len([s for s in coding_submissions if s.status == 'Accepted']) / len(coding_submissions) * 100), 1) if coding_submissions else 0,
            
            # Interview data
            'interview_performance': interview_performance,
            'interview_stats': {
                'total_sessions': len(interview_sessions),
                'avg_score': avg_interview_score
            },
            'total_interviews': len(interview_sessions),
            'avg_interview_score': avg_interview_score
        }
    
    def generate_insightful_report(self, user_data, user_name, month):
        """Generate AI-powered insightful report using Groq with quiz, coding, and interview data"""
        
        prompt_template = PromptTemplate(
            input_variables=[
                "user_name", "month", "quiz_performance", "subject_breakdown", 
                "coding_performance", "coding_topic_breakdown", "coding_difficulty_breakdown",
                "interview_performance", 
                # Flattened overall_stats variables:
                "total_quizzes", "overall_accuracy", "total_questions", "total_correct",
                "total_coding_submissions", "accepted_coding_submissions", "coding_acceptance_rate",
                "total_interviews", "avg_interview_score"
            ],
            template="""
            You are an experienced educational advisor and performance analyst. Generate a personalized, insightful performance report for a student based on their comprehensive learning data.

            Student Name: {user_name}
            Report Period: {month}
            
            ======= QUIZ PERFORMANCE =======
            - Total Quizzes Taken: {total_quizzes}
            - Overall Accuracy: {overall_accuracy}%
            - Total Questions: {total_questions}
            - Correct Answers: {total_correct}
            
            QUIZ DETAILS:
            {quiz_performance}
            
            SUBJECT-WISE BREAKDOWN:
            {subject_breakdown}
            
            ======= CODING PERFORMANCE =======
            - Total Coding Submissions: {total_coding_submissions}
            - Accepted Submissions: {accepted_coding_submissions}
            - Acceptance Rate: {coding_acceptance_rate}%
            
            TOPIC-WISE CODING PERFORMANCE:
            {coding_topic_breakdown}
            
            DIFFICULTY-WISE CODING PERFORMANCE:
            {coding_difficulty_breakdown}
            
            ======= INTERVIEW PERFORMANCE =======
            - Total Interviews: {total_interviews}
            - Average Interview Score: {avg_interview_score}
            
            INTERVIEW DETAILS:
            {interview_performance}
            
            Please generate a comprehensive performance report that includes:
            
            1. OVERALL PERFORMANCE SUMMARY:
               - Holistic assessment combining quizzes, coding, and interviews
               - Key achievements across all three areas
               - Interconnected skill development analysis
            
            2. QUIZ PERFORMANCE ANALYSIS:
               - Subject-wise strengths and weaknesses
               - Consistency in quiz performance
               - Knowledge retention assessment
            
            3. CODING SKILLS ANALYSIS:
               - Problem-solving ability assessment
               - Language proficiency evaluation
               - Topic-specific coding strengths
               - Difficulty progression analysis
            
            4. INTERVIEW PERFORMANCE ANALYSIS:
               - Communication and problem-solving under pressure
               - Technical explanation skills
               - Consistency in interview performance
            
            5. INTEGRATED SKILL DEVELOPMENT:
               - How quiz knowledge translates to coding
               - How coding skills support interview performance
               - Cross-domain skill transfer analysis
            
            6. PERSONALIZED RECOMMENDATIONS:
               - Targeted study plan combining all three areas
               - Weakness mitigation strategies
               - Strength reinforcement exercises
               - Next month's learning roadmap
            
            7. GOAL SETTING FOR NEXT MONTH:
               - SMART goals for quizzes, coding, and interviews
               - Milestone recommendations
               - Success metrics for each area

            Make the report encouraging, constructive, and highly personalized. Show connections between different skill areas. Use specific data points from all three performance categories to provide meaningful insights.
            
            Format the response in clear sections with appropriate headings. Be specific and provide concrete examples from their performance data.
            """
        )
        
        # Format quiz performance data
        formatted_quiz_performance = "\n".join([
            f"  • {qp['quiz_name']}: {qp['score_percentage']}% ({qp['correct_answers']}/{qp['total_questions']}) on {qp['completion_date']}"
            for qp in user_data['quiz_performance']
        ]) if user_data['quiz_performance'] else "  No quiz attempts this month"
        
        # Format subject breakdown
        formatted_subject_breakdown = "\n".join([
            f"  • {sb['subject']}: {sb['accuracy']}% accuracy ({sb['correct']}/{sb['total']} correct)"
            for sb in user_data['subject_breakdown']
        ]) if user_data['subject_breakdown'] else "  No subject data available"
        
        # Format coding topic breakdown
        formatted_coding_topic_breakdown = "\n".join([
            f"  • {ct['topic']}: {ct['acceptance_rate']}% acceptance rate ({ct['accepted']}/{ct['attempts']} accepted)"
            for ct in user_data['coding_topic_breakdown']
        ]) if user_data['coding_topic_breakdown'] else "  No coding topic data available"
        
        # Format coding difficulty breakdown
        formatted_coding_difficulty_breakdown = "\n".join([
            f"  • {cd['difficulty']}: {cd['acceptance_rate']}% acceptance rate ({cd['accepted']}/{cd['attempts']} accepted)"
            for cd in user_data['coding_difficulty_breakdown']
        ]) if user_data['coding_difficulty_breakdown'] else "  No difficulty data available"
        
        # Format interview performance
        formatted_interview_performance = "\n".join([
            f"  • Interview on {ip['date']}: Score: {ip['score']}/10, Questions: {ip['total_questions']}"
            for ip in user_data['interview_performance']
        ]) if user_data['interview_performance'] else "  No interview sessions this month"
        
        overall_stats = {
            'total_quizzes': user_data['total_quizzes'],
            'overall_accuracy': user_data['overall_accuracy'],
            'total_questions': user_data['total_questions'],
            'total_correct': user_data['total_correct'],
            'total_coding_submissions': user_data['total_coding_submissions'],
            'accepted_coding_submissions': user_data['accepted_coding_submissions'],
            'coding_acceptance_rate': user_data['coding_acceptance_rate'],
            'total_interviews': user_data['total_interviews'],
            'avg_interview_score': user_data['avg_interview_score']
        }
        
        # Unpack overall_stats using ** for the formatted string placeholders
        prompt = prompt_template.format(
            user_name=user_name,
            month=month,
            quiz_performance=formatted_quiz_performance,
            subject_breakdown=formatted_subject_breakdown,
            coding_performance=formatted_coding_topic_breakdown,
            coding_topic_breakdown=formatted_coding_topic_breakdown,
            coding_difficulty_breakdown=formatted_coding_difficulty_breakdown,
            interview_performance=formatted_interview_performance,
            **overall_stats
        )
        
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return response.content
        except Exception as e:
            return f"Unable to generate AI-powered report at this time. Error: {str(e)}"

# Singleton instance
ai_report_generator = AIReportGenerator()