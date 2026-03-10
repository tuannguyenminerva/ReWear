from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

#user model to store user information and their outfits and items
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), nullable=True)  # optional display name
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    password_hash = db.Column(db.String(255), nullable=False)

    outfits = db.relationship('Outfit', backref='user', lazy=True)
    items = db.relationship('Item', backref='user', lazy=True)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

#item model to store information about each clothing item
class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)

    category = db.Column(db.String(50))
    color = db.Column(db.String(50))        # user-defined color
    brand = db.Column(db.String(80))
    cost = db.Column(db.Float, nullable=True)
    image_path = db.Column(db.String(255), nullable=True)  # URL or uploaded path

    # ai-detected fields (filled by YOLO pipeline)
    ai_category = db.Column(db.String(80))
    ai_color_primary = db.Column(db.String(50))
    ai_confidence = db.Column(db.Float)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    archived_at = db.Column(db.DateTime, nullable=True)  # soft delete

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tags = db.relationship('ItemTag', backref='item', lazy=True)
    outfit_items = db.relationship('OutfitItem', backref='item', lazy=True)

#customizable labels per item
class ItemTag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tag = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

#outfit model to store information about each outfit
class Outfit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    worn_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    image_path = db.Column(db.String(255), nullable=True)
    ai_status = db.Column(db.String(20), default='pending')
    notes = db.Column(db.Text, nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    outfit_items = db.relationship('OutfitItem', backref='outfit', lazy=True)

#junction table for Outfit <-> Item (many-to-many)
class OutfitItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    outfit_id = db.Column(db.Integer, db.ForeignKey('outfit.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)

    bbox_x = db.Column(db.Float)
    bbox_y = db.Column(db.Float)
    bbox_w = db.Column(db.Float)
    bbox_h = db.Column(db.Float)
    user_action = db.Column(db.String(20), default='ai_accepted')

#reminder model for items not worn in 30+ days
class Reminder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    remind_at = db.Column(db.DateTime, nullable=False)
    snoozed_until = db.Column(db.DateTime, nullable=True)
    is_sent = db.Column(db.Boolean, default=False)
