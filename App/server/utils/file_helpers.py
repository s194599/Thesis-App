import os
import time
import json
from werkzeug.utils import secure_filename
from config.app_config import UPLOAD_FOLDER, DATABASE_FOLDER, DATABASE_FOLDER, logger


def generate_unique_filename(filename):
    """
    Generate a unique filename by adding a timestamp

    Args:
        filename (str): Original filename

    Returns:
        str: Unique filename with timestamp
    """
    base_name, ext = os.path.splitext(filename)
    timestamp = int(time.time())
    return f"{base_name}_{timestamp}{ext}"


def save_file(file, folder=UPLOAD_FOLDER):
    """
    Save an uploaded file to the specified folder

    Args:
        file: File object from request.files
        folder (str): Target folder to save the file

    Returns:
        tuple: (path, filename) of the saved file
    """
    try:
        filename = secure_filename(file.filename)
        unique_filename = generate_unique_filename(filename)
        file_path = os.path.join(folder, unique_filename)

        file.save(file_path)
        logger.info(f"File saved successfully: {file_path}")

        return file_path, unique_filename
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        raise


def load_json_file(filepath, default_value=None):
    """
    Load data from a JSON file

    Args:
        filepath (str): Path to the JSON file
        default_value: Value to return if file doesn't exist or is invalid

    Returns:
        object: Parsed JSON data or default value
    """
    if not os.path.exists(filepath):
        return default_value if default_value is not None else []

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        logger.error(f"Error reading JSON file: {filepath}")
        return default_value if default_value is not None else []
    except UnicodeDecodeError:
        logger.error(f"Character encoding error in file: {filepath}")
        return default_value if default_value is not None else []


def save_json_file(filepath, data, indent=2):
    """
    Save data to a JSON file

    Args:
        filepath (str): Path to the JSON file
        data: Data to save
        indent (int): JSON indentation level

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        directory = os.path.dirname(filepath)
        if not os.path.exists(directory):
            os.makedirs(directory)

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=indent, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Error saving JSON file {filepath}: {str(e)}")
        return False
