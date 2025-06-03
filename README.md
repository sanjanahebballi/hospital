# Healthcare Data Management System

A web-based healthcare data management system that facilitates collaboration between hospitals, NGOs, and patients.

## Features

- User Authentication & Role Management
- Patient Data Management
- Medical Records & History
- Role-specific Dashboards
- Secure Data Sharing
- Real-time Updates

## Tech Stack

- Backend: Python Flask
- Database: SQLite (Development) / PostgreSQL (Production)
- Frontend: HTML, CSS, JavaScript
- Authentication: Flask-Login
- Forms: Flask-WTF
- Database ORM: SQLAlchemy

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd healthcare-data-system
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
- Copy `.env.example` to `.env`
- Update the variables with your configuration

5. Initialize the database:
```bash
flask db upgrade
```

6. Run the application:
```bash
python run.py
```

## Deployment

This application is configured for deployment on Render:

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure environment variables
5. Deploy!

## License

MIT License
