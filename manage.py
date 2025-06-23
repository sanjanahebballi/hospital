from flask.cli import FlaskGroup
from app import app, db  # If your main app is app.py at root

cli = FlaskGroup(app)

if __name__ == "__main__":
    cli()