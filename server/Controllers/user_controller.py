from flask import jsonify, request
from flask_restful import Resource
from models import MockTest, MockTestAttempt, Subject, Chapter, Quiz, Topic, CodingQuestion, TestCase, Submission, TestCaseResult, db
from sqlalchemy.orm import joinedload
from extensions import cache
from datetime import datetime

def register_user_routes(api): 
    class Subjects(Resource):   
        # @cache.cached(timeout=30, key_prefix="user_subjects")
        def get(self):
            subjects = Subject.query.all()
            # time.sleep(1)
            return jsonify([{
                 'id': s.id,
                'name': s.name,
                'description': s.description
            } for s in subjects])

    class ChapterInSubject(Resource):
        # @cache.cached(timeout=300, key_prefix=lambda: f"subject_{request.view_args['subject_id']}")
        def get(self, subject_id):
            subject = Subject.query.get_or_404(subject_id)
            return jsonify({
                'id': subject.id,
                'name': subject.name,
                'description': subject.description,
                'chapters': [{
                    'id': c.id,
                    'name': c.name,
                    'description': c.description
                } for c in subject.chapters]
            })

    class QuizesInChapter(Resource):
        # @cache.cached(timeout=300, key_prefix=lambda: f"chapter_{request.view_args['chapter_id']}")
        def get(self, chapter_id):
            chapter = Chapter.query.get_or_404(chapter_id)
            quizzes = []
            
            for q in chapter.quizzes:
                quizzes.append({
                    'id': q.id,
                    'start_time': q.start_time,
                    'end_time': q.end_time,
                    'duration': q.duration,
                    'remarks': q.remarks
                })
                
            return jsonify({
                'id': chapter.id,
                'name': chapter.name,
                'description': chapter.description,
                'subject': {
                    'id': chapter.subject.id,
                    'name': chapter.subject.name
                },
                'quizzes': quizzes
            })

    class QuestionsInQuizz(Resource):
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
                } for q in quiz.questions]
            })

    api.add_resource(Subjects, '/subjects')
    api.add_resource(ChapterInSubject, '/subjects/<int:subject_id>')
    api.add_resource(QuizesInChapter, '/chapters/<int:chapter_id>')
    api.add_resource(QuestionsInQuizz, '/quiz/<int:quiz_id>')

 
    class SearchQuizzes(Resource):
        def get(self):
            search_term = request.args.get('q', '').strip()
            if not search_term:
                return jsonify({
                    'subjects': [],
                    'chapters': [],
                    'quizzes': []
                })

            # Search subjects
            subject_results = Subject.query.filter(
                Subject.name.ilike(f'%{search_term}%')
            ).all()

            # Search chapters
            chapter_results = Chapter.query.filter(
                Chapter.name.ilike(f'%{search_term}%')
            ).all()

            # Search quizzes
            quiz_results = Quiz.query \
                .join(Chapter, Quiz.chapter_id == Chapter.id) \
                .join(Subject, Chapter.subject_id == Subject.id) \
                .filter(
                    Quiz.remarks.ilike(f'%{search_term}%')
                ) \
                .all()

            return jsonify({
                'subjects': [{
                    'id': s.id,
                    'name': s.name,
                    'description': s.description
                } for s in subject_results],
                'chapters': [{
                    'id': c.id,
                    'name': c.name,
                    'description': c.description,
                    'subject_id': c.subject_id,
                    'subject_name': c.subject.name
                } for c in chapter_results],
                'quizzes': [{
                    'id': q.id,
                    'subject': q.chapter.subject.name,
                    'chapter': q.chapter.name,
                    'remarks': q.remarks,
                    'start_time': q.start_time.isoformat(),
                    'end_time': q.end_time.isoformat(),
                    'duration': q.duration
                } for q in quiz_results]
            })
    
    api.add_resource(SearchQuizzes, '/search')

    class ChapterSubjects(Resource):
        def get(self):
            chapters = Chapter.query.options(joinedload(Chapter.subject)).all()
            return jsonify({
                c.id: c.subject.id for c in chapters
            })
    api.add_resource(ChapterSubjects, '/chapters/subjects')

    class UserCodingTopics(Resource):
        def get(self):
            """Get all coding topics for users"""
            topics = Topic.query.all()
            return jsonify([{
                'id': topic.id,
                'name': topic.name,
                'description': topic.description,
                'question_count': len(topic.questions)
            } for topic in topics])

    class UserCodingQuestions(Resource):
        def get(self):
            """Get coding questions for a specific topic"""
            topic_id = request.args.get('topic_id', type=int)
            
            if not topic_id:
                return {'error': 'topic_id parameter is required'}, 400

            # Verify topic exists
            topic = Topic.query.get(topic_id)
            if not topic:
                return {'error': 'Topic not found'}, 404

            questions = CodingQuestion.query.filter_by(topic_id=topic_id).options(
                joinedload(CodingQuestion.test_cases)
            ).all()

            return jsonify({
                'questions': [{
                    'id': q.id,
                    'title': q.title,
                    'description': q.description,
                    'constraints': q.constraints,
                    'input_format': q.input_format,
                    'output_format': q.output_format,
                    'difficulty': q.difficulty,
                    'topic_id': q.topic_id,
                    'test_cases': [{
                        'id': tc.id,
                        'input_data': tc.input_data,
                        'expected_output': tc.expected_output,
                        'is_sample': tc.is_sample
                    } for tc in q.test_cases if tc.is_sample]  # Only return sample test cases to users
                } for q in questions]
            })

    class UserCodingQuestion(Resource):
        def get(self, question_id):
            """Get a specific coding question with sample test cases"""
            question = CodingQuestion.query.options(
                joinedload(CodingQuestion.topic),
                joinedload(CodingQuestion.test_cases)
            ).get(question_id)

            if not question:
                return {'error': 'Coding question not found'}, 404

            # Only return sample test cases to users
            sample_test_cases = [tc for tc in question.test_cases if tc.is_sample]

            return {
                'id': question.id,
                'title': question.title,
                'description': question.description,
                'constraints': question.constraints,
                'input_format': question.input_format,
                'output_format': question.output_format,
                'difficulty': question.difficulty,
                'topic_id': question.topic_id,
                'topic_name': question.topic.name,
                'test_cases': [{
                    'id': tc.id,
                    'input_data': tc.input_data,
                    'expected_output': tc.expected_output,
                    'is_sample': tc.is_sample
                } for tc in sample_test_cases]
            }

    class UserSubmission(Resource):
        def get(self):
            """Fetch previous submission for a user and question"""
            user_id = request.args.get('user_id', type=int)
            question_id = request.args.get('question_id', type=int)

            if not user_id or not question_id:
                return {'error': 'user_id and question_id are required'}, 400

            submission = Submission.query.filter_by(
                user_id=user_id, 
                question_id=question_id
            ).first()

            if not submission:
                return {'message': 'No submission found'}, 404

            return {
                'id': submission.id,
                'code': submission.code,
                'language': submission.language,
                'status': submission.status,
                'passed_testcases': submission.passed_testcases,
                'total_testcases': submission.total_testcases,
                'timestamp': submission.timestamp.isoformat()
            }

        def post(self):
            """Store a new submission, overwriting the previous one"""
            data = request.get_json()
            
            user_id = data.get('user_id')
            question_id = data.get('question_id')
            code = data.get('code')
            language = data.get('language')
            status = data.get('status')
            passed_testcases = data.get('passed_testcases')
            total_testcases = data.get('total_testcases')
            results = data.get('results', [])

            if not all([user_id, question_id, code, language]):
                return {'error': 'Missing required fields'}, 400

            # Delete existing submission for this user and question
            Submission.query.filter_by(user_id=user_id, question_id=question_id).delete()

            # Create new submission
            new_submission = Submission(
                user_id=user_id,
                question_id=question_id,
                code=code,
                language=language,
                status=status,
                passed_testcases=passed_testcases,
                total_testcases=total_testcases,
                timestamp=datetime.utcnow()
            )

            db.session.add(new_submission)
            db.session.flush() # Flush to get the ID

            # Store test case results if provided
            for res in results:
                test_case_result = TestCaseResult(
                    submission_id=new_submission.id,
                    test_case_id=res.get('test_case_id'),
                    passed=res.get('passed', False),
                    actual_output=res.get('actual_output'),
                    error_message=res.get('error_message'),
                    time_taken=res.get('time_taken')
                )
                db.session.add(test_case_result)

            db.session.commit()
            
            return {'message': 'Submission stored successfully', 'id': new_submission.id}, 201

    # Register coding routes
    api.add_resource(UserCodingTopics, '/coding/topics')
    api.add_resource(UserCodingQuestions, '/coding/questions')
    api.add_resource(UserCodingQuestion, '/coding/questions/<int:question_id>')
    api.add_resource(UserSubmission, '/coding/submission')

    class UserMockTests(Resource):
        def get(self):
            """Get all active mock tests for users"""
            mock_tests = MockTest.query.filter_by(is_active=True).options(
                joinedload(MockTest.quiz),
                joinedload(MockTest.coding_question)
            ).all()
            
            return jsonify([{
                'id': mt.id,
                'name': mt.name,
                'description': mt.description,
                'quiz_id': mt.quiz_id,
                'quiz_name': mt.quiz.remarks if mt.quiz else '',
                'coding_question_id': mt.coding_question_id,
                'coding_question_title': mt.coding_question.title if mt.coding_question else '',
                'coding_question_difficulty': mt.coding_question.difficulty if mt.coding_question else ''
            } for mt in mock_tests])


    class UserMockTest(Resource):
        def get(self, id):
            """Get a specific mock test with details"""
            mock_test = MockTest.query.options(
                joinedload(MockTest.quiz),
                joinedload(MockTest.coding_question)
            ).get(id)
            
            if not mock_test or not mock_test.is_active:
                return {'error': 'Mock test not found'}, 404
            
            return {
                'id': mock_test.id,
                'name': mock_test.name,
                'description': mock_test.description,
                'quiz': {
                    'id': mock_test.quiz.id,
                    'remarks': mock_test.quiz.remarks,
                    'duration': mock_test.quiz.duration,
                    'chapter_name': mock_test.quiz.chapter.name if mock_test.quiz.chapter else '',
                    'subject_name': mock_test.quiz.chapter.subject.name if mock_test.quiz.chapter and mock_test.quiz.chapter.subject else ''
                },
                'coding_question': {
                    'id': mock_test.coding_question.id,
                    'title': mock_test.coding_question.title,
                    'difficulty': mock_test.coding_question.difficulty,
                    'description': mock_test.coding_question.description
                }
            }


    class StartMockTest(Resource):
        def post(self, mock_test_id):
            """Start a mock test attempt"""
            data = request.get_json()
            user_id = data.get('user_id')
            
            if not user_id:
                return {'error': 'User ID is required'}, 400
            
            mock_test = MockTest.query.get(mock_test_id)
            if not mock_test or not mock_test.is_active:
                return {'error': 'Mock test not found'}, 404
            
            # Check for existing in-progress attempt
            existing_attempt = MockTestAttempt.query.filter_by(
                user_id=user_id,
                mock_test_id=mock_test_id,
                status='in_progress'
            ).first()
            
            if existing_attempt:
                return {
                    'attempt_id': existing_attempt.id,
                    'started_at': existing_attempt.started_at.isoformat()
                }, 200
            
            # Create new attempt
            new_attempt = MockTestAttempt(
                user_id=user_id,
                mock_test_id=mock_test_id,
                status='in_progress'
            )
            
            db.session.add(new_attempt)
            db.session.commit()
            
            return {
                'attempt_id': new_attempt.id,
                'started_at': new_attempt.started_at.isoformat()
            }, 201

    class SubmitMockTest(Resource):
        def post(self, attempt_id):
            """Submit mock test results"""
            data = request.get_json()
            user_id = data.get('user_id')
            
            if not user_id:
                return {'error': 'User ID is required'}, 400
            
            attempt = MockTestAttempt.query.get(attempt_id)
            if not attempt or attempt.user_id != int(user_id):
                return {'error': 'Attempt not found'}, 404
            
            if attempt.status == 'completed':
                return {'error': 'Test already submitted'}, 400
            
            attempt.quiz_score = data.get('quiz_score', 0)
            attempt.coding_score = data.get('coding_score', 0)
            attempt.total_score = (attempt.quiz_score + attempt.coding_score) / 2
            attempt.time_spent = data.get('time_spent', 0)
            attempt.status = 'completed'
            attempt.completed_at = datetime.utcnow()
            
            db.session.commit()
            
            return {
                'message': 'Mock test submitted successfully',
                'total_score': attempt.total_score,
                'quiz_score': attempt.quiz_score,
                'coding_score': attempt.coding_score
            }, 200


    api.add_resource(UserMockTests, '/user/mock-tests')
    api.add_resource(UserMockTest, '/user/mock-tests/<int:id>')
    api.add_resource(StartMockTest, '/user/mock-tests/<int:mock_test_id>/start')
    api.add_resource(SubmitMockTest, '/user/mock-test-attempts/<int:attempt_id>/submit')