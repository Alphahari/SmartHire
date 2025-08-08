from flask_restful import Resource
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime
from models import db, Quiz, QuizAttempt, Score, Question
import pytz
# from extensions import cache

class GetAttemptByQuiz(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        quiz_id = request.args.get('quiz_id')

        if not quiz_id:
            return {'error': 'Quiz ID is required'}, 400

        attempt = QuizAttempt.query.filter_by(
            user_id=int(current_user_id),
            quiz_id=quiz_id
        ).first()

        if not attempt:
            return {'error': 'No attempt found'}, 404

        return {'attempt_id': attempt.id}, 200

class QuizResults(Resource):
    # @cache.cached(timeout=3600, query_string=True)
    @jwt_required()
    def get(self, attempt_id):
        current_user_id = get_jwt_identity()
        
        # Fetch the quiz attempt
        attempt = QuizAttempt.query.get_or_404(attempt_id)
        if attempt.user_id != int(current_user_id):
            return {'error': 'Unauthorized'}, 401

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
    @jwt_required()
    def post(self, quiz_id):
        current_user_id = get_jwt_identity()
        quiz = Quiz.query.get_or_404(quiz_id)
        
        # Check for ANY existing attempt (completed or not)
        existing_attempt = QuizAttempt.query.filter_by(
            user_id=int(current_user_id),
            quiz_id=quiz_id
        ).first()
        
        if existing_attempt:
            return {'error': 'You have already attempted this quiz'}, 200

        # Create new attempt
        attempt = QuizAttempt(
            user_id=int(current_user_id),
            quiz_id=quiz_id,
            start_time=datetime.utcnow()
        )
        db.session.add(attempt)
        db.session.commit()
        
        # Fix datetime conversion
        return {
            'attempt_id': attempt.id,
            'start_time': attempt.start_time.isoformat() + 'Z'  # UTC format
        }, 201

class SubmitQuiz(Resource):
    @jwt_required()
    def post(self, quiz_id):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Check for existing attempt
        attempt = QuizAttempt.query.filter_by(
            user_id=int(current_user_id),
            quiz_id=quiz_id,
            end_time=None
        ).first()

        if not attempt:
            return {'error': 'No active quiz attempt found'}, 400

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
                user_id=int(current_user_id),
                quiz_id=quiz_id,
                question_id=question.id,
                selected_option=selected_option,  # Can be None
                attempt_id=attempt.id
            )
            db.session.add(score)

        db.session.commit()
        return {'message': 'Quiz submitted successfully'}, 200      

class QuizAttemptStatus(Resource):
    @jwt_required()
    # @cache.cached(timeout=300, query_string=True)
    def get(self):
        
        current_user_id = get_jwt_identity()
        chapter_id = request.args.get('chapter_id')
        
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

from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify
from sqlalchemy.orm import joinedload
from models import QuizAttempt, Score, Quiz, Chapter  # adjust imports as needed

class UserQuizAttempts(Resource):
    # @cache.cached(timeout=600, key_prefix=lambda: f"user_attempts_{get_jwt_identity()}")
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()

        # Fetch all quiz attempts by the user, along with related quiz, chapter, and subject info
        attempts = QuizAttempt.query.filter_by(user_id=int(current_user_id)).options(
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