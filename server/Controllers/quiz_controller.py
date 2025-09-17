from flask_restful import Resource
from flask import request, jsonify
from datetime import datetime
from models import db, Quiz, QuizAttempt, Score, Question, QuizAttempt, Score, Quiz, Chapter 
import pytz
# from extensions import cache
from sqlalchemy.orm import joinedload

class GetAttemptByQuiz(Resource):
    def post(self):
        data = request.get_json()
        current_user_id = data.get('user_id')
        quiz_id = data.get('quiz_id')

        if not current_user_id:
            return {'error': 'User ID is required'}, 401
        if not quiz_id:
            return {'error': 'Quiz ID is required'}, 400

        # Find the most recent attempt for this user and quiz
        attempt = QuizAttempt.query.filter_by(
            user_id=int(current_user_id),
            quiz_id=quiz_id
        ).order_by(QuizAttempt.start_time.desc()).first()

        if not attempt:
            # Return a successful response with no attempt found
            return {
                'has_attempt': False,
                'message': 'No attempt found'
            }, 200

        # Check if the attempt is completed (has end_time)
        if attempt.end_time is not None:
            return {
                'has_attempt': True,
                'attempt_id': attempt.id,
                'completed': True,
                'end_time': attempt.end_time.isoformat() + 'Z'
            }, 200
        else:
            return {
                'has_attempt': True,
                'attempt_id': attempt.id,
                'completed': False,
                'start_time': attempt.start_time.isoformat() + 'Z'
            }, 200

class QuizResults(Resource):
    def post(self, attempt_id):
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return {'error': 'User ID is required'}, 400

        # Fetch the quiz attempt
        attempt = QuizAttempt.query.get_or_404(attempt_id)
        
        # Check if the user is authorized to view these results
        if attempt.user_id != int(user_id):
            return {'error': 'Unauthorized to view these results'}, 403

        # Fetch all scores for this attempt
        scores = Score.query.filter_by(attempt_id=attempt_id).all()
        
        # Calculate results
        results = []
        correct_count = 0
        
        for score in scores:
            question = Question.query.get(score.question_id)
            is_correct = score.selected_option == question.correct_option
            if is_correct:
                correct_count += 1
                
            results.append({
                'question_id': question.id,
                'statement': question.question_statement,
                'options': [
                    question.option1,
                    question.option2,
                    question.option3,
                    question.option4
                ],
                'correct_option': question.correct_option,
                'selected_option': score.selected_option,
                'is_correct': is_correct
            })
        
        # Return quiz results
        return {
            'quiz_id': attempt.quiz_id,
            'attempt_id': attempt.id,
            'start_time': attempt.start_time.isoformat() + 'Z',
            'end_time': attempt.end_time.isoformat() + 'Z' if attempt.end_time else None,
            'time_spent': attempt.time_spent,
            'total_questions': len(results),
            'correct_answers': correct_count,
            'score_percentage': round((correct_count / len(results)) * 100) if results else 0,
            'questions': results
        }
    
class StartQuiz(Resource):
    def post(self, quiz_id):
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return {'error': 'User ID is required'}, 400

        quiz = Quiz.query.get_or_404(quiz_id)
        
        # Check if current time is within quiz availability window
        current_time = datetime.utcnow()
        if current_time < quiz.start_time:
            return {'error': 'Quiz has not started yet'}, 400
            
        if current_time > quiz.end_time:
            return {'error': 'Quiz has ended'}, 400

        # Check if user has already completed this quiz
        existing_attempt = QuizAttempt.query.filter_by(
            user_id=user_id,
            quiz_id=quiz_id
        ).first()
        
        if existing_attempt and existing_attempt.end_time is not None:
            return {'error': 'Quiz already attempted'}, 400
        
        # If there's an existing attempt but not completed, return it
        if existing_attempt:
            return {
                'attempt_id': existing_attempt.id,
                'start_time': existing_attempt.start_time.isoformat() + 'Z'
            }, 200

        # Create new attempt
        attempt = QuizAttempt(
            user_id=user_id,
            quiz_id=quiz_id,
            start_time=datetime.utcnow()
        )
        db.session.add(attempt)
        db.session.commit()
        
        return {
            'attempt_id': attempt.id,
            'start_time': attempt.start_time.isoformat() + 'Z'
        }, 201

class SubmitQuiz(Resource):
    def post(self, quiz_id):
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return {'error': 'User ID is required'}, 400

        # Check for existing attempt (both completed and in-progress)
        attempt = QuizAttempt.query.filter_by(
            user_id=user_id,
            quiz_id=quiz_id
        ).first()
        
        print(f"SubmitQuiz: Looking for attempt for user {user_id} on quiz {quiz_id}")
        print(f"SubmitQuiz: Found attempt: {attempt}")
        
        if not attempt:
            return {'error': 'No quiz attempt found'}, 400
            
        if attempt.end_time is not None:
            return {'error': 'Quiz already submitted'}, 400

        # Calculate time spent
        quiz = Quiz.query.get_or_404(quiz_id)
        time_spent = (quiz.duration * 60) - data.get('time_remaining', 0)

        # Update attempt
        attempt.end_time = datetime.utcnow()
        attempt.time_spent = time_spent
        
        # Get all questions for this quiz
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        
        # Create score records for all questions
        for question in questions:
            selected_option = data.get('answers', {}).get(str(question.id))
            score = Score(
                user_id=int(user_id),
                quiz_id=quiz_id,
                question_id=question.id,
                selected_option=selected_option,
                attempt_id=attempt.id
            )
            db.session.add(score)

        db.session.commit()
        print(f"SubmitQuiz: Successfully submitted quiz {quiz_id} for user {user_id}")
        return {'message': 'Quiz submitted successfully'}, 200    

class QuizAttemptStatus(Resource):
    def post(self):  # Change from get to post
        data = request.get_json()
        current_user_id = data.get('user_id')
        chapter_id = data.get('chapter_id')  # Get from body instead of query params
        
        if not current_user_id:
            return {'error': 'User ID is required'}, 401
        
        # Get all quiz attempts for this user in the chapter
        attempts = QuizAttempt.query.filter_by(
            user_id=int(current_user_id)
        ).join(Quiz).filter(
            Quiz.chapter_id == chapter_id
        ).all()
        
        # Return just the quiz IDs
        return [{
            'quiz_id': a.quiz_id,
            'attempted': True
        } for a in attempts]     


# In quiz_controller.py, update the UserQuizAttempts class
class UserQuizAttempts(Resource):
    def post(self):
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return {'error': 'User ID is required'}, 401
        
        # Fetch all quiz attempts by the user, along with related quiz, chapter, and subject info
        attempts = QuizAttempt.query.filter_by(user_id=int(user_id)).options(
            joinedload(QuizAttempt.quiz)
                .joinedload(Quiz.chapter)
                .joinedload(Chapter.subject),
            joinedload(QuizAttempt.quiz)
                .joinedload(Quiz.questions)
        ).order_by(QuizAttempt.start_time.desc()).all()

        if not attempts:
            return jsonify([])

        results = []
        for attempt in attempts:
            # Retrieve all scores for this attempt
            scores = Score.query.filter_by(attempt_id=attempt.id).all()

            # Count correct answers
            correct_count = sum(
                1 for score in scores
                if score.selected_option == score.question.correct_option
            )

            total_questions = len(attempt.quiz.questions)

            results.append({
                "attempt_id": attempt.id,
                "quiz_id": attempt.quiz_id,
                "quiz_title": f"{attempt.quiz.chapter.subject.name} - {attempt.quiz.chapter.name}",
                "start_time": attempt.start_time.isoformat() + "Z",
                "end_time": attempt.end_time.isoformat() + "Z" if attempt.end_time else None,
                "time_spent": attempt.time_spent,
                "score": f"{correct_count}/{total_questions}",
                "percentage": round((correct_count / total_questions) * 100) if total_questions > 0 else 0,
                "chapter_id": attempt.quiz.chapter_id,
                "subject_id": attempt.quiz.chapter.subject_id
            })

        return jsonify(results)


def register_quiz_routes(api):
    api.add_resource(StartQuiz, '/quizzes/<int:quiz_id>/start')
    api.add_resource(SubmitQuiz, '/quizzes/<int:quiz_id>/submit')
    api.add_resource(QuizAttemptStatus, '/quizzes/attempts')
    api.add_resource(QuizResults, '/quiz_attempts/<int:attempt_id>/results')
    api.add_resource(GetAttemptByQuiz, '/quizzes/attempt')
    api.add_resource(UserQuizAttempts, '/user/quiz_attempts')