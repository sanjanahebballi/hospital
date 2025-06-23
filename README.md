# Healthcare Data System

A comprehensive healthcare data management system that facilitates collaboration between hospitals and NGOs to provide better patient care.

## Features

- User Authentication with role-based access (Patient, Hospital Staff, NGO Admin)
- Patient Data Management
- Medical Records Management
- Role-specific Dashboards
- Secure Data Sharing
- Patient Profile Management

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Backend**: Python Flask
- **Database**: MySQL
- **Authentication**: Flask-Login
- **Security**: CSRF Protection, Password Hashing

## Prerequisites

- Python 3.8 or higher
- MySQL Server
- pip (Python package manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/healthcare-data-system.git
cd healthcare-data-system
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a MySQL database:
```sql
CREATE DATABASE healthcare_db;
```

6. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the values in `.env` with your configuration

7. Initialize the database:
```bash
flask db upgrade
```

## Running the Application

1. Activate the virtual environment (if not already activated)
2. Run the Flask application:
```bash
python app.py
```
3. Access the application at `http://localhost:5000`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
SECRET_KEY=your-super-secret-key
DATABASE_URL=mysql+pymysql://username:password@localhost/healthcare_db
FLASK_ENV=development
FLASK_DEBUG=1
```

## Project Structure

```
healthcare-data-system/
├── app.py
├── config.py
├── requirements.txt
├── .env
├── instance/
├── migrations/
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── templates/
    ├── base.html
    ├── login.html
    ├── register.html
    ├── patient_dashboard.html
    ├── hospital_dashboard.html
    └── ngo_dashboard.html
```

## Security Considerations

- All passwords are hashed before storage
- CSRF protection enabled
- Session management implemented
- Input validation and sanitization
- SQL injection prevention through SQLAlchemy
- Secure file uploads with type checking and size limits

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
