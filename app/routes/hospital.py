from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from app.models.models import Patient, User
from app import db

hospital_bp = Blueprint('hospital', __name__, url_prefix='/hospital')

@hospital_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role != 'hospital_staff':
        flash('Access denied.', 'danger')
        return redirect(url_for('auth.login'))
    patients = Patient.query.all()
    return render_template('hospital/dashboard.html', patients=patients)

@hospital_bp.route('/patients/add', methods=['GET', 'POST'])
@login_required
def add_patient():
    if current_user.role != 'hospital_staff':
        flash('Access denied.', 'danger')
        return redirect(url_for('auth.login'))
    if request.method == 'POST':
        # Collect patient data from form
        # ...
        flash('Patient added successfully.', 'success')
        return redirect(url_for('hospital.dashboard'))
    return render_template('hospital/add_patient.html')
