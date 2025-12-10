from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from enum import Enum
from sqlalchemy import DateTime, TIMESTAMP
from datetime import datetime

db = SQLAlchemy()

class Role(Enum):
    USER = 'user'
    ADMIN = 'admin'

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    email = db.Column(db.String(100), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    last_visited = db.Column(db.DateTime, default=datetime.utcnow)
    password = db.Column(db.String(200), nullable=False)
    provider = db.Column(db.String(100))
    provider_id = db.Column(db.String(100))
    role = db.Column(db.Enum(Role), default=Role.USER, nullable=False)
    reminder_time = db.Column(db.Time, nullable=True)
    scores = db.relationship('Score', backref='user', cascade='all, delete-orphan', passive_deletes=True)
    interviews = db.relationship('InterviewSession', backref='user', cascade='all, delete-orphan', passive_deletes=True)

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    chapters = db.relationship('Chapter', backref='subject', 
                             cascade='all, delete-orphan', 
                             passive_deletes=True)  # Remove lazy='dynamic'

class Chapter(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    subject_id = db.Column(db.Integer, 
                          db.ForeignKey('subject.id', ondelete='CASCADE'), 
                          nullable=False)
    quizzes = db.relationship('Quiz', backref='chapter', 
                            cascade='all, delete-orphan', 
                            passive_deletes=True)  # Remove lazy='dynamic'

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    chapter_id = db.Column(db.Integer, 
                         db.ForeignKey('chapter.id', ondelete='CASCADE'), 
                         nullable=False)
    start_time = db.Column(TIMESTAMP(timezone=True), nullable=False) 
    end_time = db.Column(TIMESTAMP(timezone=True), nullable=False) 
    duration = db.Column(db.Integer, nullable=False)  
    remarks = db.Column(db.String(200))
    questions = db.relationship('Question', backref='quiz', 
                              cascade='all, delete-orphan', 
                              passive_deletes=True)  # Remove lazy='dynamic'

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    quiz_id = db.Column(db.Integer, 
                       db.ForeignKey('quiz.id', ondelete='CASCADE'), 
                       nullable=False)
    question_statement = db.Column(db.String(500), nullable=False)
    option1 = db.Column(db.String, nullable=False)
    option2 = db.Column(db.String, nullable=False)
    option3 = db.Column(db.String, nullable=False)
    option4 = db.Column(db.String, nullable=False)
    correct_option = db.Column(db.Integer, nullable=False)
    scores = db.relationship('Score', backref='question', 
                           cascade='all, delete-orphan', 
                           passive_deletes=True)

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, 
                       db.ForeignKey('user.id', ondelete='CASCADE'), 
                       nullable=False)
    quiz_id = db.Column(db.Integer,
                        db.ForeignKey('quiz.id', ondelete='CASCADE'),
                        nullable=False)
    question_id = db.Column(db.Integer, 
                            db.ForeignKey('question.id', ondelete='CASCADE'), 
                            nullable=False)
    selected_option = db.Column(db.Integer, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    attempt_id = db.Column(db.Integer, db.ForeignKey('quiz_attempt.id', ondelete='CASCADE'))

class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id', ondelete='CASCADE'), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    time_spent = db.Column(db.Integer)
    user = db.relationship('User', backref='quiz_attempts')
    quiz = db.relationship('Quiz', backref='quiz_attempts')

class Topic(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(300))

    questions = db.relationship(
        'CodingQuestion',
        backref='topic',
        cascade='all, delete-orphan',
        passive_deletes=True
    )

class CodingQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    topic_id = db.Column(
        db.Integer,
        db.ForeignKey('topic.id', ondelete='CASCADE'),
        nullable=False
    )

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    # Removed function_signature column
    constraints = db.Column(db.Text)
    difficulty = db.Column(db.String(20), default="medium")  # easy/medium/hard
    input_format = db.Column(db.Text, nullable=True)  # Added: describes how input should be formatted
    output_format = db.Column(db.Text, nullable=True)  # Added: describes expected output format

    test_cases = db.relationship(
        'TestCase',
        backref='question',
        cascade='all, delete-orphan',
        passive_deletes=True
    )

    submissions = db.relationship(
        'Submission',
        backref='question',
        cascade='all, delete-orphan',
        passive_deletes=True
    )


class TestCase(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    question_id = db.Column(
        db.Integer,
        db.ForeignKey('coding_question.id', ondelete='CASCADE'),
        nullable=False
    )

    input_data = db.Column(db.Text, nullable=False)
    expected_output = db.Column(db.Text, nullable=False)
    is_sample = db.Column(db.Boolean, default=False)  
    # sample = shown to user; hidden = used for evaluation


class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id', ondelete='CASCADE'),
        nullable=False
    )

    question_id = db.Column(
        db.Integer,
        db.ForeignKey('coding_question.id', ondelete='CASCADE'),
        nullable=False
    )

    code = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(20))  # python, java, cpp
    status = db.Column(db.String(20))    # Accepted, Wrong Answer, Runtime Error
    total_testcases = db.Column(db.Integer)
    passed_testcases = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    results = db.relationship(
        'TestCaseResult',
        backref='submission',
        cascade='all, delete-orphan',
        passive_deletes=True
    )


class TestCaseResult(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    submission_id = db.Column(
        db.Integer,
        db.ForeignKey('submission.id', ondelete='CASCADE'),
        nullable=False
    )

    test_case_id = db.Column(
        db.Integer,
        db.ForeignKey('test_case.id', ondelete='CASCADE'),
        nullable=False
    )

    passed = db.Column(db.Boolean, nullable=False)
    actual_output = db.Column(db.Text)
    error_message = db.Column(db.Text)
    time_taken = db.Column(db.Float)


# --- NEW MODEL FOR INTERVIEW SESSIONS ---
class InterviewSession(db.Model):
    __tablename__ = 'interview_session'
    
    # primary_key=True automatically implies autoincrement=True for Integers in SQLAlchemy
    id = db.Column(db.Integer, primary_key=True, autoincrement=True) 
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Data fields
    total_questions = db.Column(db.Integer, default=0)
    final_score = db.Column(db.Float, nullable=False)
    summary = db.Column(db.Text, nullable=True)
    strengths = db.Column(db.Text, nullable=True)
    weaknesses = db.Column(db.Text, nullable=True)
    suggestions = db.Column(db.Text, nullable=True)

class MockTest(db.Model):
    __tablename__ = 'mock_tests'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    coding_question_id = db.Column(db.Integer, db.ForeignKey('coding_question.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    quiz = db.relationship('Quiz', backref='mock_tests')
    coding_question = db.relationship('CodingQuestion', backref='mock_tests')
    
class MockTestAttempt(db.Model):
    __tablename__ = 'mock_test_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    mock_test_id = db.Column(db.Integer, db.ForeignKey('mock_tests.id'), nullable=False)
    quiz_score = db.Column(db.Float)
    coding_score = db.Column(db.Float)
    total_score = db.Column(db.Float)
    time_spent = db.Column(db.Integer)  # in seconds
    status = db.Column(db.String(20), default='in_progress')  # in_progress, completed
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='mock_test_attempts')
    mock_test = db.relationship('MockTest', backref='attempts')