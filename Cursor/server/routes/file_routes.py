from flask import Blueprint, request, jsonify, send_from_directory
import os
from werkzeug.utils import secure_filename

from config.app_config import UPLOAD_FOLDER, allowed_file, logger
from services.text_extraction import extract_text_from_pdf, extract_text_from_file
from services.transcription import transcribe_video
from utils.file_helpers import save_file

# Create blueprint for file-related routes
file_routes = Blueprint("file_routes", __name__)


@file_routes.route("/upload-files", methods=["POST"])
def upload_files():
    """
    Handle uploading of multiple files
    """
    try:
        logger.info("Received upload request for 1 or more files")

        # Check if 'files' key is present in the request
        if "files" not in request.files:
            return jsonify({"error": "No files provided"}), 400

        files = request.files.getlist("files")

        # Check if any files were actually selected
        if not files or all(file.filename == "" for file in files):
            return jsonify({"error": "No files selected"}), 400

        file_info = []

        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                logger.info(f"Saving file to: {file_path}")
                file.save(file_path)

                # Process file based on its type
                file_extension = (
                    filename.rsplit(".", 1)[1].lower() if "." in filename else ""
                )
                content = ""

                if file_extension in ["mp4", "mov", "avi", "webm"]:
                    # This is a video file, transcribe it
                    logger.info(f"Starting video transcription for: {filename}")
                    content = transcribe_video(file_path)
                    logger.info(
                        f"Transcribed {len(content)} characters from video: {filename}"
                    )

                    # Check if transcription failed and contains an error message
                    if content.startswith("[VIDEO TRANSCRIPTION ERROR]"):
                        return (
                            jsonify(
                                {
                                    "error": "Video transcription failed",
                                    "message": content,
                                    "filename": filename,
                                }
                            ),
                            400,
                        )
                elif file_extension == "pdf":
                    # Process PDF
                    content = extract_text_from_pdf(file_path)
                elif file_extension in ["doc", "docx"]:
                    # For simplicity, assuming .doc/.docx files are handled elsewhere or by a library
                    content = "Document content (processing not shown in this example)"
                else:
                    # For text files, read directly
                    try:
                        content = extract_text_from_file(file_path)
                    except:
                        content = f"Failed to extract content from {filename}"

                file_info.append(
                    {
                        "filename": filename,
                        "path": file_path,
                        "content": (
                            content[:200] + "..." if len(content) > 200 else content
                        ),
                    }
                )
            else:
                return (
                    jsonify(
                        {
                            "error": f"File type not allowed. Allowed types: {', '.join(allowed_file.__defaults__[0])}"
                        }
                    ),
                    400,
                )

        return (
            jsonify({"message": "Files uploaded successfully", "files": file_info}),
            200,
        )

    except Exception as e:
        logger.error(f"Error in upload_files: {str(e)}")
        return jsonify({"error": str(e)}), 500


@file_routes.route("/upload", methods=["POST"])
def upload_file():
    """
    Handle uploading of a single file
    """
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        try:
            # Use helper function to save file
            file_path, unique_filename = save_file(file)

            # Determine file type based on extension
            _, ext = os.path.splitext(unique_filename)
            file_type = "file"
            if ext.lower() == ".pdf":
                file_type = "pdf"
            elif ext.lower() in [".doc", ".docx"]:
                file_type = "word"
            elif ext.lower() in [".jpg", ".jpeg", ".png"]:
                file_type = "image"
            elif ext.lower() in [".mp4", ".mov", ".avi", ".webm"]:
                file_type = "video"

            # Return various URLs to access the file
            return jsonify(
                {
                    "url": f"/api/uploads/{unique_filename}",
                    "directUrl": f"/direct-file/{unique_filename}",
                    "serverUrl": f"http://localhost:5001/api/uploads/{unique_filename}",
                    "filename": unique_filename,
                    "type": file_type,
                    "success": True,
                }
            )
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            return jsonify({"error": str(e)}), 500

    return jsonify({"error": "File type not allowed"}), 400


@file_routes.route("/uploads/<path:filename>")
def uploaded_file(filename):
    """
    Serve an uploaded file
    """
    # Log the request for debugging
    logger.info(f"Request for file: {filename}")
    logger.info(f"File path: {os.path.join(UPLOAD_FOLDER, filename)}")

    # Check if file exists
    if not os.path.exists(os.path.join(UPLOAD_FOLDER, filename)):
        logger.error(f"File not found: {filename}")
        return jsonify({"error": "File not found"}), 404

    # Get the file extension
    _, ext = os.path.splitext(filename)

    try:
        # Set appropriate content type based on file extension
        if ext.lower() == ".pdf":
            return send_from_directory(
                UPLOAD_FOLDER,
                filename,
                mimetype="application/pdf",
                as_attachment=False,
                download_name=filename,
            )
        elif ext.lower() in [".doc", ".docx"]:
            mimetype = (
                "application/msword"
                if ext.lower() == ".doc"
                else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
            return send_from_directory(
                UPLOAD_FOLDER,
                filename,
                mimetype=mimetype,
                as_attachment=True,
                download_name=filename,
            )
        elif ext.lower() in [".jpg", ".jpeg"]:
            return send_from_directory(
                UPLOAD_FOLDER, filename, mimetype="image/jpeg", as_attachment=False
            )
        elif ext.lower() == ".png":
            return send_from_directory(
                UPLOAD_FOLDER, filename, mimetype="image/png", as_attachment=False
            )

        # For other files, use standard handling
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        logger.error(f"Error serving file {filename}: {str(e)}")
        return jsonify({"error": str(e)}), 500


@file_routes.route("/direct-file/<path:filename>")
def direct_file_access(filename):
    """
    Provides direct file access without any routing interference
    """
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(filepath):
            logger.error(f"Direct file not found: {filename}")
            return "File not found", 404

        # Let the OS determine the correct MIME type
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)
    except Exception as e:
        logger.error(f"Error serving direct file {filename}: {str(e)}")
        return str(e), 500


@file_routes.route("/fetch-url", methods=["POST"])
def fetch_url_content():
    """
    Fetch content from a URL
    """
    try:
        import requests

        data = request.json
        url = data.get("url", "")

        if not url:
            return jsonify({"success": False, "message": "No URL provided"}), 400

        # Basic URL validation
        if not (url.startswith("http://") or url.startswith("https://")):
            url = "https://" + url

        # Fetch the webpage content (simplified - in production use a more robust solution)
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()

            # Return just the text content
            return jsonify(
                {
                    "success": True,
                    "content": response.text[:5000],  # Limit size for demo
                    "url": url,
                }
            )

        except requests.exceptions.RequestException as e:
            return (
                jsonify(
                    {"success": False, "message": f"Failed to fetch URL: {str(e)}"}
                ),
                500,
            )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# Add a debugging endpoint to list the uploads directory
@file_routes.route("/debug/uploads", methods=["GET"])
def list_uploads():
    """
    List files in the uploads directory (for debugging)
    """
    try:
        if not os.path.exists(UPLOAD_FOLDER):
            return jsonify({"error": "Uploads folder does not exist"}), 404

        files = os.listdir(UPLOAD_FOLDER)
        file_details = []

        for file in files:
            file_path = os.path.join(UPLOAD_FOLDER, file)
            if os.path.isfile(file_path):
                file_details.append(
                    {
                        "name": file,
                        "size": os.path.getsize(file_path),
                        "created": os.path.getctime(file_path),
                        "modified": os.path.getmtime(file_path),
                        "path": file_path,
                        "url": f"/api/uploads/{file}",
                    }
                )

        return jsonify(
            {
                "upload_folder": UPLOAD_FOLDER,
                "files": file_details,
                "count": len(file_details),
            }
        )
    except Exception as e:
        logger.error(f"Error listing uploads: {str(e)}")
        return jsonify({"error": str(e)}), 500
