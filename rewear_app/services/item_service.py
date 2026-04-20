import os
import base64
import logging
from flask import current_app
from .exceptions import ValidationError
from .base_service import BaseService
from ..models import Item, db
from ..helpers import StorageHandler

logger = logging.getLogger(__name__)

_MIME_TO_EXT = {
    "png": ".png",
    "jpg": ".jpg",
    "jpeg": ".jpg",
    "webp": ".webp",
    "gif": ".gif",
    "bmp": ".bmp",
    "tiff": ".tiff",
}

def _ext_from_mime(mime_part):
    try:
        subtype = mime_part.split("/")[1].split(";")[0].lower()
    except IndexError:
        return ".jpg"
    return _MIME_TO_EXT.get(subtype, ".jpg")

class ItemService(BaseService):
    @property
    def model(self):
        return Item

    def pre_process(self, data):
        processed = super().pre_process(data)
        if "cost" in data and data["cost"] is not None:
            try:
                processed["cost"] = float(data["cost"])
            except (ValueError, TypeError):
                pass
        
        # Default category
        if "category" not in processed:
            processed["category"] = "Top"
            
        return processed

    def validate(self, data):
        if not data.get("name"):
            raise ValidationError("name is required")
        if "cost" in data and data["cost"] is not None:
            if not isinstance(data["cost"], (int, float)):
                raise ValidationError("Invalid cost value")
            if data["cost"] < 0:
                raise ValidationError("Cost cannot be negative")

    def handle_files(self, data, files):
        # Handle Base64 image in JSON payload
        image_val = data.get("image", "")
        if image_val and image_val.startswith("data:image/"):
            try:
                # Remove raw 'image' from data to prevent model construction errors
                data.pop("image", None)
                
                mime_part, b64_part = image_val.split(",", 1)
                ext = _ext_from_mime(mime_part)
                image_bytes = base64.b64decode(b64_part)
                path = StorageHandler.save_file(
                    image_bytes, 
                    current_app.config["UPLOAD_FOLDER"], 
                    is_base64=True, 
                    ext=ext
                )
                return {"image_path": path}
            except Exception as e:
                logger.error("Failed to process item image: %s", e)
                raise ValueError("invalid image data")
        return {}
