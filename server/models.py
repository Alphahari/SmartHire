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
    function_signature = db.Column(db.String(300), nullable=False)
    constraints = db.Column(db.Text)
    difficulty = db.Column(db.String(20), default="medium")  # easy/medium/hard

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
    time_taken = db.Column(db.Float)
    memory_used = db.Column(db.Float)
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