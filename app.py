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
    # Always redirect to login page, regardless of authentication
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        role = request.form.get('role')
        user = User.query.filter_by(email=email, role=role).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            user.last_login = datetime.utcnow()
            db.session.commit()
            # Redirect based on role
            if user.role == 'admin':
                return redirect(url_for('admin_dashboard'))
            elif user.role == 'hospital_admin':
                return redirect(url_for('hospital_dashboard'))
            elif user.role == 'patient':
                return redirect(url_for('patient_dashboard'))
            elif user.role == 'ngo_admin':
                return redirect(url_for('ngo_dashboard'))
            elif user.role == 'doctor':
                return redirect(url_for('doctor_dashboard')) if 'doctor_dashboard' in globals() else redirect(url_for('dashboard'))
            else:
                return redirect(url_for('dashboard'))
        flash('Invalid email, password, or role', 'danger')
    return render_template('login.html')


def init_db():
    with app.app_context():
        db.create_all()
        # Create admin user if not exists
        admin = User.query.filter_by(email=ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=ADMIN_EMAIL,
                password=generate_password_hash('hospital123'),
                role='admin',
                name='Hospital Admin',
                is_verified=True
            )
            db.session.add(admin)
            db.session.commit()
        # Add fixed patient
        patient_user = User.query.filter_by(email='patient@gmail.com').first()
        if not patient_user:
            patient_user = User(
                email='patient@gmail.com',
                password=generate_password_hash('patient123'),
                role='patient',
                name='Patient',
                is_verified=True
            )
            db.session.add(patient_user)
            db.session.commit()
            patient = Patient(user_id=patient_user.id, notice_period=7)
            db.session.add(patient)
            db.session.commit()
        # Add fixed NGO admin
        ngo_user = User.query.filter_by(email='ngo@gmail.com').first()
        if not ngo_user:
            ngo_user = User(
                email='ngo@gmail.com',
                password=generate_password_hash('ngo123'),
                role='ngo_admin',
                name='NGO Admin',
                is_verified=True
            )
            db.session.add(ngo_user)
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
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        try:
            name = request.form.get('name')
            email = request.form.get('email')
            password = request.form.get('password')
            role = request.form.get('role')
            # Validate required fields
            if not all([name, email, password, role]):
                flash('All fields are required.', 'danger')
                return redirect(url_for('register'))
            # Prevent hospital_admin registration
            if role == 'hospital_admin':
                flash('Hospital registration is not allowed. Please use the fixed hospital login.', 'danger')
                return redirect(url_for('register'))
            # Check if user already exists
            if User.query.filter_by(email=email).first():
                flash('Email address already registered.', 'danger')
                return redirect(url_for('register'))
            # Create new user
            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
            new_user = User(
                name=name,
                email=email,
                password=hashed_password,
                role=role,
                is_verified=True,
                created_at=datetime.utcnow()
            )
            db.session.add(new_user)
            db.session.commit()
            # If the role is patient, create a patient record
            if role == 'patient':
                new_patient = Patient(
                    user_id=new_user.id,
                    notice_period=7,  # Default notice period
                )
                db.session.add(new_patient)
                db.session.commit()
            # If the role is ngo_admin, redirect to login page
            if role == 'ngo_admin':
                flash('NGO registered successfully! Please log in.', 'success')
                return redirect(url_for('login'))
            # Default: patient registration, redirect to login
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            print(f"Registration error: {str(e)}")  # For debugging
            flash('An error occurred during registration. Please try again.', 'danger')
            return redirect(url_for('register'))
    # GET request - show registration form
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role == 'admin' or current_user.role == 'hospital_admin':
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
        ngo = {
            'name': 'Helping Hands',
            'pincode': '580020',
            'email': 'ngo@email.com',
            'address': 'Hubli City, Karnataka',
            'symbol': 'https://img.icons8.com/color/96/000000/charity.png'
        }
        return render_template('ngo_dashboard.html', user=current_user, patients=patients, disease_counts=disease_counts, ngo=ngo)
    else:
        # For any other role, redirect to login or show a generic dashboard
        flash('Access denied or dashboard not implemented for your role.', 'danger')
        return redirect(url_for('login'))

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
    if current_user.role != 'patipython appent':
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

# Separate dashboards for each role
@app.route('/admin_dashboard')
@login_required
def admin_dashboard():
    if current_user.role not in ['admin', 'hospital_admin']:
        flash('Access denied.', 'danger')
        return redirect(url_for('login'))
    # Show hospital dashboard for hospital_admin
    if current_user.role == 'hospital_admin':
        hospital = Hospital.query.filter_by(email=current_user.email).first()
        hospitals = [hospital] if hospital else []
        patients = Patient.query.all()
        return render_template('hospitals.html', user=current_user, hospitals=hospitals, patients=patients)
    # Show admin dashboard for admin
    patients = Patient.query.all()
    return render_template('admin_dashboard.html', user=current_user, patients=patients)

@app.route('/patient_dashboard')
@login_required
def patient_dashboard():
    if current_user.role != 'patient':
        flash('Access denied.', 'danger')
        return redirect(url_for('login'))
    patient = Patient.query.filter_by(user_id=current_user.id).first()
    return render_template('patient_dashboard.html', user=current_user, patient=patient)

@app.route('/ngo_dashboard')
@login_required
def ngo_dashboard():
    if current_user.role != 'ngo_admin':
        flash('Access denied.', 'danger')
        return redirect(url_for('login'))
    patients = Patient.query.all()
    disease_counts = {d: 0 for d in ['Cancer', 'TB', 'AIDS', 'HIV']}
    for p in patients:
        if p.disease in disease_counts:
            disease_counts[p.disease] += 1
    ngo = {
        'name': 'Hope & Health Network',
        'pincode': '560040',
        'email': 'ngo@gmail.com',
        'address': '#23, 4th Cross, Vijayanagar, Bangalore, Karnataka - 560040',
        'symbol': 'https://img.icons8.com/color/96/000000/charity.png',
        'badge': 'NGO'
    }
    return render_template('ngo_dashboard.html', user=current_user, patients=patients, disease_counts=disease_counts, ngo=ngo)

@app.route('/appointments')
@login_required
def appointments():
    if current_user.role != 'patient':
        flash('Access denied.', 'danger')
        return redirect(url_for('login'))
    # You can expand this to show real appointments
    return render_template('appointments.html', user=current_user)

@app.route('/medical_records')
@login_required
def medical_records():
    if current_user.role != 'patient':
        flash('Access denied.', 'danger')
        return redirect(url_for('login'))
    # You can expand this to show real medical records
    return render_template('medical_records.html', user=current_user)

@app.route('/hospitals')
@login_required
def hospitals():
    if current_user.role not in ['admin', 'hospital']:
        flash('Access denied.', 'danger')
        return redirect(url_for('login'))
    if current_user.role == 'hospital':
        # Show only this hospital's data
        hospital = Hospital.query.filter_by(email=current_user.email).first()
        hospitals = [hospital] if hospital else []
    else:
        hospitals = Hospital.query.all()
    patients = Patient.query.all()
    return render_template('hospitals.html', user=current_user, hospitals=hospitals, patients=patients)

@app.route('/hospitals_dashboard')
@login_required
def hospitals_dashboard():
    if current_user.role != 'hospital':
        flash('Access denied.', 'danger')
        return redirect(url_for('login'))
    hospitals = Hospital.query.all()
    patients = Patient.query.all()
    # You may want to fetch appointments and next visits here as well
    # Example: appointments = Appointment.query.all()
    return render_template('hospitals.html', user=current_user, hospitals=hospitals, patients=patients)

@app.route('/add_patient', methods=['GET', 'POST'])
@login_required
def add_patient():
    if current_user.role not in ['admin', 'hospital_staff']:
        flash('Access denied.', 'danger')
        return redirect(url_for('login'))
    if request.method == 'POST':
        # Placeholder: handle patient creation
        flash('Patient added (demo only).', 'success')
        return redirect(url_for('hospitals'))
    return render_template('add_patient.html', user=current_user)

@app.route('/hospital_dashboard')
@login_required
def hospital_dashboard():
    if current_user.role != 'hospital_admin':
        flash('Access denied.', 'danger')
        return redirect(url_for('login'))
    # Predefined hospitals
    hospitals = [
        {
            'id': 1,
            'name': 'SDM Hospital',
            'area': 'Dharwad',
            'pincode': '580001',
            'address': 'SDM Hospital, Sattur Colony, Dharwad, Karnataka'
        },
        {
            'id': 2,
            'name': 'KIMS Hospital',
            'area': 'Hubli',
            'pincode': '580022',
            'address': 'KIMS Hospital, Vidyanagar, Hubli, Karnataka'
        },
        {
            'id': 3,
            'name': 'Balaji Hospital',
            'area': 'Hubli',
            'pincode': '580021',
            'address': 'Balaji Hospital, Gokul Road, Hubli, Karnataka'
        },
        {
            'id': 4,
            'name': 'Civil Hospital',
            'area': 'Dharwad',
            'pincode': '580002',
            'address': 'Civil Hospital, Malmaddi, Dharwad, Karnataka'
        }
    ]
    # Demo: All patients (in real app, filter by hospital)
    all_patients = Patient.query.all()
    def patient_to_dict(p):
        return {
            'id': p.id,
            'name': getattr(p, 'name', ''),
            'user_id': p.user_id,
            'notice_period': p.notice_period,
            'last_visit': p.last_visit.strftime('%Y-%m-%d') if p.last_visit else '',
            'next_visit': p.next_visit.strftime('%Y-%m-%d') if p.next_visit else '',
            'disease': getattr(p, 'disease', ''),
            'assigned_hospital': getattr(p, 'assigned_hospital', ''),
            'patient_notes': getattr(p, 'patient_notes', '')
        }
    patients_json = [patient_to_dict(p) for p in all_patients]
    # Demo: Appointments (replace with real data)
    appointments = [
        {'hospital_id': 1, 'patient_name': 'Patient 1', 'time': '2025-07-01 10:00', 'department': 'HIV'},
        {'hospital_id': 2, 'patient_name': 'Patient 2', 'time': '2025-07-02 11:00', 'department': 'AIDS'},
        {'hospital_id': 3, 'patient_name': 'Patient 3', 'time': '2025-07-03 09:30', 'department': 'TB'},
        {'hospital_id': 4, 'patient_name': 'Patient 4', 'time': '2025-07-04 14:00', 'department': 'Cancer'}
    ]
    # Demo: Next visits (replace with real data)
    next_visits = [
        {'patient_name': 'Patient 1', 'next_visit': '2025-07-10', 'reason': 'Medicine follow-up', 'hospital': 'SDM Hospital'},
        {'patient_name': 'Patient 2', 'next_visit': '2025-07-12', 'reason': 'Checkup', 'hospital': 'KIMS Hospital'},
        {'patient_name': 'Patient 3', 'next_visit': '2025-07-15', 'reason': 'Lab Test', 'hospital': 'Balaji Hospital'},
        {'patient_name': 'Patient 4', 'next_visit': '2025-07-18', 'reason': 'Consultation', 'hospital': 'Civil Hospital'}
    ]
    return render_template('hospitals.html', user=current_user, hospitals=hospitals, patients_json=patients_json, appointments=appointments, next_visits=next_visits)

@app.route('/update_next_visit', methods=['POST'])
@login_required
def update_next_visit():
    if current_user.role != 'hospital_admin':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    patient_id = data.get('patient_id')
    new_date = data.get('next_visit')
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404
    # Prevent duplicate next visit date
    if patient.next_visit and patient.next_visit.strftime('%Y-%m-%d') == new_date:
        return jsonify({'error': 'This date is already set as the next visit.'}), 400
    # Update next visit
    patient.next_visit = datetime.strptime(new_date, '%Y-%m-%d')
    db.session.commit()
    # Send notification (in-app, extend for email/SMS if needed)
    notification = Notification(
        user_id=patient.user_id,
        title='Next Visit Updated',
        message=f'Your next visit is scheduled for {new_date}.',
        type='next_visit',
        priority='normal'
    )
    db.session.add(notification)
    db.session.commit()
    return jsonify({'message': 'Next visit updated and patient notified!'})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
