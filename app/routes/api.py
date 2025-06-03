from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models.models import Patient, MedicalHistory, Visit, Prescription
from app import db

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/patients', methods=['GET'])
@login_required
def get_patients():
    # Only hospital_staff and ngo_admin can view all patients
    if current_user.role not in ['hospital_staff', 'ngo_admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    patients = Patient.query.all()
    return jsonify([{'id': p.id, 'name': p.user.name} for p in patients])

# Add more API endpoints as needed for data sync, logs, etc.
