from flask_restful import Resource
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, InterviewSession, User
from sqlalchemy import desc

class SaveInterviewSession(Resource):
    @jwt_required()
    def post(self):
        """
        Saves the summary of an AI interview.
        The 'id' will be auto-generated sequentially (1, 2, 3...) by the database.
        """
        current_user_id = get_jwt_identity()
        data = request.get_json()

        if not current_user_id:
            return {'error': 'User authentication required'}, 401

        try:
            # Create the new session record
            # We DO NOT pass 'id'. The database generates it sequentially.
            new_session = InterviewSession(
                user_id=current_user_id,
                total_questions=data.get('total_questions', 0),
                final_score=data.get('final_score', 0.0),
                summary=data.get('summary'),
                strengths=data.get('strengths'),
                weaknesses=data.get('weaknesses'),
                suggestions=data.get('suggestions')
            )

            db.session.add(new_session)
            db.session.commit()

            return {
                'message': 'Interview session saved successfully',
                'interview_id': new_session.id, # This will be 1, 2, 3, etc.
                'date': new_session.created_at.isoformat()
            }, 201

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

class GetUserInterviews(Resource):
    @jwt_required()
    def get(self):
        """
        Fetches interview history for the logged-in user.
        Similar to UserQuizAttempts logic.
        """
        current_user_id = get_jwt_identity()
        
        # Fetch sessions ordered by most recent first
        sessions = InterviewSession.query.filter_by(
            user_id=current_user_id
        ).order_by(desc(InterviewSession.created_at)).all()

        results = []
        for session in sessions:
            results.append({
                "id": session.id,  # Sequential ID (1, 2, 3...)
                "date": session.created_at.isoformat() + "Z",
                "score": session.final_score,
                "summary": session.summary,
                "strengths": session.strengths,
                "weaknesses": session.weaknesses,
                "suggestions": session.suggestions,
                "total_questions": session.total_questions
            })

        return jsonify(results)

def register_interview_routes(api):
    # Route to save data (Bridge from Frontend -> Main DB)
    api.add_resource(SaveInterviewSession, '/user/interview-session')
    
    # Route to get history (For Dashboard)
    api.add_resource(GetUserInterviews, '/user/interview-history')