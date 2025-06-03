from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
from app.models.models import Patient

ngo_bp = Blueprint('ngo', __name__, url_prefix='/ngo')

@ngo_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role != 'ngo_admin':
        flash('Access denied.', 'danger')
        return redirect(url_for('auth.login'))
    # Show all patients and their support/assistance history
    patients = Patient.query.all()
    return render_template('ngo/dashboard.html', patients=patients)
