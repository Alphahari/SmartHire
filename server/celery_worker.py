from datetime import datetime, timedelta
from collections import defaultdict
import io
import csv
import time
from flask_mail import Message
from jinja2 import Template
from sqlalchemy.orm import joinedload
from app import mail, celery, app
from models import Role, QuizAttempt, Score, User, Quiz, Chapter
from sqlalchemy import func, extract
from ai_report_generator import ai_report_generator

@celery.task(name='celery_worker.send_daily_reminders')
def send_daily_reminders():
    now = datetime.utcnow()
    current_hour = now.hour
    current_minute = now.minute
    users_to_remind = User.query.filter(
        User.reminder_time.isnot(None),
        extract('hour', User.reminder_time) == current_hour,
        extract('minute', User.remai_report_generator.pyinder_time) == current_minute
    ).all()
    cutoff = now - timedelta(hours=24)
    new_quizzes = Quiz.query.filter(Quiz.start_time >= cutoff).all()
    
    for user in users_to_remind:
        if not user.last_visited or user.last_visited < cutoff:
            send_reminder_email.delay(
                user.email, 
                user.full_name,
                "Daily Quiz Reminder",
                "It's time to practice! New quizzes are waiting for you on Quizlytics!"
            )
        elif new_quizzes:
            quiz_list = "\n".join(
                [f"- {q.chapter.name} (Ends: {q.end_time.strftime('%Y-%m-%d %H:%M')} UTC)"
                 for q in new_quizzes]
            )
            send_reminder_email.delay(
                user.email,
                user.full_name,
                "New quizzes available!",
                f"We've added new quizzes for you:\n{quiz_list}"
            )

@celery.task
def send_reminder_email(recipient, name, subject, body):
    try:
        msg = Message(
            subject=subject,
            recipients=[recipient],
            body=f"Hi {name},\n\n{body}\n\nBest regards,\nQuizlytics Team"
        )
        # Send email
        mail.send(msg)
        print(f"Sent email to {recipient}")
    except Exception as e:
        print(f"Failed to send email to {recipient}: {str(e)}")

@celery.task(name='celery_worker.send_monthly_reports')
def send_monthly_reports():
    now = datetime.utcnow()
    first_day_current = now.replace(day=1)
    last_day_prev = first_day_current - timedelta(days=1)
    first_day_prev = last_day_prev.replace(day=1)
    end_date = first_day_current - timedelta(days=1) 
    
    users = User.query.filter_by(role=Role.USER).all() 
    print(f"Processing {len(users)} students")
    
    for user in users:
        print(f"Processing student: {user.email}")

        # Get user's attempts for previous month
        attempts = QuizAttempt.query.filter(
            QuizAttempt.user_id == user.id,
            QuizAttempt.end_time != None,
            QuizAttempt.end_time >= first_day_prev,
            QuizAttempt.end_time < first_day_current
        ).options(
            joinedload(QuizAttempt.quiz)
            .joinedload(Quiz.chapter)
            .joinedload(Chapter.subject)
        ).all()
        
        if not attempts:
            print(f"No attempts found for student {user.email}")
            continue
            
        # Generate performance stats
        subject_stats = defaultdict(lambda: {'correct': 0, 'total': 0, 'quizzes': set()})
        total_correct = 0
        total_questions = 0
        quiz_count = len(attempts)
        best_score = 0
        best_quiz = None
        quiz_history = []

        for attempt in attempts:
            scores = Score.query.filter_by(attempt_id=attempt.id).all()
            correct_in_attempt = 0
            total_in_attempt = 0
            
            for score in scores:
                subject = attempt.quiz.chapter.subject.name
                subject_stats[subject]['total'] += 1
                subject_stats[subject]['quizzes'].add(attempt.quiz_id)
                total_questions += 1
                total_in_attempt += 1
                
                if score.selected_option == score.question.correct_option:
                    subject_stats[subject]['correct'] += 1
                    total_correct += 1
                    correct_in_attempt += 1
            
            # Calculate score for this attempt
            attempt_score = (correct_in_attempt / total_in_attempt) * 100 if total_in_attempt else 0
            
            # Track best quiz
            if attempt_score > best_score:
                best_score = attempt_score
                best_quiz = attempt.quiz
            
            # Add to quiz history
            quiz_history.append({
                'date': attempt.end_time.date(),
                'quiz_name': f"{attempt.quiz.chapter.subject.name} - {attempt.quiz.chapter.name}",
                'score': round(attempt_score, 1)
            })
        
        # Calculate average score
        avg_score = (total_correct / total_questions) * 100 if total_questions else 0
        
        # Prepare subject breakdown
        subject_breakdown = []
        for subject, stats in subject_stats.items():
            accuracy = (stats['correct'] / stats['total']) * 100 if stats['total'] else 0
            subject_breakdown.append({
                'name': subject,
                'quizzes_taken': len(stats['quizzes']),
                'accuracy': round(accuracy, 1),
                'correct': stats['correct'],
                'total': stats['total']
            })
        
        # Prepare best quiz info
        best_quiz_info = None
        if best_quiz:
            best_quiz_info = {
                'name': f"{best_quiz.chapter.subject.name} - {best_quiz.chapter.name}",
                'score': round(best_score, 1)
            }
        
        # Generate email content
        html_content = render_html_report(
            user=user,
            month=first_day_prev.strftime("%B %Y"),
            quiz_count=quiz_count,
            avg_score=round(avg_score, 1),
            best_quiz=best_quiz_info,
            subject_breakdown=subject_breakdown,
            quiz_history=quiz_history
        )

        # Send email without charts
        send_html_email.delay(
            recipient=user.email,
            name=user.full_name,
            subject=f"Quizlytics Monthly Report - {first_day_prev.strftime('%B %Y')}",
            html_content=html_content
        )

def render_html_report(user, month, quiz_count, avg_score, best_quiz, subject_breakdown, quiz_history):
    """Render simplified HTML report without charts"""
    # Sort subject breakdown by accuracy descending
    subject_breakdown.sort(key=lambda x: x['accuracy'], reverse=True)
    
    # HTML template
    template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Quizlytics Monthly Report</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); 
                     color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border-radius: 0 0 10px 10px; 
                     box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .stats-container { display: flex; justify-content: space-between; 
                             margin-bottom: 30px; flex-wrap: wrap; }
            .stat-card { background: #f8f9fa; border-radius: 10px; padding: 20px; 
                       text-align: center; flex: 1; min-width: 150px; margin: 10px; 
                       box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
            .stat-value { font-size: 2rem; font-weight: bold; color: #2575fc; }
            .stat-label { font-size: 0.9rem; color: #6c757d; }
            table { width: 100%; border-collapse: collapse; margin: 25px 0; }
            th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e0e0e0; }
            th { background-color: #f1f8ff; font-weight: 600; }
            tr:hover { background-color: #f9f9f9; }
            .footer { text-align: center; margin-top: 40px; color: #6c757d; 
                    font-size: 0.9rem; }
            .dashboard-link { display: inline-block; margin-top: 20px; padding: 10px 20px;
                            background-color: #2575fc; color: white; text-decoration: none;
                            border-radius: 5px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Quizlytics Monthly Report</h1>
                <h2>{{ month }} Performance Summary</h2>
            </div>
            
            <div class="content">
                <p>Hello {{ user.full_name }},</p>
                <p>Here's your monthly performance report for {{ month }}. Keep up the great work!</p>
                
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-value">{{ quiz_count }}</div>
                        <div class="stat-label">Quizzes Taken</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ avg_score }}%</div>
                        <div class="stat-label">Average Score</div>
                    </div>
                    {% if best_quiz %}
                    <div class="stat-card">
                        <div class="stat-value">{{ best_quiz.score }}%</div>
                        <div class="stat-label">Best Quiz: {{ best_quiz.name }}</div>
                    </div>
                    {% endif %}
                </div>
                
                <h3>Performance Breakdown by Subject</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Quizzes Taken</th>
                            <th>Accuracy</th>
                            <th>Correct/Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for subject in subject_breakdown %}
                        <tr>
                            <td>{{ subject.name }}</td>
                            <td>{{ subject.quizzes_taken }}</td>
                            <td>{{ subject.accuracy }}%</td>
                            <td>{{ subject.correct }}/{{ subject.total }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
                
                <h3>Detailed Quiz History</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Completion Date</th>
                            <th>Quiz Name</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for quiz in quiz_history %}
                        <tr>
                            <td>{{ quiz.date }}</td>
                            <td>{{ quiz.quiz_name }}</td>
                            <td>{{ quiz.score }}%</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
                
                <a href="http://localhost:5173/dashboard" class="dashboard-link">
                    View Your Dashboard
                </a>
                
                <div class="footer">
                    <p>Quizlytics Performance Report • Generated on {{ now.strftime('%Y-%m-%d') }}</p>
                    <p>Keep learning and improving!</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """)
    
    return template.render(
        user=user,
        month=month,
        quiz_count=quiz_count,
        avg_score=avg_score,
        best_quiz=best_quiz,
        subject_breakdown=subject_breakdown,
        quiz_history=quiz_history,
        now=datetime.utcnow()
    )

@celery.task(name='celery_worker.send_ai_enhanced_monthly_reports')
def send_ai_enhanced_monthly_reports():
    """Send monthly reports with AI-powered insights"""
    now = datetime.utcnow()
    first_day_current = now.replace(day=1)
    last_day_prev = first_day_current - timedelta(days=1)
    first_day_prev = last_day_prev.replace(day=1)
    
    users = User.query.filter_by(role=Role.USER).all()
    print(f"Processing {len(users)} students for AI-enhanced monthly reports")
    
    for user in users:
        print(f"Processing AI report for student: {user.email}")
        
        # Get user performance data for the previous month
        performance_data = ai_report_generator.get_user_performance_data(
            user.id, first_day_prev, first_day_current
        )
        
        if not performance_data['quiz_performance']:
            print(f"No quiz attempts found for student {user.email}")
            continue
        
        # Generate AI-powered report
        ai_report = ai_report_generator.generate_insightful_report(
            performance_data, 
            user.full_name, 
            first_day_prev.strftime("%B %Y")
        )
        
        # Generate enhanced HTML content with AI insights
        html_content = render_ai_enhanced_html_report(
            user=user,
            month=first_day_prev.strftime("%B %Y"),
            performance_data=performance_data,
            ai_insights=ai_report
        )

        # Send email with AI-enhanced report
        send_html_email.delay(
            recipient=user.email,
            name=user.full_name,
            subject=f"Quizlytics AI Insights Report - {first_day_prev.strftime('%B %Y')}",
            html_content=html_content
        )
        
        # Add delay to avoid rate limiting
        time.sleep(2)

def render_ai_enhanced_html_report(user, month, performance_data, ai_insights):
    """Render HTML report with AI-powered insights"""
    
    template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Quizlytics AI Insights Report</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                color: #333; 
                line-height: 1.6;
            }
            .container { 
                max-width: 900px; 
                margin: 0 auto; 
                padding: 20px; 
            }
            .header { 
                background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); 
                color: white; 
                padding: 30px; 
                border-radius: 10px 10px 0 0; 
            }
            .content { 
                background: #fff; 
                padding: 30px; 
                border-radius: 0 0 10px 10px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
            }
            .stats-container { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 30px; 
                flex-wrap: wrap; 
            }
            .stat-card { 
                background: #f8f9fa; 
                border-radius: 10px; 
                padding: 20px; 
                text-align: center; 
                flex: 1; 
                min-width: 150px; 
                margin: 10px; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.05); 
            }
            .stat-value { 
                font-size: 2rem; 
                font-weight: bold; 
                color: #2575fc; 
            }
            .stat-label { 
                font-size: 0.9rem; 
                color: #6c757d; 
            }
            .ai-insights {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 20px;
                margin: 25px 0;
                border-radius: 0 8px 8px 0;
            }
            .insight-section {
                margin: 25px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .insight-section h3 {
                color: #2575fc;
                border-bottom: 2px solid #2575fc;
                padding-bottom: 10px;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 25px 0; 
            }
            th, td { 
                padding: 12px 15px; 
                text-align: left; 
                border-bottom: 1px solid #e0e0e0; 
            }
            th { 
                background-color: #f1f8ff; 
                font-weight: 600; 
            }
            tr:hover { 
                background-color: #f9f9f9; 
            }
            .footer { 
                text-align: center; 
                margin-top: 40px; 
                color: #6c757d; 
                font-size: 0.9rem; 
            }
            .dashboard-link { 
                display: inline-block; 
                margin-top: 20px; 
                padding: 10px 20px;
                background-color: #2575fc; 
                color: white; 
                text-decoration: none;
                border-radius: 5px; 
                font-weight: bold; 
            }
            .ai-badge {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.8rem;
                margin-left: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Quizlytics AI Insights Report</h1>
                <h2>{{ month }} Performance Analysis</h2>
                <span class="ai-badge">AI-Powered Insights</span>
            </div>
            
            <div class="content">
                <p>Hello <strong>{{ user.full_name }}</strong>,</p>
                <p>Here's your personalized monthly performance report with AI-generated insights to help you excel!</p>
                
                <!-- Performance Overview -->
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-value">{{ performance_data.total_quizzes }}</div>
                        <div class="stat-label">Quizzes Taken</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ performance_data.overall_accuracy }}%</div>
                        <div class="stat-label">Overall Accuracy</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ performance_data.total_correct }}/{{ performance_data.total_questions }}</div>
                        <div class="stat-label">Correct Answers</div>
                    </div>
                </div>
                
                <!-- AI Insights Section -->
                <div class="ai-insights">
                    <h3>🤖 AI-Powered Performance Analysis</h3>
                    <div style="white-space: pre-line; margin-top: 15px;">{{ ai_insights }}</div>
                </div>
                
                <!-- Detailed Performance -->
                <div class="insight-section">
                    <h3>📊 Detailed Quiz Performance</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Quiz Name</th>
                                <th>Score</th>
                                <th>Correct Answers</th>
                                <th>Completion Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for quiz in performance_data.quiz_performance %}
                            <tr>
                                <td>{{ quiz.quiz_name }}</td>
                                <td>{{ quiz.score_percentage }}%</td>
                                <td>{{ quiz.correct_answers }}/{{ quiz.total_questions }}</td>
                                <td>{{ quiz.completion_date }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
                
                <!-- Subject Breakdown -->
                <div class="insight-section">
                    <h3>📚 Subject-Wise Performance</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Accuracy</th>
                                <th>Correct/Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for subject in performance_data.subject_breakdown %}
                            <tr>
                                <td>{{ subject.subject }}</td>
                                <td>{{ subject.accuracy }}%</td>
                                <td>{{ subject.correct }}/{{ subject.total }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
                
                <a href="http://localhost:5173/dashboard" class="dashboard-link">
                    Continue Your Learning Journey
                </a>
                
                <div class="footer">
                    <p>Quizlytics AI Insights Report • Generated on {{ now.strftime('%Y-%m-%d') }}</p>
                    <p>Your success is our priority! Keep pushing your boundaries! 🚀</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """)
    
    return template.render(
        user=user,
        month=month,
        performance_data=performance_data,
        ai_insights=ai_insights,
        now=datetime.utcnow()
    )

@celery.task
def send_html_email(recipient, name, subject, html_content):
    try:
        msg = Message(
            subject=subject,
            recipients=[recipient],
            html=html_content,
            sender=app.config['MAIL_DEFAULT_SENDER']
        )

        mail.send(msg)
        print(f"Sent HTML email to {recipient}")
    except Exception as e:
        print(f"Failed to send HTML email to {recipient}: {str(e)}")

@celery.task(name='celery_worker.export_scores_csv')
def export_scores_csv(recipient_email):
    """Export all quiz scores to CSV and email to admin"""
    try:
        # Query all scores with related data
        scores = Score.query.options(
            joinedload(Score.user),
            joinedload(Score.quiz).joinedload(Quiz.chapter).joinedload(Chapter.subject),
            joinedload(Score.question)
        ).all()

        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'User ID', 'Username', 'Email', 'Quiz ID', 'Subject', 
            'Chapter', 'Question', 'Selected Option', 'Correct Option',
            'Is Correct', 'Timestamp'
        ])
        
        for score in scores:
            writer.writerow([
                score.user.id,
                score.user.username,
                score.user.email,
                score.quiz_id,
                score.quiz.chapter.subject.name,
                score.quiz.chapter.name,
                score.question.question_statement,
                score.selected_option,
                score.question.correct_option,
                score.selected_option == score.question.correct_option,
                score.timestamp.isoformat()
            ])
        
        csv_content = output.getvalue()
        output.close()

        # Create email with attachment
        msg = Message(
            subject="Quizlytics Scores Export",
            recipients=[recipient_email],
            body="Please find attached the CSV export of all quiz scores."
        )
        msg.attach("quiz_scores.csv", "text/csv", csv_content)
        
        mail.send(msg)
        print(f"Sent scores CSV to {recipient_email}")
    except Exception as e:
        print(f"Failed to export scores CSV: {str(e)}")

@celery.task(name='celery_worker.export_user_performance_csv')
def export_user_performance_csv(recipient_email, user_id=None):
    """Export user performance data to CSV"""
    try:
        # Query user performance data
        if user_id:
            # Single user export
            user = User.query.get(user_id)
            if not user:
                return
                
            filename = f"user_{user_id}_performance.csv"
            subject = f"Quizlytics Performance Report - {user.username}"
            
            # Get all attempts for this user
            attempts = QuizAttempt.query.filter_by(user_id=user_id).all()
        else:
            # All users export (admin)
            filename = "all_users_performance.csv"
            subject = "Quizlytics All Users Performance Report"
            
            # Get all attempts
            attempts = QuizAttempt.query.all()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'User ID', 'Username', 'Email', 'Quiz ID', 'Subject', 
            'Chapter', 'Start Time', 'End Time', 'Time Spent (s)',
            'Correct Answers', 'Total Questions', 'Score (%)'
        ])
        
        for attempt in attempts:
            # Get scores for this attempt
            scores = Score.query.filter_by(attempt_id=attempt.id).all()
            total_questions = len(scores)
            correct_answers = sum(
                1 for s in scores 
                if s.selected_option == s.question.correct_option
            )
            score_percentage = round((correct_answers / total_questions) * 100) if total_questions else 0
            
            writer.writerow([
                attempt.user_id,
                attempt.user.username,
                attempt.user.email,
                attempt.quiz_id,
                attempt.quiz.chapter.subject.name,
                attempt.quiz.chapter.name,
                attempt.start_time.isoformat(),
                attempt.end_time.isoformat() if attempt.end_time else '',
                attempt.time_spent,
                correct_answers,
                total_questions,
                score_percentage
            ])
        
        csv_content = output.getvalue()
        output.close()
        msg = Message(
            subject=subject,
            recipients=[recipient_email],
            body="Please find attached the performance data export."
        )
        msg.attach(filename, "text/csv", csv_content)
        
        mail.send(msg)
        print(f"Sent performance CSV to {recipient_email}")
    except Exception as e:
        print(f"Failed to export performance CSV: {str(e)}")