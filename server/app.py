from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_restful import Api
from flask_cors import CORS
from flask_mail import Mail
from flask_migrate import Migrate
from models import db, User, Role
from Controllers.Basic import register_routes
from dotenv import load_dotenv
from datetime import datetime, timedelta
from celery import Celery
from celery.schedules import crontab
from extensions import cache, limiter
import os
import bcrypt

load_dotenv()

from ai_report_generator import ai_report_generator

app = Flask(__name__)
CORS(app, 
     origins=["http://localhost:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=60) 
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-secret-key-for-dev')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 5,
    'max_overflow': 10,
    'pool_timeout': 30,
    'pool_recycle': 1800,
    'pool_pre_ping': True,
}

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6380')

app.config.update(
    broker_url=REDIS_URL,
    result_backend=REDIS_URL
)

app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@quizlytics.com')
app.config['CACHE_TYPE'] = 'RedisCache'
app.config['CACHE_REDIS_URL'] = REDIS_URL
app.config['CACHE_DEFAULT_TIMEOUT'] = 300

db.init_app(app)
migrate = Migrate(app,db)
jwt = JWTManager(app)
mail = Mail(app) 
api = Api(app, prefix='/api')
cache.init_app(app)
limiter.init_app(app)

@app.template_filter('is_admin')
def is_admin(user):
    return user.role == Role.ADMIN

def create_admin_user():
    admin = User.query.filter_by(email='quizlytic.help@gmail.com').first()
    if not admin:
        hashed_password = bcrypt.hashpw(b'adminpassword', bcrypt.gensalt()).decode('utf-8')
        admin_user = User(
            email='quizlytic.help@gmail.com',
            password=hashed_password,
            full_name='Admin',
            role=Role.ADMIN
        )
        db.session.add(admin_user)
        db.session.commit()
        print("Admin user created successfully!")

def create_celery(app):
    celery = Celery(
        app.import_name,
        broker=app.config['broker_url'],
        backend=app.config['result_backend']
    )
    celery.conf.update(app.config)
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    celery.Task = ContextTask
    celery.autodiscover_tasks(['celery_worker']) 
    return celery
celery = create_celery(app)
celery.conf.beat_schedule = {
    'minute-check': {
        'task': 'celery_worker.send_daily_reminders',
        'schedule': crontab(minute='*'),
    },
    'monthly-reports': {
        'task': 'celery_worker.send_ai_enhanced_monthly_reports',
        'schedule': crontab(day_of_month=1, hour=14, minute=30)
    }
}
@app.route('/test-email')
@limiter.limit("1 per 1 minute") 
def trigger_email_task():
    try:
        celery.send_task('celery_worker.send_daily_reminders')
        return jsonify({"message": "Test email task queued!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/api/user/reminder', methods=['PUT'])
@jwt_required()
def update_reminder_time():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json()
    time_str = data.get('reminder_time')
    
    try:
        user.reminder_time = datetime.strptime(time_str, '%H:%M').time()
        db.session.commit()
        return jsonify({"message": "Reminder time updated"}), 200
    except ValueError:
        return jsonify({"error": "Invalid time format. Use HH:MM"}), 400

@app.route('/test-monthly-report-email')
# @limiter.limit("1 per 1 minute") 
def trigger_report_email_task():
    try:
        celery.send_task('celery_worker.send_ai_enhanced_monthly_reports')
        return jsonify({"message": "Monthly AI report task queued!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/export/scores-csv', methods=['GET'])
@limiter.limit("2 per 30 minute") 
@jwt_required()
def trigger_scores_export():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != Role.ADMIN:
            return jsonify({"error": "Admin access required"}), 403
        
        celery.send_task('celery_worker.export_scores_csv', args=[user.email])
        return jsonify({"message": "Scores export started! You'll receive an email shortly."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/export/my-performance-csv', methods=['GET'])
@limiter.limit("2 per 30 minute") 
@jwt_required()
def trigger_my_performance_export():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        celery.send_task('celery_worker.export_user_performance_csv', args=[user.email, user_id])
        return jsonify({"message": "Performance export started! You'll receive an email shortly."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/export/all-performance-csv', methods=['GET']) 
@limiter.limit("2 per 30 minute") 
@jwt_required()
def trigger_all_performance_export():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != Role.ADMIN:
            return jsonify({"error": "Admin access required"}), 403
        
        celery.send_task('celery_worker.export_user_performance_csv', args=[user.email])
        return jsonify({"message": "All users performance export started! You'll receive an email shortly."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/ai-report', methods=['GET'])
@limiter.limit("1 per 10 minutes")
@jwt_required()
def generate_ai_report():
    """Generate and return an AI-powered performance report for the current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Calculate date range for the current month
        now = datetime.utcnow()
        first_day_current = now.replace(day=1)
        last_day_prev = first_day_current - timedelta(days=1)
        first_day_prev = last_day_prev.replace(day=1)
        
        # Get comprehensive performance data
        performance_data = ai_report_generator.get_user_performance_data(
            user.id, first_day_prev, first_day_current
        )
        
        # Check if any data is available (quizzes, coding, or interviews)
        has_data = (
            performance_data['quiz_performance'] or 
            performance_data['coding_performance'] or 
            performance_data['interview_performance']
        )
        
        if not has_data:
            return jsonify({"error": "No performance data available for analysis this month"}), 400
        
        # Generate AI report
        ai_report = ai_report_generator.generate_insightful_report(
            performance_data,
            user.full_name,
            first_day_prev.strftime("%B %Y")
        )
        
        return jsonify({
            "message": "AI report generated successfully",
            "report": ai_report,
            "performance_summary": {
                "quiz_performance": {
                    "total_quizzes": performance_data['total_quizzes'],
                    "overall_accuracy": performance_data['overall_accuracy'],
                    "total_questions": performance_data['total_questions'],
                    "total_correct": performance_data['total_correct']
                },
                "coding_performance": {
                    "total_submissions": performance_data['total_coding_submissions'],
                    "accepted_submissions": performance_data['accepted_coding_submissions'],
                    "acceptance_rate": performance_data['coding_acceptance_rate']
                },
                "interview_performance": {
                    "total_interviews": performance_data['total_interviews'],
                    "average_score": performance_data['avg_interview_score']
                }
            },
            "month": first_day_prev.strftime("%B %Y")
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to generate AI report: {str(e)}"}), 500

# Update the celery beat schedule to use the AI-enhanced reports
celery.conf.beat_schedule = {
    'minute-check': {
        'task': 'celery_worker.send_daily_reminders',
        'schedule': crontab(minute='*'),
    },
    'monthly-reports': {
        'task': 'celery_worker.send_ai_enhanced_monthly_reports',  # Updated to use AI reports
        'schedule': crontab(day_of_month=1, hour=14, minute=30)
    }
}

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify(
        error="rate limit exceeded",
        message="Please wait before requesting another export"
    ), 429

with app.app_context():
    create_admin_user()
    register_routes(api)

if __name__ == "__main__":
    app.run(debug=True)