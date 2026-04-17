import os
import uuid

from flask import Blueprint, request, jsonify, current_app, send_from_directory
from sqlalchemy.orm import joinedload
import logging
logger = logging.getLogger(__name__)
from datetime import date

if __package__:
    from ..models import db, Item, Outfit, OutfitItem
    from ..helpers import require_auth, outfit_to_dict
else:
    from models import db, Item, Outfit, OutfitItem
    from helpers import require_auth, outfit_to_dict

outfits_bp = Blueprint("outfits", __name__)


@outfits_bp.route("/outfits", methods=["GET"])
def get_outfits():
    user, err = require_auth()
    if err:
        return err
    outfits = db.session.execute(
        db.select(Outfit)
        .where(Outfit.user_id == user.id)
        .order_by(Outfit.worn_date.desc())
        .options(joinedload(Outfit.outfit_items))
    ).unique().scalars().all()
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

    try:
        outfit = Outfit(worn_date=worn_date, notes=notes, image_path=image_path, user_id=user.id)
        db.session.add(outfit)
        db.session.flush()

        # Fetch all items in one query to optimize performance and check ownership
        item_ids_int = list(set(int(iid) for iid in item_ids))
        items = db.session.execute(
            db.select(Item).where(Item.id.in_(item_ids_int))
        ).scalars().all()

        # Check ownership and existence for all items
        found_item_ids = {item.id for item in items}
        for item in items:
            if item.user_id != user.id:
                db.session.rollback()
                return jsonify({"error": f"Forbidden: Item {item.id} does not belong to you"}), 403
            if item.archived_at is not None:
                db.session.rollback()
                return jsonify({"error": f"Item {item.id} is archived and cannot be used"}), 400

        # Validate that all requested items were found
        for iid in item_ids_int:
            if iid not in found_item_ids:
                db.session.rollback()
                return jsonify({"error": f"Item {iid} not found"}), 404

        # Link items to outfit
        for item in items:
            db.session.add(OutfitItem(outfit_id=outfit.id, item_id=item.id, user_action="user_added"))

        db.session.commit()
        return jsonify(outfit_to_dict(outfit)), 201
    except Exception as e:
        db.session.rollback()
        logger.error("Failed to create outfit: %s", e)
        return jsonify({"error": "Database error"}), 500


@outfits_bp.route("/uploads/<string:filename>")
def uploaded_file(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)
