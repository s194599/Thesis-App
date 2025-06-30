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
DATABASE_FOLDER = os.path.join(BASE_DIR, "database")
QUIZ_FOLDER = os.path.join(DATABASE_FOLDER, "quizzes")
ACTIVITIES_FOLDER = os.path.join(DATABASE_FOLDER, "activities")
MODULES_FOLDER = os.path.join(DATABASE_FOLDER, "modules")


# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATABASE_FOLDER, exist_ok=True)
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
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "mp3",
    "wav",
    "ogg",
    "m4a",
}

# API configuration
OLLAMA_API = "http://localhost:11434/api/generate"

# LLM Model Configuration
AVAILABLE_MODELS = {
    "llama3.1:8b": {
        "name": "Llama 3.1 8B",
        "description": "Meta's Llama 3.1 8B parameter model - good balance of speed and quality",
        "supports_instruct": True,
        "default": True
    },
    "llama3.1:8b-instruct-q4_0": {
        "name": "Llama 3.1 8B Instruct Q4",
        "description": "Quantized instruction-tuned version for faster inference",
        "supports_instruct": True,
        "default": False
    },
    "mistral:latest": {
        "name": "Mistral 7B",
        "description": "Mistral's 7B parameter model - fast and efficient",
        "supports_instruct": True,
        "default": False
    },
    "qwen2.5:7b": {
        "name": "Qwen 2.5 7B",
        "description": "Alibaba's Qwen 2.5 model - good for reasoning tasks",
        "supports_instruct": True,
        "default": False
    },
    "llama3.2:latest": {
        "name": "Llama 3.2",
        "description": "Latest Llama 3.2 model",
        "supports_instruct": True,
        "default": False
    }
}

# Get default model
DEFAULT_MODEL = next((model_id for model_id, config in AVAILABLE_MODELS.items() if config.get("default")), "llama3.1:8b")

# Environment variable override for model selection
QUIZ_MODEL = os.getenv("QUIZ_MODEL", DEFAULT_MODEL)


def allowed_file(filename):
    """Check if a file has an allowed extension"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
