from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
from datetime import timedelta
import json

# Import configuration
from config.app_config import (
    logger,
    PERMANENT_SESSION_LIFETIME,
    SEND_FILE_MAX_AGE_DEFAULT,
    MAX_CONTENT_LENGTH,
    TEMPLATES_AUTO_RELOAD,
    UPLOAD_FOLDER,
    QUIZ_FOLDER,
    ACTIVITIES_FOLDER,
    MODULES_FOLDER,
)

# Import route blueprints
from routes.file_routes import file_routes
from routes.quiz_routes import quiz_routes
from routes.activity_routes import activity_routes
from routes.module_routes import module_routes
from routes.student_routes import student_bp
from routes.completion_routes import completion_routes
from routes.forum_routes import forum_routes
from routes.badge_routes import badge_routes

# Create Flask app
app = Flask(__name__, static_folder='static')

# Configure CORS with specific origins
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*",  # Allow all origins for API routes
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Disposition", "Content-Type"],
        },
        r"/files/*": {
            "origins": "*",
            "methods": ["GET", "POST"],
            "allow_headers": ["Content-Type", "Authorization", "Content-Disposition"]
        }
    },
)

# Configure Flask app settings
app.config["PERMANENT_SESSION_LIFETIME"] = PERMANENT_SESSION_LIFETIME
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = SEND_FILE_MAX_AGE_DEFAULT
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
app.config["TEMPLATES_AUTO_RELOAD"] = TEMPLATES_AUTO_RELOAD
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Allowed file extensions for icons
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# Register blueprints with URL prefixes
app.register_blueprint(file_routes, url_prefix="/api")
app.register_blueprint(quiz_routes, url_prefix="/api")
app.register_blueprint(activity_routes, url_prefix="/api")
app.register_blueprint(module_routes, url_prefix="/api")
app.register_blueprint(student_bp, url_prefix="/api")
app.register_blueprint(completion_routes, url_prefix="/api")
app.register_blueprint(forum_routes, url_prefix="/api")
app.register_blueprint(badge_routes, url_prefix="/api")

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(QUIZ_FOLDER, exist_ok=True)
os.makedirs(ACTIVITIES_FOLDER, exist_ok=True)
os.makedirs(MODULES_FOLDER, exist_ok=True)

# Additional CORS headers for file downloads
@app.after_request
def add_cors_headers(response):
    """Add CORS headers for file downloads"""
    # Add CORS headers for file downloads
    if request.path.startswith("/api/uploads/"):
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add(
            "Access-Control-Expose-Headers", "Content-Disposition, Content-Type"
        )
        response.headers.add(
            "Cache-Control", "no-store, no-cache, must-revalidate, max-age=0"
        )
        response.headers.add("Pragma", "no-cache")
        response.headers.add("Expires", "0")
    return response


# Route to serve static files
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)


# Route specifically for sound files
@app.route('/sounds/<filename>')
def serve_sound(filename):
    return send_from_directory('static/sounds', filename)


# Handle 404s
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404


@app.route("/uploads/icons/<filename>")
def serve_icon(filename):
    try:
        return send_from_directory(
            os.path.join(app.config["UPLOAD_FOLDER"], "icons"), filename
        )
    except Exception as e:
        logger.error(f"Error serving icon file: {str(e)}")
        return jsonify({"error": "Icon not found"}), 404


@app.route("/api/upload-icon", methods=["POST"])
def upload_icon():
    if "icon" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["icon"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_FILE_SIZE:
        return jsonify({"error": "File size exceeds 5MB limit"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Create a unique filename to prevent overwrites
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], "icons", unique_filename)

        # Ensure the icons directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        file.save(file_path)

        # Return the relative URL path
        return jsonify({"url": f"/uploads/icons/{unique_filename}"})

    return (
        jsonify(
            {"error": "Invalid file type. Allowed types: PNG, JPG, JPEG, GIF, SVG"}
        ),
        400,
    )


if __name__ == "__main__":
    logger.info("Starting server...")
    app.run(host="0.0.0.0", port=5001, debug=True)
