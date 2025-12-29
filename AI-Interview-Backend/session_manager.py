# session_manager.py
import uuid
from datetime import datetime, timedelta

class InterviewSession:
    def __init__(self, resume_text, session_id=None):
        self.session_id = session_id or str(uuid.uuid4())
        self.resume_text = resume_text
        self.conversation_history = []  # List of (question, user_answer, topics_mentioned)
        self.generated_questions = []
        self.used_topics = set()
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
    
    def add_interaction(self, question, user_answer, topics):
        """Add a completed Q&A to history and track mentioned topics"""
        self.conversation_history.append({
            'question': question,
            'user_answer': user_answer,
            'topics_mentioned': topics,
            'timestamp': datetime.now()
        })
        self.used_topics.update(topics)
        self.last_activity = datetime.now()
    
    def get_recent_topics(self, lookback_questions=3):
        """Get topics from recent answers for follow-up questions"""
        recent_topics = set()
        recent_interactions = self.conversation_history[-lookback_questions:]
        
        for interaction in recent_interactions:
            recent_topics.update(interaction['topics_mentioned'])
        
        return recent_topics - self.used_topics  # Return only unused recent topics

# Session storage (in production, use Redis or database)
active_sessions = {}

def get_session(session_id):
    """Retrieve a session by ID"""
    return active_sessions.get(session_id)

def create_session(resume_text):
    """Create a new interview session"""
    session = InterviewSession(resume_text)
    active_sessions[session.session_id] = session
    return session

def cleanup_old_sessions(hours_old=24):
    """Clean up old sessions"""
    cutoff = datetime.now() - timedelta(hours=hours_old)
    expired_sessions = [
        sid for sid, session in active_sessions.items() 
        if session.last_activity < cutoff
    ]
    for sid in expired_sessions:
        del active_sessions[sid]