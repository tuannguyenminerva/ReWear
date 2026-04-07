import os
import uuid

from flask import Blueprint, request, jsonify, current_app, send_from_directory
from models import db, Item, Outfit, OutfitItem
from datetime import date
from helpers import require_auth, outfit_to_dict

outfits_bp = Blueprint("outfits", __name__)


@outfits_bp.route("/outfits", methods=["GET"])
def get_outfits():
    user, err = require_auth()
    if err:
        return err
    outfits = Outfit.query.filter_by(user_id=user.id).order_by(Outfit.worn_date.desc()).all()
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
            ext = os.path.splitext(f.filename)[1] if f.filename else '.jpg'
            filename = f"{uuid.uuid4().hex}{ext}"
            save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
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
    db.session.flush()

    for iid in item_ids:
        item = Item.query.filter_by(id=int(iid), user_id=user.id).first()
        if item:
            db.session.add(OutfitItem(outfit_id=outfit.id, item_id=item.id, user_action="user_added"))

    db.session.commit()
    return jsonify(outfit_to_dict(outfit)), 201


@outfits_bp.route("/uploads/<string:filename>")
def uploaded_file(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)
