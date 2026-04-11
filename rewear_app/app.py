import logging
import os

from flask import Flask
from flask_cors import CORS
from models import db
from routes import auth_bp, items_bp, outfits_bp, detection_bp

logger = logging.getLogger(__name__)

app = Flask(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
_secret_key = os.environ.get('SECRET_KEY')
if not _secret_key:
    _secret_key = 'dev-secret-key-change-in-production'
    logger.warning(
        'SECRET_KEY env var not set — using insecure default. '
        'Set SECRET_KEY in your environment before deploying.'
    )
app.config['SECRET_KEY'] = _secret_key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

_production = os.environ.get('PRODUCTION', '').lower() in ('1', 'true', 'yes')
app.config['SESSION_COOKIE_SAMESITE'] = 'None' if _production else 'Lax'
app.config['SESSION_COOKIE_SECURE'] = _production
app.config['SESSION_COOKIE_HTTPONLY'] = True

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ── Extensions ────────────────────────────────────────────────────────────────
db.init_app(app)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://localhost:3001"])

with app.app_context():
    db.create_all()

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(items_bp)
app.register_blueprint(outfits_bp)
app.register_blueprint(detection_bp)


@app.route("/")
def home():
    return "ReWear backend is running!"


if __name__ == "__main__":
    app.run(debug=True, port=5001)
