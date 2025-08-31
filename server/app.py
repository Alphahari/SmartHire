from flask import Flask, jsonify, request
from models import db, User, Role
from flask_restful import Api
from Controllers.Basic import register_routes
import bcrypt
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_cors import CORS
from datetime import datetime, timedelta
from celery import Celery
from celery.schedules import crontab
from flask_mail import Mail
from extensions import cache, limiter


load_dotenv()

app = Flask(__name__)
CORS(app, 
     origins=["http://localhost:3000"], 
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["X-CSRF-TOKEN"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = False  # True in production
app.config["JWT_COOKIE_HTTPONLY"] = True
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=30)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=1)     
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-secret-key-for-dev')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 5,
    'max_overflow': 10,
    'pool_timeout': 30,
    'pool_recycle': 1800,
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
            username='admin',
            email='quizlytic.help@gmail.com',
            password=hashed_password,
            full_name='Admin User',
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
        'task': 'celery_worker.send_monthly_reports',
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
@limiter.limit("1 per 1 minute") 
def trigger_report_email_task():
    try:
        celery.send_task('celery_worker.send_monthly_reports')
        return jsonify({"message": "Monthly report task queued!"}), 200
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

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify(
        error="rate limit exceeded",
        message="Please wait before requesting another export"
    ), 429

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        create_admin_user()
        register_routes(api)
    app.run(debug=True)