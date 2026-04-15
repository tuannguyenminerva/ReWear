import logging
print("Importing os...")
import os
print("Importing flask...")
from flask import Flask
print("Importing flask_cors...")
from flask_cors import CORS
print("Importing models...")
from models import db
print("Importing routes...")
from routes import auth_bp, items_bp, outfits_bp, detection_bp
print("All imports successful!")
