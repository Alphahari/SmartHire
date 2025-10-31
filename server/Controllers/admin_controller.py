from flask import jsonify, request
from flask_restful import Resource
from models import QuizAttempt, db, User, Subject, Chapter, Quiz, Question, Score
from functools import wraps
from datetime import datetime, timedelta
import pytz
from sqlalchemy.orm import joinedload
from sqlalchemy import func, or_
# from extensions import cache

# Helper functions
def convert_to_ist1(dt):
    if not dt:
        return None
        
    IST = pytz.timezone("Asia/Kolkata")
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    return dt.astimezone(IST)

def convert_to_ist2(dt):
    if not dt:
        return None
        
    IST = pytz.timezone("Asia/Kolkata")
    
    # Handle string inputs
    if isinstance(dt, str):
        try:
            # Parse date strings
            dt = datetime.strptime(dt, '%Y-%m-%d').date()
            return dt.isoformat()  # Return as-is for date-only strings
        except:
            # Try parsing datetime strings
            try:
                naive_dt = datetime.fromisoformat(dt)
                return naive_dt.astimezone(IST).isoformat()
            except:
                return dt  # Fallback to original string
    
    # Handle datetime objects
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    return dt.astimezone(IST).isoformat()

def parse_ist_datetime(dt_str):
    if not dt_str:
        return None        
    try:
        naive_dt = datetime.fromisoformat(dt_str)
        IST = pytz.timezone("Asia/Kolkata")
        localized = IST.localize(naive_dt)
        return localized.astimezone(pytz.utc)  
    except Exception as e:
        raise ValueError(f"Invalid datetime format: {str(e)}")

def format_response(quiz):
    return {
        'id': quiz.id,
        'chapter_id': quiz.chapter_id,
        'start_time': convert_to_ist1(quiz.start_time).isoformat(),
        'end_time': convert_to_ist1(quiz.end_time).isoformat(),
        'duration': quiz.duration,
        'remarks': quiz.remarks
    }


def register_admin_routes(api):
    class AdminUsers(Resource):
        def get(self):
            users = User.query.all()
            return jsonify([{
                'id': u.id,
                'email': u.email,  
                'role': u.role.value,
                'full_name': u.full_name,
            } for u in users])
    
    class AdminUser(Resource):
        # @admin_required
        def delete(self, id):
            user = User.query.get(id)
            if not user:
                return {'message': 'User not found'}, 404
            QuizAttempt.query.filter_by(user_id=id).delete()
            Score.query.filter_by(user_id=id).delete()

            db.session.delete(user)
            db.session.commit()
            return {'message': 'User deleted successfully'}
        
    class AdminSubjects(Resource):
        # @admin_required
        def post(self):
            data = request.get_json()
            name = data.get('name')
            description = data.get('description')

            new_subject = Subject(name=name, description=description)
            db.session.add(new_subject)
            db.session.commit()
            # cache.delete_memoized("user_subjects")
            # cache.delete("user_subjects")
            return {
                'id': new_subject.id,
                'name': new_subject.name,
                'description': new_subject.description
            }, 201

    class AdminSubject(Resource):
        # @admin_required
        def put(self, id):
            data = request.get_json()
            name = data.get('name')
            description = data.get('description')

            subject = Subject.query.get(id)
            if not subject:
                return {'message': 'Subject not found'}, 404

            subject.name = name
            subject.description = description
            db.session.commit()
            # cache.delete("user_subjects")
            return {'message': 'Subject updated'}

        # @admin_required
        def delete(self, id):
            subject = Subject.query.get(id)
            if not subject:
                return {'message': 'Subject not found'}, 404
            
            try:
                # The cascade should automatically delete chapters, quizzes, questions, etc.
                db.session.delete(subject)
                db.session.commit()
                
                # Clear relevant caches
                # cache.delete("user_subjects")
                # cache.delete_memoized("user_subjects")
                
                return {'message': 'Subject and all associated data deleted successfully'}, 200
            except Exception as e:
                db.session.rollback()
                return {'error': f'Failed to delete subject: {str(e)}'}, 500

    class AdminChapters(Resource):
        # @admin_required
        def post(self):
            data = request.get_json()
            name = data.get('name')
            description = data.get('description')
            subject_id = data.get('subject_id')

            new_chapter = Chapter(
                name=name,
                description=description,
                subject_id=subject_id
            )
            db.session.add(new_chapter)
            db.session.commit()
            # cache.delete(f"subject_{subject_id}")
            return {
                'id': new_chapter.id,
                'name': new_chapter.name,
                'description': new_chapter.description,
                'subject_id': new_chapter.subject_id
            }, 201

    class AdminChapter(Resource):
        # @admin_required
        def put(self, id):
            data = request.get_json()
            name = data.get('name')
            description = data.get('description')

            chapter = Chapter.query.get(id)
            if not chapter:
                return {'message': 'Chapter not found'}, 404

            chapter.name = name
            chapter.description = description
            db.session.commit()
            # cache.delete(f"subject_{chapter.subject_id}")
            return {'message': 'Chapter updated'}

        def delete(self, id):
            chapter = Chapter.query.get(id)
            if not chapter:
                return {'message': 'Chapter not found'}, 404
            
            subject_id = chapter.subject_id
            
            try:
                # Cascade should automatically delete quizzes, questions, etc.
                db.session.delete(chapter)
                db.session.commit()
                
                # Clear relevant caches
                # cache.delete(f"subject_{subject_id}")
                
                return {'message': 'Chapter and all associated quizzes deleted successfully'}, 200
            except Exception as e:
                db.session.rollback()
                return {'error': f'Failed to delete chapter: {str(e)}'}, 500
    class AdminQuizzes(Resource):
        # @admin_required
        def post(self):
            data = request.get_json()
            chapter_id = data.get('chapter_id')
            start_str = data.get('start_time')
            end_str = data.get('end_time')
            duration = data.get('duration') 
            remarks = data.get('remarks')

            try:
                start_time = parse_ist_datetime(start_str)
            except Exception as e:
                return {'error': f'Invalid start_time: {str(e)}'}, 400

            try:
                end_time = parse_ist_datetime(end_str)
            except Exception as e:
                return {'error': f'Invalid end_time: {str(e)}'}, 400

            chapter = Chapter.query.get(chapter_id)
            if not chapter:
                return {'error': 'Chapter not found'}, 404

            new_quiz = Quiz(
                chapter_id=chapter_id,
                start_time=start_time,
                end_time=end_time,
                duration=duration,
                remarks=remarks
            )
            db.session.add(new_quiz)
            db.session.commit()
            # cache.delete(f"chapter_{chapter_id}")
            return format_response(new_quiz), 201

    class AdminQuiz(Resource):
        # @admin_required
        def put(self, id):
            quiz = Quiz.query.get(id)
            if not quiz:
                return {'error': 'Quiz not found'}, 404

            data = request.get_json()
            chapter_id = data.get('chapter_id')
            start_str = data.get('start_time')
            end_str = data.get('end_time')
            duration = data.get('duration')
            remarks = data.get('remarks')

            if chapter_id:
                chapter = Chapter.query.get(chapter_id)
                if not chapter:
                    return {'error': 'Chapter not found'}, 404
                quiz.chapter_id = chapter_id

            if start_str:
                try:
                    quiz.start_time = parse_ist_datetime(start_str)
                except Exception as e:
                    return {'error': f'Invalid start_time: {str(e)}'}, 400
            if end_str:
                try:
                    quiz.end_time = parse_ist_datetime(end_str)
                except Exception as e:
                    return {'error': f'Invalid end_time: {str(e)}'}, 400

            if duration:
                try:
                    quiz.duration = int(duration)
                except ValueError:
                    return {'error': 'Duration must be an integer'}, 400

            if remarks:
                quiz.remarks = remarks

            db.session.commit()
            # cache.delete(f"chapter_{chapter_id}")
            return jsonify(format_response(quiz))

        def delete(self, id):
            quiz = Quiz.query.get(id)
            if not quiz:
                return {'error': 'Quiz not found'}, 404
            
            chapter_id = quiz.chapter_id
            
            try:
                # Cascade should automatically delete questions, scores, attempts
                db.session.delete(quiz)
                db.session.commit()
                
                # Clear relevant caches
                # cache.delete(f"chapter_{chapter_id}")
                
                return {'message': 'Quiz and all associated questions deleted successfully'}, 200
            except Exception as e:
                db.session.rollback()
                return {'error': f'Failed to delete quiz: {str(e)}'}, 500

    class AdminQuestions(Resource):
        # @admin_required
        def post(self, quiz_id):
            quiz = Quiz.query.get(quiz_id)
            if not quiz:
                return {'error': 'Quiz not found'}, 404

            data = request.get_json()
            new_question = Question(
                quiz_id=quiz_id,
                question_statement=data['question_statement'],
                option1=data['option1'],
                option2=data['option2'],
                option3=data['option3'],
                option4=data['option4'],
                correct_option=data['correct_option']
            )
            db.session.add(new_question)
            db.session.commit()
            return {
                'id': new_question.id,
                'quiz_id': new_question.quiz_id,
                'question_statement': new_question.question_statement,
                'options': [
                    new_question.option1,
                    new_question.option2,
                    new_question.option3,
                    new_question.option4
                ],
                'correct_option': new_question.correct_option
            }, 201

    class AdminQuestion(Resource):
        # @admin_required
        def get(self, id):
            question = Question.query.get(id)
            if not question:
                return {'error': 'Question not found'}, 404
            return {
                'id': question.id,
                'quiz_id': question.quiz_id,
                'question_statement': question.question_statement,
                'options': [
                    question.option1,
                    question.option2,
                    question.option3,
                    question.option4
                ],
                'correct_option': question.correct_option
            }

        # @admin_required
        def put(self, id):
            question = Question.query.get(id)
            if not question:
                return {'error': 'Question not found'}, 404

            data = request.get_json()
            fields = ['question_statement', 'option1', 'option2', 'option3', 'option4', 'correct_option']
            
            for field in fields:
                if field in data:
                    setattr(question, field, data[field])
            
            db.session.commit()
            return {
                'id': question.id,
                'quiz_id': question.quiz_id,
                'question_statement': question.question_statement,
                'options': [
                    question.option1,
                    question.option2,
                    question.option3,
                    question.option4
                ],
                'correct_option': question.correct_option
            }

        # @admin_required
        def delete(self, id):
            question = Question.query.get(id)
            if not question:
                return {'error': 'Question not found'}, 404
            db.session.delete(question)
            db.session.commit()
            return {'message': 'Question deleted successfully'}, 200

    class AdminSearch(Resource):
        # @admin_required
        def get(self):
            search_term = request.args.get('q', '').strip()
            if not search_term:
                return jsonify({
                    'users': [],
                    'subjects': [],
                    'chapters': [],
                    'quizzes': [],
                    'questions': []
                })
            
            # Search users
            user_results = User.query.filter(
                or_(
                    User.username.ilike(f'%{search_term}%'),
                    User.email.ilike(f'%{search_term}%'),
                    User.full_name.ilike(f'%{search_term}%')
                )
            ).all()
            
            # Search subjects
            subject_results = Subject.query.filter(
                Subject.name.ilike(f'%{search_term}%')
            ).all()
            
            # Search chapters
            chapter_results = Chapter.query.filter(
                Chapter.name.ilike(f'%{search_term}%')
            ).all()
            
            # Search quizzes
            quiz_results = Quiz.query.filter(
                Quiz.remarks.ilike(f'%{search_term}%')
            ).all()
            
            question_results = db.session.query(
                Question.id,
                Question.quiz_id,
                Question.question_statement,
                Question.correct_option,
                Quiz.chapter_id,
                Chapter.subject_id
            ).join(Quiz, Question.quiz_id == Quiz.id
            ).join(Chapter, Quiz.chapter_id == Chapter.id
            ).filter(
                Question.question_statement.ilike(f'%{search_term}%')
            ).all()

            # Format results
            formatted_questions = [{
                'id': q[0],
                'quiz_id': q[1],
                'question_statement': q[2],
                'correct_option': q[3],
                'chapter_id': q[4],
                'subject_id': q[5]
            } for q in question_results]
                        
            return jsonify({
                'users': [{
                    'id': u.id,
                    'username': u.username,
                    'email': u.email,
                    'role': u.role.value,
                    'full_name': u.full_name
                } for u in user_results],
                'subjects': [{
                    'id': s.id,
                    'name': s.name,
                    'description': s.description
                } for s in subject_results],
                'chapters': [{
                    'id': c.id,
                    'name': c.name,
                    'description': c.description,
                    'subject_id': c.subject_id
                } for c in chapter_results],
                'quizzes': [{
                    'id': q.id,
                    'chapter_id': q.chapter_id,
                    'start_time': convert_to_ist1(q.start_time).isoformat(),
                    'end_time': convert_to_ist1(q.end_time).isoformat(),
                    'duration': q.duration,
                    'remarks': q.remarks
                } for q in quiz_results],
                'questions': formatted_questions
            })
    class AdminQuestionsInQuiz(Resource):
        def get(self, quiz_id):
            quiz = Quiz.query.options(
                joinedload(Quiz.chapter).joinedload(Chapter.subject)
            ).get(quiz_id)
            
            if not quiz:
                return {'error': 'Quiz not found'}, 404
            return jsonify({
                'id': quiz.id,
                'start_time': quiz.start_time,
                'end_time': quiz.end_time,
                'duration': quiz.duration,
                'chapter': {
                    'id': quiz.chapter.id,
                    'name': quiz.chapter.name,
                    'subject': {
                        'id': quiz.chapter.subject.id,
                        'name': quiz.chapter.subject.name
                    }
                },
                'questions': [{
                    'id': q.id,
                    'question_statement': q.question_statement,
                    'option1': q.option1,
                    'option2': q.option2,
                    'option3': q.option3,
                    'option4': q.option4,
                    'correct_option':q.correct_option
                } for q in quiz.questions]
            })
    # Register all resources
    api.add_resource(AdminUsers, '/admin/users')
    api.add_resource(AdminUser, '/admin/users/<int:id>')
    api.add_resource(AdminSubjects, '/admin/subjects')
    api.add_resource(AdminSubject, '/admin/subjects/<int:id>')
    api.add_resource(AdminChapters, '/admin/chapters')
    api.add_resource(AdminChapter, '/admin/chapters/<int:id>')
    api.add_resource(AdminQuizzes, '/admin/quizzes')
    api.add_resource(AdminQuiz, '/admin/quizzes/<int:id>')
    api.add_resource(AdminQuestions, '/admin/quizzes/<int:quiz_id>/questions')
    api.add_resource(AdminQuestion, '/admin/questions/<int:id>')
    api.add_resource(AdminSearch, '/admin/search')
    api.add_resource(AdminQuestionsInQuiz, '/admin/quiz/<int:quiz_id>')


    class AdminSummaryStats(Resource):
        # @admin_required
        def get(self):
            # Get query parameters
            days = request.args.get('days', '30')
            subject_id = request.args.get('subject', 'all')
            user_type = request.args.get('userType', 'all')
            
            # Calculate date range
            if days == 'all':
                start_date = None
            else:
                start_date = datetime.utcnow() - timedelta(days=int(days))
            
            # Total users
            total_users = User.query.count()
            
            # Active users (logged in within the time range)
            active_users = User.query
            if start_date:
                active_users = active_users.filter(User.last_visited >= start_date)
            active_users_count = active_users.count()
            
            # Quizzes taken
            quizzes_taken = QuizAttempt.query
            if start_date:
                quizzes_taken = quizzes_taken.filter(QuizAttempt.end_time >= start_date)
            quizzes_taken_count = quizzes_taken.count()
            
            # Average score
            avg_score = 0
            if quizzes_taken_count > 0:
                # Calculate average score across all attempts
                total_correct = 0
                total_questions = 0
                
                for attempt in quizzes_taken:
                    scores = Score.query.filter_by(attempt_id=attempt.id).all()
                    correct_in_attempt = sum(
                        1 for score in scores
                        if score.selected_option == score.question.correct_option
                    )
                    total_correct += correct_in_attempt
                    total_questions += len(scores)
                
                if total_questions > 0:
                    avg_score = round((total_correct / total_questions) * 100, 1)
            
            return {
                'totalUsers': total_users,
                'activeUsers': active_users_count,
                'quizzesTaken': quizzes_taken_count,
                'avgScore': avg_score
            }, 200

    class AdminUserGrowth(Resource):
        # @admin_required
        def get(self):
            days = request.args.get('days', '30')
            
            # Calculate date range
            if days == 'all':
                start_date = None
            else:
                start_date = datetime.utcnow() - timedelta(days=int(days))
            
            # Group users by creation date
            query = db.session.query(
                func.date(User.created_at).label('date'),
                func.count(User.id).label('count')
            )
            
            if start_date:
                query = query.filter(User.created_at >= start_date)
            
            results = query.group_by(func.date(User.created_at)).all()
            
            # Format results
            labels = [convert_to_ist2(result[0]) for result in results]
            values = [result[1] for result in results]
            
            return {
                'labels': labels,
                'values': values
            }, 200

    class AdminSubjectPerformance(Resource):
        # @admin_required
        def get(self):
            # Get average score per subject
            subjects = Subject.query.all()
            subject_data = []
            
            for subject in subjects:
                # Get all quizzes in this subject
                quizzes = Quiz.query.join(Chapter).filter(Chapter.subject_id == subject.id).all()
                quiz_ids = [quiz.id for quiz in quizzes]
                
                # Get all attempts for these quizzes
                attempts = QuizAttempt.query.filter(QuizAttempt.quiz_id.in_(quiz_ids)).all()
                
                total_correct = 0
                total_questions = 0
                
                for attempt in attempts:
                    scores = Score.query.filter_by(attempt_id=attempt.id).all()
                    correct_in_attempt = sum(
                        1 for score in scores
                        if score.selected_option == score.question.correct_option
                    )
                    total_correct += correct_in_attempt
                    total_questions += len(scores)
                
                avg_score = 0
                if total_questions > 0:
                    avg_score = round((total_correct / total_questions) * 100, 1)
                
                subject_data.append({
                    'subject': subject.name,
                    'avg_score': avg_score
                })
            
            # Sort by average score descending
            subject_data.sort(key=lambda x: x['avg_score'], reverse=True)
            
            return {
                'labels': [s['subject'] for s in subject_data],
                'values': [s['avg_score'] for s in subject_data]
            }, 200

    class AdminQuizActivity(Resource):
        # @admin_required
        def get(self):
            days = request.args.get('days', '30')
            
            # Calculate date range
            if days == 'all':
                start_date = None
            else:
                start_date = datetime.utcnow() - timedelta(days=int(days))
            
            # Group quiz attempts by date
            query = db.session.query(
                func.date(QuizAttempt.end_time).label('date'),
                func.count(QuizAttempt.id).label('count')
            ).filter(QuizAttempt.end_time.isnot(None))
            
            if start_date:
                query = query.filter(QuizAttempt.end_time >= start_date)
            
            results = query.group_by(func.date(QuizAttempt.end_time)).all()
            
            # Format results
            labels = [convert_to_ist2(result[0]) for result in results]
            values = [result[1] for result in results]
            
            return {
                'labels': labels,
                'values': values
            }, 200

    class AdminPerformanceDistribution(Resource):
        # @admin_required
        def get(self):
            # Get all completed quiz attempts
            attempts = QuizAttempt.query.filter(QuizAttempt.end_time.isnot(None)).all()
            
            # Initialize buckets
            buckets = {
                'excellent': 0,    # 90-100%
                'good': 0,         # 75-89%
                'average': 0,      # 60-74%
                'needs_improvement': 0  # <60%
            }
            
            for attempt in attempts:
                # Calculate score percentage
                scores = Score.query.filter_by(attempt_id=attempt.id).all()
                total_questions = len(scores)
                
                if total_questions == 0:
                    continue
                    
                correct_answers = sum(
                    1 for score in scores
                    if score.selected_option == score.question.correct_option
                )
                score_percentage = (correct_answers / total_questions) * 100
                
                # Categorize into buckets
                if score_percentage >= 90:
                    buckets['excellent'] += 1
                elif score_percentage >= 75:
                    buckets['good'] += 1
                elif score_percentage >= 60:
                    buckets['average'] += 1
                else:
                    buckets['needs_improvement'] += 1
            
            return [
                buckets['excellent'],
                buckets['good'],
                buckets['average'],
                buckets['needs_improvement']
            ], 200
        
    api.add_resource(AdminSummaryStats, '/admin/stats/summary')
    api.add_resource(AdminUserGrowth, '/admin/stats/user-growth')
    api.add_resource(AdminSubjectPerformance, '/admin/stats/subject-performance')
    api.add_resource(AdminQuizActivity, '/admin/stats/quiz-activity')
    api.add_resource(AdminPerformanceDistribution, '/admin/stats/performance-distribution')