from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
from app.models.models import Patient

patient_bp = Blueprint('patient', __name__, url_prefix='/patient')

@patient_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role != 'patient':
        flash('Access denied.', 'danger')
        return redirect(url_for('auth.login'))
    patient = Patient.query.filter_by(user_id=current_user.id).first()
    return render_template('patient/dashboard.html', patient=patient)
