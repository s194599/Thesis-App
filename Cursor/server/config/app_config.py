import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app configuration
PERMANENT_SESSION_LIFETIME = 300  # 5 minutes
SEND_FILE_MAX_AGE_DEFAULT = 0  # Disable file caching
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size
TEMPLATES_AUTO_RELOAD = False  # Disable template auto-reload

# Paths configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
QUIZ_FOLDER = os.path.join(BASE_DIR, "quizzes")
ACTIVITIES_FOLDER = os.path.join(BASE_DIR, "activities")
MODULES_FOLDER = os.path.join(BASE_DIR, "modules")

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(QUIZ_FOLDER, exist_ok=True)
os.makedirs(ACTIVITIES_FOLDER, exist_ok=True)
os.makedirs(MODULES_FOLDER, exist_ok=True)

# File handling configuration
ALLOWED_EXTENSIONS = {
    "pdf",
    "doc",
    "docx",
    "txt",
    "mp4",
    "mov",
    "avi",
    "webm",
    "png",
    "jpeg",
    "jpg",
}

# API configuration
OLLAMA_API = "http://localhost:11434/api/generate"


def allowed_file(filename):
    """Check if a file has an allowed extension"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
