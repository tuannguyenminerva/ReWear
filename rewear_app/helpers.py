import os
import uuid
from flask import jsonify, session
from .models import db, User
from werkzeug.utils import secure_filename

class StorageHandler:
    @staticmethod
    def save_file(file_data, upload_folder, is_base64=False, ext='.jpg'):
        """
        Save file data to the configured storage provider and return the accessible URL/Path.
        Supports both Werkzeug FileStorage objects and base64 bytes.

        Args:
            file_data:     Raw bytes (when is_base64=True) or a Werkzeug FileStorage object.
            upload_folder: Destination directory on the local filesystem.
            is_base64:     Set True when file_data contains raw decoded bytes.
            ext:           File extension to use when is_base64=True (e.g. '.png', '.webp').
                           Ignored for FileStorage uploads — extension is taken from the filename.
        """
        provider = os.environ.get('STORAGE_PROVIDER', 'LOCAL')

        # Determine filename/extension
        if is_base64:
            filename = f"crop_{uuid.uuid4().hex}{ext}"
        else:
            safe_name = secure_filename(file_data.filename) if file_data.filename else ''
            ext = os.path.splitext(safe_name)[1] if safe_name else '.jpg'
            filename = f"{uuid.uuid4().hex}{ext}"

        if provider == 'S3':
            # This is where Boto3 logic would be added to support cloud storage.
            # Example: s3.upload_fileobj(file_data, BUCKET, filename)
            # return f"https://{BUCKET}.s3.amazonaws.com/{filename}"
            raise NotImplementedError("S3 storage provider is not yet implemented. Please set STORAGE_PROVIDER=LOCAL.")

        # Default: LOCAL Filesystem Storage
        save_path = os.path.join(upload_folder, filename)
        
        if is_base64:
            with open(save_path, "wb") as f:
                f.write(file_data)
        else:
            file_data.save(save_path)
            
        return f"/uploads/{filename}"




def require_auth():
    """Return (user, None) or (None, error_response)."""
    user_id = session.get("user_id")
    if not user_id:
        return None, (jsonify({"error": "Not authenticated"}), 401)
    user = db.session.get(User, user_id)
    if not user:
        session.pop("user_id", None)
        return None, (jsonify({"error": "Not authenticated"}), 401)
    return user, None


def item_to_dict(item):
    """Serialize an Item with computed wear stats.

    Expects item.outfit_items to be already loaded (via joinedload) so that
    each outfit_item.outfit is also available without triggering extra queries.
    """
    wear_count = len(item.outfit_items)
    last_worn = None
    if item.outfit_items:
        dates = [
            oi.outfit.worn_date
            for oi in item.outfit_items
            if oi.outfit is not None
        ]
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
        "postponedUntil": item.postponed_until.isoformat() if item.postponed_until else None,
        "cost": item.cost,
        "isArchived": item.archived_at is not None
    }


def outfit_to_dict(outfit):
    return {
        "id": str(outfit.id),
        "date": outfit.worn_date.isoformat(),
        "items": [str(oi.item_id) for oi in outfit.outfit_items],
        "imagePath": outfit.image_path,
    }
