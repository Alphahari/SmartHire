from flask_restful import Resource
from flask import request, jsonify
from datetime import datetime
from models import User, db, Quiz, QuizAttempt, Score, Question, QuizAttempt, Score, Quiz, Chapter 
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
        
        # --- FIX: Make current_time timezone-aware (UTC) ---
        # This prevents the "can't compare offset-naive and offset-aware" error
        current_time = datetime.now(pytz.utc)
        
        if current_time < quiz.start_time:
            return {'error': 'Quiz has not started yet'}, 400
            
        if current_time > quiz.end_time:
            return {'error': 'Quiz has ended'}, 400
        # ---------------------------------------------------

        # Check for existing attempt
        existing_attempt = QuizAttempt.query.filter_by(
            user_id=user_id,
            quiz_id=quiz_id
        ).first()
        
        if existing_attempt and existing_attempt.end_time is not None:
            return {'error': 'Quiz already attempted'}, 400
        
        # If there's an existing in-progress attempt, return it
        if existing_attempt:
            return {
                'attempt_id': existing_attempt.id,
                'start_time': existing_attempt.start_time.isoformat() + 'Z'
            }, 200

        # Create new attempt
        attempt = QuizAttempt(
            user_id=user_id,
            quiz_id=quiz_id,
            start_time=datetime.utcnow() # Database expects naive UTC here (if column is standard DateTime)
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
        
        print(f"=== DEBUG SUBMIT QUIZ ===")
        print(f"User ID: {user_id}, Quiz ID: {quiz_id}")
        print(f"Request data: {data}")
        
        if not user_id:
            return {'error': 'User ID is required'}, 400

        # Check for existing attempt
        attempt = QuizAttempt.query.filter_by(
            user_id=int(user_id),
            quiz_id=quiz_id
        ).first()
        
        print(f"DEBUG: Found attempt: {attempt}")
        if attempt:
            print(f"DEBUG: Attempt ID: {attempt.id}")
            print(f"DEBUG: Attempt user_id: {attempt.user_id}")
            print(f"DEBUG: Attempt quiz_id: {attempt.quiz_id}")
            print(f"DEBUG: Attempt start_time: {attempt.start_time}")
            print(f"DEBUG: Attempt end_time: {attempt.end_time}")

        # Get quiz details
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            print(f"DEBUG: Quiz {quiz_id} not found in database!")
            return {'error': 'Quiz not found'}, 404
        
        print(f"DEBUG: Quiz found: ID={quiz.id}, Chapter={quiz.chapter_id}")
        print(f"DEBUG: Quiz start_time: {quiz.start_time} (type: {type(quiz.start_time)})")
        print(f"DEBUG: Quiz end_time: {quiz.end_time} (type: {type(quiz.end_time)})")
        print(f"DEBUG: Quiz duration: {quiz.duration} minutes")

        # Check if quiz exists in the chapter
        chapter = Chapter.query.get(quiz.chapter_id)
        if chapter:
            print(f"DEBUG: Chapter found: {chapter.name}")
        else:
            print(f"DEBUG: Chapter {quiz.chapter_id} not found!")

        # Get current time with proper timezone handling
        current_time_utc = datetime.utcnow()
        current_time_aware = datetime.now(pytz.utc)
        
        print(f"DEBUG: Current time (UTC naive): {current_time_utc}")
        print(f"DEBUG: Current time (UTC aware): {current_time_aware}")
        
        # Check if quiz times are timezone-aware or naive
        if quiz.start_time:
            if quiz.start_time.tzinfo is None:
                print(f"DEBUG: Quiz start_time is NAIVE (no timezone)")
                # Convert to timezone-aware UTC for comparison
                quiz_start_aware = pytz.utc.localize(quiz.start_time)
            else:
                print(f"DEBUG: Quiz start_time is AWARE, timezone: {quiz.start_time.tzinfo}")
                quiz_start_aware = quiz.start_time.astimezone(pytz.utc)
            
            print(f"DEBUG: Quiz start_time (aware UTC): {quiz_start_aware}")
            print(f"DEBUG: Current time < Quiz start_time? {current_time_aware < quiz_start_aware}")
        
        if quiz.end_time:
            if quiz.end_time.tzinfo is None:
                print(f"DEBUG: Quiz end_time is NAIVE (no timezone)")
                # Convert to timezone-aware UTC for comparison
                quiz_end_aware = pytz.utc.localize(quiz.end_time)
            else:
                print(f"DEBUG: Quiz end_time is AWARE, timezone: {quiz.end_time.tzinfo}")
                quiz_end_aware = quiz.end_time.astimezone(pytz.utc)
            
            print(f"DEBUG: Quiz end_time (aware UTC): {quiz_end_aware}")
            print(f"DEBUG: Current time > Quiz end_time? {current_time_aware > quiz_end_aware}")

        if not attempt:
            print("DEBUG: No existing attempt found, checking if we should create one...")
            
            # Time validation
            quiz_start_aware = pytz.utc.localize(quiz.start_time) if quiz.start_time.tzinfo is None else quiz.start_time.astimezone(pytz.utc)
            quiz_end_aware = pytz.utc.localize(quiz.end_time) if quiz.end_time.tzinfo is None else quiz.end_time.astimezone(pytz.utc)
            
            if current_time_aware < quiz_start_aware:
                print(f"DEBUG: Quiz has not started yet! Current: {current_time_aware}, Start: {quiz_start_aware}")
                return {'error': 'Quiz has not started yet'}, 400
                
            if current_time_aware > quiz_end_aware:
                print(f"DEBUG: Quiz has ended! Current: {current_time_aware}, End: {quiz_end_aware}")
                return {'error': 'Quiz has ended'}, 400
            
            # Create a new attempt
            print("DEBUG: Creating new quiz attempt...")
            attempt = QuizAttempt(
                user_id=int(user_id),
                quiz_id=quiz_id,
                start_time=current_time_utc  # Use naive UTC for database
            )
            db.session.add(attempt)
            db.session.flush()
            print(f"DEBUG: Created new attempt with ID: {attempt.id}")
            
        elif attempt.end_time is not None:
            print(f"DEBUG: Attempt already submitted at {attempt.end_time}")
            return {'error': 'Quiz already submitted'}, 400

        # Calculate time spent
        time_remaining = data.get('time_remaining', 0)
        time_spent = (quiz.duration * 60) - time_remaining
        print(f"DEBUG: Time remaining: {time_remaining}s, Time spent: {time_spent}s")

        # Update attempt
        attempt.end_time = current_time_utc
        attempt.time_spent = time_spent
        
        # Get all questions for this quiz
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        print(f"DEBUG: Found {len(questions)} questions for quiz {quiz_id}")
        
        # Create score records for all questions
        answers = data.get('answers', {})
        print(f"DEBUG: Answers received: {answers}")
        
        for question in questions:
            selected_option = answers.get(str(question.id))
            print(f"DEBUG: Question {question.id}: selected_option={selected_option}")
            
            score = Score(
                user_id=int(user_id),
                quiz_id=quiz_id,
                question_id=question.id,
                selected_option=selected_option,
                attempt_id=attempt.id
            )
            db.session.add(score)

        try:
            db.session.commit()
            print(f"DEBUG: Successfully submitted quiz {quiz_id} for user {user_id}")
            print(f"=== END DEBUG ===")
            return {
                'message': 'Quiz submitted successfully',
                'attempt_id': attempt.id
            }, 200
        except Exception as e:
            db.session.rollback()
            print(f"DEBUG: Error committing to database: {str(e)}")
            print(f"=== END DEBUG ===")
            return {'error': f'Database error: {str(e)}'}, 500

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
class DebugQuizState(Resource):
    def post(self):
        """Debug endpoint to check quiz state"""
        data = request.get_json()
        user_id = data.get('user_id')
        quiz_id = data.get('quiz_id')
        
        if not user_id or not quiz_id:
            return {'error': 'User ID and Quiz ID required'}, 400
        
        print(f"=== DEBUG QUIZ STATE ===")
        
        # Check user
        user = User.query.get(user_id)
        print(f"User: {user}")
        
        # Check quiz
        quiz = Quiz.query.get(quiz_id)
        print(f"Quiz: {quiz}")
        
        if quiz:
            print(f"Quiz details:")
            print(f"  ID: {quiz.id}")
            print(f"  Chapter ID: {quiz.chapter_id}")
            print(f"  Start time: {quiz.start_time} (type: {type(quiz.start_time)})")
            print(f"  End time: {quiz.end_time} (type: {type(quiz.end_time)})")
            print(f"  Duration: {quiz.duration} minutes")
            
            # Check chapter
            chapter = Chapter.query.get(quiz.chapter_id)
            if chapter:
                print(f"  Chapter: {chapter.name}")
        
        # Check attempts
        attempts = QuizAttempt.query.filter_by(
            user_id=int(user_id),
            quiz_id=quiz_id
        ).all()
        
        print(f"Found {len(attempts)} attempts:")
        for attempt in attempts:
            print(f"  Attempt ID: {attempt.id}")
            print(f"    Start: {attempt.start_time}")
            print(f"    End: {attempt.end_time}")
            print(f"    Time spent: {attempt.time_spent}")
        
        # Check questions
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        print(f"Found {len(questions)} questions for this quiz")
        
        # Current time
        current_utc = datetime.utcnow()
        current_aware = datetime.now(pytz.utc)
        print(f"Current time (UTC naive): {current_utc}")
        print(f"Current time (UTC aware): {current_aware}")
        
        # Time validation if quiz exists
        if quiz:
            quiz_start = quiz.start_time
            quiz_end = quiz.end_time
            
            if quiz_start and quiz_end:
                # Make both timezone aware for comparison
                if quiz_start.tzinfo is None:
                    quiz_start_aware = pytz.utc.localize(quiz_start)
                else:
                    quiz_start_aware = quiz_start.astimezone(pytz.utc)
                    
                if quiz_end.tzinfo is None:
                    quiz_end_aware = pytz.utc.localize(quiz_end)
                else:
                    quiz_end_aware = quiz_end.astimezone(pytz.utc)
                
                print(f"Quiz start (aware): {quiz_start_aware}")
                print(f"Quiz end (aware): {quiz_end_aware}")
                print(f"Is current time < quiz start? {current_aware < quiz_start_aware}")
                print(f"Is current time > quiz end? {current_aware > quiz_end_aware}")
                print(f"Is current time within quiz window? {quiz_start_aware <= current_aware <= quiz_end_aware}")
        
        print(f"=== END DEBUG ===")
        
        return {
            'user_exists': user is not None,
            'quiz_exists': quiz is not None,
            'attempts_count': len(attempts),
            'questions_count': len(questions),
            'current_time_utc': current_utc.isoformat(),
            'quiz_start': quiz.start_time.isoformat() if quiz else None,
            'quiz_end': quiz.end_time.isoformat() if quiz else None
        }, 200

def register_quiz_routes(api):
    api.add_resource(StartQuiz, '/quizzes/<int:quiz_id>/start')
    api.add_resource(SubmitQuiz, '/quizzes/<int:quiz_id>/submit')
    api.add_resource(QuizAttemptStatus, '/quizzes/attempts')
    api.add_resource(QuizResults, '/quiz_attempts/<int:attempt_id>/results')
    api.add_resource(GetAttemptByQuiz, '/quizzes/attempt')
    api.add_resource(UserQuizAttempts, '/user/quiz_attempts')
    api.add_resource(DebugQuizState, '/debug/quiz-state')  # Add this line