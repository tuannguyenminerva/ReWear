from flask import Blueprint, request, jsonify, current_app
from ..models import db, Item, Outfit, OutfitItem
from datetime import date
from ..auth_guard import require_auth
import logging
from ..serializers import outfit_to_dict
from ..helpers import StorageHandler

logger = logging.getLogger(__name__)

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

    from ..services.outfit_service import OutfitService
    from ..services.exceptions import ServiceError
    service = OutfitService()
    
    # Extract data and files based on content type
    if request.content_type and "multipart" in request.content_type:
        data = request.form.to_dict()
        data["item_ids"] = request.form.getlist("item_ids")
        files = request.files
    else:
        data = request.get_json() or {}
        files = None

    try:
        outfit = service.create(user_id=user.id, data=data, files=files)
        return jsonify(outfit_to_dict(outfit)), 201
    except ServiceError as e:
        return jsonify({"error": str(e)}), e.code
    except Exception as e:
        logger.error("Failed to create outfit: %s", e)
        return jsonify({"error": "Internal server error"}), 500
