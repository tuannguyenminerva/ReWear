import base64
import logging
import os
import uuid

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.orm import joinedload
from datetime import date, datetime
from ..auth_guard import require_auth
from ..serializers import item_to_dict
from ..helpers import StorageHandler
from ..models import db, Item, OutfitItem

logger = logging.getLogger(__name__)

# Maps MIME sub-types (from data-URL headers) to file extensions.
# Covers the formats a browser or desktop OS is likely to produce.
_MIME_TO_EXT: dict[str, str] = {
    "jpeg": ".jpg",
    "jpg":  ".jpg",
    "png":  ".png",
    "webp": ".webp",
    "gif":  ".gif",
    "bmp":  ".bmp",
    "tiff": ".tiff",
}


def _ext_from_mime(mime_part: str) -> str:
    """Return the file extension for a data-URL MIME header.

    Example input:  'data:image/png;base64'
    Example output: '.png'
    Falls back to '.jpg' for unknown types.
    """
    # mime_part looks like 'data:image/png;base64'
    try:
        subtype = mime_part.split("/")[1].split(";")[0].lower()
    except IndexError:
        return ".jpg"
    return _MIME_TO_EXT.get(subtype, ".jpg")


items_bp = Blueprint("items", __name__)


@items_bp.route("/items", methods=["GET"])
def get_items():
    user, err = require_auth()
    if err:
        return err
    items = db.session.execute(
        db.select(Item)
        .where(Item.user_id == user.id, Item.archived_at.is_(None))
        .options(joinedload(Item.outfit_items).joinedload(OutfitItem.outfit))
    ).unique().scalars().all()
    return jsonify([item_to_dict(i) for i in items])


@items_bp.route("/items", methods=["POST"])
def create_item():
    user, err = require_auth()
    if err:
        return err
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    if "cost" in data and data["cost"] is not None:
        try:
            cost = float(data["cost"])
            if cost < 0:
                return jsonify({"error": "Cost cannot be negative"}), 400
        except ValueError:
            return jsonify({"error": "Invalid cost value"}), 400

    image_val = data.get("image", "")
    if image_val and image_val.startswith("data:image/"):
        try:
            mime_part, b64_part = image_val.split(",", 1)
            ext = _ext_from_mime(mime_part)
            image_bytes = base64.b64decode(b64_part)
            image_val = StorageHandler.save_file(
                image_bytes, current_app.config["UPLOAD_FOLDER"], is_base64=True, ext=ext
            )
        except Exception as e:
            logger.error("Failed to process item image: %s", e)
            return jsonify({"error": "invalid image data"}), 400

    item = Item(
        name=data["name"],
        category=data.get("category", "Top"),
        color=data.get("color", ""),
        brand=data.get("brand", ""),
        cost=cost if "cost" in data and data["cost"] is not None else data.get("cost"),
        image_path=image_val,
        user_id=user.id,
    )
    try:
        db.session.add(item)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error("Failed to create item: %s", e)
        return jsonify({"error": "Database error"}), 500
    return jsonify(item_to_dict(item)), 201


@items_bp.route("/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    user, err = require_auth()
    if err:
        return err
    item = db.session.get(Item, item_id)
    if not item or item.archived_at is not None:
        return jsonify({"error": "Item not found or already archived"}), 404
    if item.user_id != user.id:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    
    # Validate cost if provided
    if "cost" in data and data["cost"] is not None:
        try:
            cost = float(data["cost"])
            if cost < 0:
                return jsonify({"error": "Cost cannot be negative"}), 400
        except ValueError:
            return jsonify({"error": "Invalid cost value"}), 400
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
                ext = _ext_from_mime(mime_part)
                image_bytes = base64.b64decode(b64_part)
                image_val = StorageHandler.save_file(
                    image_bytes, current_app.config["UPLOAD_FOLDER"], is_base64=True, ext=ext
                )
            except Exception as e:
                logger.error("Failed to process item image: %s", e)
        item.image_path = image_val
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error("Failed to update item: %s", e)
        return jsonify({"error": "Database error"}), 500
    return jsonify(item_to_dict(item))


@items_bp.route("/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    user, err = require_auth()
    if err:
        return err
    item = db.session.get(Item, item_id)
    if not item or item.archived_at is not None:
        return jsonify({"error": "Item not found or already archived"}), 404
    if item.user_id != user.id:
        return jsonify({"error": "Forbidden"}), 403
    item.archived_at = datetime.utcnow()
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error("Failed to delete item: %s", e)
        return jsonify({"error": "Database error"}), 500
    return jsonify({"message": "Archived"})
