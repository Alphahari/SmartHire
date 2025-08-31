from flask import jsonify, request
from flask_restful import Resource
from models import Subject, Chapter, Quiz
from sqlalchemy.orm import joinedload
from extensions import cache

def register_user_routes(api): 
    class Subjects(Resource):
        def options(self):
            return {'Allow': 'GET'}, 200, \
                {'Access-Control-Allow-Origin': 'http://localhost:3000/',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Credentials': 'true'}
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
        @cache.cached(timeout=300, key_prefix=lambda: f"subject_{request.view_args['subject_id']}")
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
        @cache.cached(timeout=300, key_prefix=lambda: f"chapter_{request.view_args['chapter_id']}")
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