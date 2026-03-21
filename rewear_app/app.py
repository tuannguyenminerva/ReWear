import base64
import os
import time
from flask import Flask, request, jsonify, session, render_template
from models import db, User, Outfit, OutfitItem, Item
app = Flask(__name__)

#configurations 
app.config['SECRET_KEY'] = 'dev-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()


@app.route("/")
def home():
    return "ReWear backend is running!"

@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 409

    user = User(email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id

    return jsonify({"message": "User registered"}), 201


@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    session["user_id"] = user.id

    return jsonify({"message": "Logged in"})


@app.route("/auth/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"message": "Logged out"})


@app.route("/auth/me", methods=["GET"])
def me():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    user = User.query.get(user_id)

    if not user:
        session.pop("user_id", None)
        return jsonify({"error": "Not authenticated"}), 401

    return jsonify({
        "id": user.id,
        "email": user.email
    })

@app.route("/scan")
def scan():
    return render_template("scan.html")

@app.route("/outfit/scan", methods=["POST"])
def scan_outfit():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"error": "No image provided"}), 400

    # Decode base64 image from frontend
    image_data = data["image"].split(",")[1]
    image_bytes = base64.b64decode(image_data)

    # Save to disk
    os.makedirs("uploads", exist_ok=True)
    filename = f"outfit_{user_id}_{int(time.time())}.jpg"
    filepath = os.path.join("uploads", filename)

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    # Create Outfit record
    outfit = Outfit(
        image_path=filepath,
        user_id=user_id,
        ai_status="pending"
    )
    db.session.add(outfit)
    db.session.commit()

    return jsonify({
        "message": "Outfit saved",
        "outfit_id": outfit.id,
        "image_path": filepath
    }), 201



if __name__ == "__main__":
    app.run(debug=True)

