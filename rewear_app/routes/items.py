import base64
import logging
import os
import uuid

from flask import Blueprint, request, jsonify, current_app
from models import db, Item, OutfitItem
from sqlalchemy.orm import joinedload
from datetime import date, datetime
from helpers import require_auth, item_to_dict

logger = logging.getLogger(__name__)

items_bp = Blueprint("items", __name__)


@items_bp.route("/items", methods=["GET"])
def get_items():
    user, err = require_auth()
    if err:
        return err
    items = (
        Item.query
        .filter_by(user_id=user.id, archived_at=None)
        .options(
            joinedload(Item.outfit_items).joinedload(OutfitItem.outfit)
        )
        .all()
    )
    return jsonify([item_to_dict(i) for i in items])


@items_bp.route("/items", methods=["POST"])
def create_item():
    user, err = require_auth()
    if err:
        return err
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    image_val = data.get("image", "")
    if image_val and image_val.startswith("data:image/"):
        try:
            mime_part, b64_part = image_val.split(",", 1)
            ext = ".jpg"
            if "png" in mime_part:
                ext = ".png"
            image_bytes = base64.b64decode(b64_part)
            filename = f"crop_{uuid.uuid4().hex}{ext}"
            save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
            with open(save_path, "wb") as f:
                f.write(image_bytes)
            image_val = f"/uploads/{filename}"
        except Exception as e:
            logger.error("Failed to decode base64 item image: %s", e)
            return jsonify({"error": "invalid image data"}), 400

    item = Item(
        name=data["name"],
        category=data.get("category", "Top"),
        color=data.get("color", ""),
        brand=data.get("brand", ""),
        cost=data.get("cost"),
        image_path=image_val,
        user_id=user.id,
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item_to_dict(item)), 201


@items_bp.route("/items/<int:item_id>", methods=["PUT"])
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

    if "postponedUntil" in data:
        if data["postponedUntil"]:
            try:
                item.postponed_until = date.fromisoformat(data["postponedUntil"])
            except ValueError:
                pass
        else:
            item.postponed_until = None

    if "image" in data:
        image_val = data["image"]
        if image_val and image_val.startswith("data:image/"):
            try:
                mime_part, b64_part = image_val.split(",", 1)
                ext = ".jpg"
                if "png" in mime_part:
                    ext = ".png"
                image_bytes = base64.b64decode(b64_part)
                filename = f"crop_{uuid.uuid4().hex}{ext}"
                save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
                with open(save_path, "wb") as f:
                    f.write(image_bytes)
                image_val = f"/uploads/{filename}"
            except Exception as e:
                logger.error("Failed to decode base64 item image: %s", e)
        item.image_path = image_val
    db.session.commit()
    return jsonify(item_to_dict(item))


@items_bp.route("/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    user, err = require_auth()
    if err:
        return err
    item = Item.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return jsonify({"error": "Not found"}), 404
    item.archived_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Archived"})
