from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from models import db, User, Patient, MedicalRecord, Message, Hospital, Notification
import os
import random
import string
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'development-key-replace-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Sanjana123@localhost/healthcare'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Initialize db with app
db.init_app(app)
migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'
login_manager.init_app(app)

ADMIN_EMAIL = "admin@hospital.com"

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            if user.email == ADMIN_EMAIL and not user.is_verified:
                # Generate and store verification code for admin
                code = generate_verification_code()
                user.verification_code = code
                db.session.commit()
                # In production, send email here
                print(f"Admin verification code: {code}")
                return redirect(url_for('verify_admin'))
                
            login_user(user)
            user.last_login = datetime.utcnow()
            db.session.commit()
            return redirect(url_for('dashboard'))
            
        flash('Invalid email or password', 'danger')
    return render_template('login.html')


def init_db():
    with app.app_context():
        db.create_all()
        # Create admin user if not exists
        admin = User.query.filter_by(email=ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=ADMIN_EMAIL,
                password_hash=generate_password_hash('admin123'),
                role='admin',
                name='Admin',
                is_verified=False
            )
            db.session.add(admin)
            db.session.commit()
        # Add 10 patients with different diseases if not already present
        if not Patient.query.first():
            diseases = ['Cancer', 'TB', 'AIDS', 'HIV']
            hospitals = ['City Hospital', 'Metro Hospital']
            for i in range(10):
                email = f'patient{i+1}@example.com'
                if not User.query.filter_by(email=email).first():
                    user = User(
                        email=email,
                        password_hash=generate_password_hash('password'),
                        role='patient',
                        name=f'Patient {i+1}',
                        is_verified=True
                    )
                    db.session.add(user)
                    db.session.commit()
                    patient = Patient(
                        user_id=user.id,
                        name=user.name,
                        notice_period=7 + (i % 4),
                        last_visit=datetime(2025, 6, 10 + i),
                        next_visit=datetime(2025, 7, 1 + i),
                        disease=diseases[i % 4]
                    )
                    db.session.add(patient)
            db.session.commit()

# Only run the app if this file is executed directly
if __name__ == '__main__':
    init_db()
    app.run(debug=True)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

@app.route('/verify_admin', methods=['GET', 'POST'])
def verify_admin():
    if request.method == 'POST':
        code = request.form.get('code')
        admin = User.query.filter_by(email=ADMIN_EMAIL).first()
        
        if admin and code == admin.verification_code:
            admin.is_verified = True
            admin.verification_code = None
            db.session.commit()
            login_user(admin)
            flash('Admin verified successfully!', 'success')
            return redirect(url_for('dashboard'))
            
        flash('Invalid verification code', 'danger')
    return render_template('verify_admin.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        role = request.form.get('role')
        name = request.form.get('name')

        if email == ADMIN_EMAIL and role != 'admin':
            flash('This email is reserved for admin use', 'danger')
            return redirect(url_for('register'))

        if User.query.filter_by(email=email).first():
            flash('Email already exists', 'danger')
            return redirect(url_for('register'))

        user = User(
            email=email,
            password_hash=generate_password_hash(password),
            role=role,
            name=name,
            is_verified=True if role != 'admin' else False
        )
        db.session.add(user)
        db.session.commit()

        if role == 'patient':
            patient = Patient(
                user_id=user.id,
                notice_period=7  # Default notice period
            )
            db.session.add(patient)
            db.session.commit()

        flash('Registration successful!', 'success')
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role == 'admin' or current_user.role == 'hospital_staff':
        patients = Patient.query.all()
        return render_template('admin_dashboard.html', user=current_user, patients=patients)
    elif current_user.role == 'patient':
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        return render_template('patient_dashboard.html', user=current_user, patient=patient)
    elif current_user.role == 'ngo_admin':
        patients = Patient.query.all()
        # Aggregate disease counts
        disease_counts = {d: 0 for d in ['Cancer', 'TB', 'AIDS', 'HIV']}
        for p in patients:
            if p.disease in disease_counts:
                disease_counts[p.disease] += 1
        return render_template('ngo_dashboard.html', user=current_user, patients=patients, disease_counts=disease_counts)

@app.route('/messages')
@login_required
def messages():
    received = Message.query.filter_by(receiver_id=current_user.id)\
        .order_by(Message.sent_at.desc()).all()
    sent = Message.query.filter_by(sender_id=current_user.id)\
        .order_by(Message.sent_at.desc()).all()
    return render_template('messages.html', received=received, sent=sent)

@app.route('/send_message', methods=['POST'])
@login_required
def send_message():
    receiver_id = request.form.get('receiver_id')
    subject = request.form.get('subject')
    message_text = request.form.get('message')
    is_urgent = request.form.get('is_urgent', type=bool)
    
    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        subject=subject,
        message=message_text,
        is_urgent=is_urgent
    )
    db.session.add(message)
    
    # Create notification for receiver
    notification = Notification(
        user_id=receiver_id,
        title=f"New message from {current_user.name}",
        message=subject,
        type='message',
        priority='high' if is_urgent else 'normal'
    )
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({'message': 'Message sent successfully'})

@app.route('/update_patient/<int:patient_id>', methods=['POST'])
@login_required
def update_patient(patient_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    patient = Patient.query.get_or_404(patient_id)
    data = request.get_json()
    
    if 'assigned_hospital' in data:
        patient.assigned_hospital = data['assigned_hospital']
    if 'notice_period' in data:
        patient.notice_period = data['notice_period']
    if 'notes' in data:
        patient.patient_notes = data['notes']
        
    db.session.commit()
    return jsonify({'message': 'Patient updated successfully'})

@app.route('/reschedule_appointment', methods=['POST'])
@login_required
def reschedule_appointment():
    if current_user.role != 'patient':
        return jsonify({'error': 'Unauthorized'}), 403
        
    patient = Patient.query.filter_by(user_id=current_user.id).first()
    new_date = datetime.strptime(request.form.get('new_date'), '%Y-%m-%d %H:%M')
    
    if (new_date - datetime.utcnow()).days < patient.notice_period:
        return jsonify({
            'error': f'Please provide at least {patient.notice_period} days notice for rescheduling'
        }), 400
        
    patient.next_visit = new_date
    db.session.commit()
    
    # Notify hospital staff
    notification = Notification(
        user_id=1,  # Admin will receive this
        title=f"Appointment Rescheduled - Patient {patient.id}",
        message=f"Patient {current_user.name} rescheduled their appointment to {new_date.strftime('%Y-%m-%d %H:%M')}",
        type='appointment',
        priority='normal'
    )
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({'message': 'Appointment rescheduled successfully'})

@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html', user=current_user)

@app.route('/settings')
@login_required
def settings():
    return render_template('settings.html', user=current_user)
