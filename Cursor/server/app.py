from flask import Flask, request, send_from_directory
from flask_cors import CORS
import os

# Import configuration
from config.app_config import (
    logger,
    PERMANENT_SESSION_LIFETIME,
    SEND_FILE_MAX_AGE_DEFAULT,
    MAX_CONTENT_LENGTH,
    TEMPLATES_AUTO_RELOAD,
    UPLOAD_FOLDER,
)

# Import route blueprints
from routes.file_routes import file_routes
from routes.quiz_routes import quiz_routes
from routes.activity_routes import activity_routes
from routes.module_routes import module_routes

# Create Flask app
app = Flask(__name__)

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
        }
    },
)

# Configure Flask app settings
app.config["PERMANENT_SESSION_LIFETIME"] = PERMANENT_SESSION_LIFETIME
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = SEND_FILE_MAX_AGE_DEFAULT
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
app.config["TEMPLATES_AUTO_RELOAD"] = TEMPLATES_AUTO_RELOAD
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Register blueprints with URL prefixes
app.register_blueprint(file_routes, url_prefix="/api")
app.register_blueprint(quiz_routes, url_prefix="/api")
app.register_blueprint(activity_routes, url_prefix="/api")
app.register_blueprint(module_routes, url_prefix="/api")


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


# This is a catch-all route for SPA, commented out for now
# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def catch_all(path):
#     # Special case for API routes
#     if path.startswith('api/'):
#         # Let Flask handle API routes
#         return "API endpoint not found", 404
#
#     # For all non-API routes, send the React app's index.html
#     return send_from_directory('../client/build', 'index.html')

if __name__ == "__main__":
    logger.info("Starting server...")
    app.run(host="0.0.0.0", port=5001, debug=True)
