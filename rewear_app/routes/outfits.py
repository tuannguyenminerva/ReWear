from flask import Blueprint, request, jsonify, current_app
from ..models import db, Item, Outfit, OutfitItem
from datetime import date
from ..auth_guard import require_auth
from ..serializers import outfit_to_dict
from ..helpers import StorageHandler

outfits_bp = Blueprint("outfits", __name__)


@outfits_bp.route("/outfits", methods=["GET"])
def get_outfits():
    user, err = require_auth()
    if err:
        return err
    outfits = (
        Outfit.query
        .filter_by(user_id=user.id)
        .order_by(Outfit.worn_date.desc())
        .all()
    )
    return jsonify([outfit_to_dict(o) for o in outfits])


@outfits_bp.route("/outfits", methods=["POST"])
def create_outfit():
    user, err = require_auth()
    if err:
        return err

    if request.content_type and "multipart" in request.content_type:
        worn_date_str = request.form.get("date")
        item_ids = request.form.getlist("item_ids")
        notes = request.form.get("notes", "")
        image_path = None
        if "image" in request.files:
            f = request.files["image"]
            if not f.content_type or not f.content_type.startswith("image/"):
                return jsonify({"error": "Only image files are allowed"}), 415
            f.stream.seek(0, 2)
            file_size = f.stream.tell()
            f.stream.seek(0) 
            if file_size > 10 * 1024 * 1024:
                return jsonify({"error": "Image too large (max 10 MB)"}), 413
            image_path = StorageHandler.save_file(
                f, current_app.config["UPLOAD_FOLDER"]
            )
    else:
        data = request.get_json() or {}
        worn_date_str = data.get("date")
        item_ids = data.get("item_ids", [])
        notes = data.get("notes", "")
        image_path = data.get("image_path")

    try:
        worn_date = (
            date.fromisoformat(worn_date_str) if worn_date_str else date.today()
        )
    except ValueError:
        worn_date = date.today()

    outfit = Outfit(
        worn_date=worn_date, notes=notes, image_path=image_path, user_id=user.id
    )
    db.session.add(outfit)
    db.session.flush()

    for iid in item_ids:
        item = Item.query.filter_by(id=int(iid), user_id=user.id).first()
        if item:
            db.session.add(OutfitItem(
                outfit_id=outfit.id, item_id=item.id, user_action="user_added"
            ))

    db.session.commit()
    return jsonify(outfit_to_dict(outfit)), 201
