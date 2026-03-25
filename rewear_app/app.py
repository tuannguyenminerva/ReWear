import base64
import os
import uuid
from flask import Flask, request, jsonify, session, render_template
from flask_cors import CORS
from models import db, User, Item, Outfit, OutfitItem
from datetime import date
app = Flask(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
app.config['SECRET_KEY'] = 'dev-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db.init_app(app)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

with app.app_context():
    db.create_all()


# ── Helpers ───────────────────────────────────────────────────────────────────
def require_auth():
    """Return (user, None) or (None, error_response)."""
    user_id = session.get("user_id")
    if not user_id:
        return None, (jsonify({"error": "Not authenticated"}), 401)
    user = User.query.get(user_id)
    if not user:
        session.pop("user_id", None)
        return None, (jsonify({"error": "Not authenticated"}), 401)
    return user, None


def item_to_dict(item):
    """Serialize an Item with computed wear stats."""
    wear_count = len(item.outfit_items)
    last_worn = None
    if item.outfit_items:
        outfits = [Outfit.query.get(oi.outfit_id) for oi in item.outfit_items]
        dates = [o.worn_date for o in outfits if o is not None]
        last_worn = max(dates).isoformat() if dates else None
    return {
        "id": str(item.id),
        "name": item.name,
        "category": item.category or "Top",
        "image": item.image_path or "",
        "wearCount": wear_count,
        "lastWorn": last_worn or item.created_at.date().isoformat(),
        "color": item.color or item.ai_color_primary or "",
        "brand": item.brand or "",
        "addedDate": item.created_at.date().isoformat(),
        "cost": item.cost,
    }


def outfit_to_dict(outfit):
    return {
        "id": str(outfit.id),
        "date": outfit.worn_date.isoformat(),
        "items": [str(oi.item_id) for oi in outfit.outfit_items],
        "imagePath": outfit.image_path,
    }


# ── Home ──────────────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return "ReWear backend is running!"


# ── Auth ──────────────────────────────────────────────────────────────────────
@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    email = data.get("email")
    password = data.get("password")
    username = data.get("username") or data.get("name") or email

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 409

    user = User(email=email, username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    return jsonify({"message": "User registered", "user": {"id": user.id, "email": user.email, "username": user.username}}), 201


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
    return jsonify({"message": "Logged in", "user": {"id": user.id, "email": user.email, "username": user.username}})


@app.route("/auth/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"message": "Logged out"})


@app.route("/auth/me", methods=["GET"])
def me():
    user, err = require_auth()
    if err:
        return err
    return jsonify({"id": user.id, "email": user.email, "username": user.username})


# ── Items (Wardrobe) ──────────────────────────────────────────────────────────
@app.route("/items", methods=["GET"])
def get_items():
    user, err = require_auth()
    if err:
        return err
    items = Item.query.filter_by(user_id=user.id, archived_at=None).all()
    return jsonify([item_to_dict(i) for i in items])


@app.route("/items", methods=["POST"])
def create_item():
    user, err = require_auth()
    if err:
        return err
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    item = Item(
        name=data["name"],
        category=data.get("category", "Top"),
        color=data.get("color", ""),
        brand=data.get("brand", ""),
        cost=data.get("cost"),
        image_path=data.get("image", ""),
        user_id=user.id,
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item_to_dict(item)), 201


@app.route("/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    user, err = require_auth()
    if err:
        return err
    item = Item.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    for field in ("name", "category", "color", "brand", "cost", "image_path"):
        if field in data:
            setattr(item, field, data[field])
    # allow frontend to send 'image' key too
    if "image" in data:
        item.image_path = data["image"]
    db.session.commit()
    return jsonify(item_to_dict(item))


@app.route("/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    user, err = require_auth()
    if err:
        return err
    item = Item.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return jsonify({"error": "Not found"}), 404
    from datetime import datetime
    item.archived_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Archived"})


# ── Outfits ───────────────────────────────────────────────────────────────────
@app.route("/outfits", methods=["GET"])
def get_outfits():
    user, err = require_auth()
    if err:
        return err
    outfits = Outfit.query.filter_by(user_id=user.id).order_by(Outfit.worn_date.desc()).all()
    return jsonify([outfit_to_dict(o) for o in outfits])


@app.route("/outfits", methods=["POST"])
def create_outfit():
    user, err = require_auth()
    if err:
        return err

    # Support multipart (with image) or JSON
    if request.content_type and "multipart" in request.content_type:
        worn_date_str = request.form.get("date")
        item_ids = request.form.getlist("item_ids")
        notes = request.form.get("notes", "")
        image_path = None
        if "image" in request.files:
            f = request.files["image"]
            ext = os.path.splitext(f.filename)[1] if f.filename else '.jpg'
            filename = f"{uuid.uuid4().hex}{ext}"
            save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            f.save(save_path)
            image_path = f"/uploads/{filename}"
    else:
        data = request.get_json() or {}
        worn_date_str = data.get("date")
        item_ids = data.get("item_ids", [])
        notes = data.get("notes", "")
        image_path = data.get("image_path")

    try:
        worn_date = date.fromisoformat(worn_date_str) if worn_date_str else date.today()
    except ValueError:
        worn_date = date.today()

    outfit = Outfit(worn_date=worn_date, notes=notes, image_path=image_path, user_id=user.id)
    db.session.add(outfit)
    db.session.flush()  # get outfit.id

    for iid in item_ids:
        item = Item.query.filter_by(id=int(iid), user_id=user.id).first()
        if item:
            db.session.add(OutfitItem(outfit_id=outfit.id, item_id=item.id, user_action="user_added"))

    db.session.commit()
    return jsonify(outfit_to_dict(outfit)), 201


# ── Static uploads ────────────────────────────────────────────────────────────
@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    from flask import send_from_directory
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


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
    filename = f"{uuid.uuid4().hex}.jpg"
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
