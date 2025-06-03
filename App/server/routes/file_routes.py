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

        # Check if files are in request - either as file uploads or YouTube URLs
        has_files = 'files' in request.files
        has_youtube = request.form.get('youtubeUrls')
        
        if not has_files and not has_youtube:
            return jsonify({"error": "No files or YouTube URLs provided"}), 400

        combined_content = []
        file_info = []

        # Process YouTube URLs if present
        if has_youtube:
            youtube_urls = request.form.get('youtubeUrls').split(',')
            logger.info(f"Processing {len(youtube_urls)} YouTube URLs")
            
            for url in youtube_urls:
                if not url.strip():
                    continue
                    
                try:
                    # Extract video ID from URL
                    import re
                    video_id = None
                    patterns = [
                        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)',
                        r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)'
                    ]
                    
                    for pattern in patterns:
                        match = re.search(pattern, url)
                        if match:
                            video_id = match.group(1)
                            break
                    
                    if not video_id:
                        logger.error(f"Could not extract video ID from YouTube URL: {url}")
                        continue
                        
                    logger.info(f"Processing YouTube video: {video_id}")
                    
                    # Here you would integrate with YouTube API to get transcripts
                    # This is a simplified demonstration - you'll need to implement
                    # actual transcript fetching from YouTube API
                    
                    # Attempt to get transcript (mock implementation)
                    try:
                        # Example implementation - this should be replaced with actual API calls
                        from youtube_transcript_api import YouTubeTranscriptApi
                        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
                        
                        # Format the transcript
                        transcript_text = f"YouTube Video Transcript (ID: {video_id}):\n\n"
                        for item in transcript_list:
                            transcript_text += f"{item['text']} "
                            
                        # Add to combined content
                        combined_content.append(transcript_text)
                        
                        # Add to file info
                        file_info.append({
                            "filename": f"youtube_{video_id}.txt",
                            "type": "youtube",
                            "videoId": video_id,
                            "url": url,
                            "content": transcript_text[:200] + "..." if len(transcript_text) > 200 else transcript_text
                        })
                        
                        logger.info(f"Successfully processed YouTube transcript for video {video_id}")
                        
                    except Exception as e:
                        logger.error(f"Error fetching YouTube transcript: {str(e)}")
                        # Fallback message when transcript can't be fetched
                        fallback_text = f"[YouTube video content from: {url}] - Transcript unavailable. The quiz generator will consider the video title and description only."
                        combined_content.append(fallback_text)
                        
                        file_info.append({
                            "filename": f"youtube_{video_id}.txt",
                            "type": "youtube",
                            "videoId": video_id,
                            "url": url,
                            "content": fallback_text,
                            "error": str(e)
                        })
                        
                except Exception as youtube_error:
                    logger.error(f"Error processing YouTube URL {url}: {str(youtube_error)}")
                    
        # Process file uploads if present
        if has_files:
            files = request.files.getlist("files")
            if not files or all(file.filename == "" for file in files):
                if not has_youtube:  # Only return error if no YouTube URLs were processed
                    return jsonify({"error": "No files selected"}), 400
            else:
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
                        elif file_extension in ["mp3", "wav", "ogg", "m4a"]:
                            # This is an audio file, handle it similar to video (transcribe)
                            logger.info(f"Starting audio transcription for: {filename}")
                            content = transcribe_video(file_path)  # reuse the same function for audio
                            logger.info(
                                f"Transcribed {len(content)} characters from audio: {filename}"
                            )
                            
                            # Check if transcription failed
                            if content.startswith("[VIDEO TRANSCRIPTION ERROR]") or content.startswith("[AUDIO TRANSCRIPTION ERROR]"):
                                return (
                                    jsonify(
                                        {
                                            "error": "Audio transcription failed",
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

                        combined_content.append(content)
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

        # Join all content
        all_content = "\n\n".join(combined_content)
        
        return (
            jsonify({
                "message": "Files and YouTube URLs processed successfully", 
                "files": file_info,
                "combinedContent": all_content
            }),
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
            elif ext.lower() in [".ppt", ".pptx"]:
                file_type = "powerpoint"
            elif ext.lower() in [".xls", ".xlsx"]:
                file_type = "excel"
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
        elif ext.lower() in [".ppt", ".pptx"]:
            mimetype = (
                "application/vnd.ms-powerpoint"
                if ext.lower() == ".ppt"
                else "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
            return send_from_directory(
                UPLOAD_FOLDER,
                filename,
                mimetype=mimetype,
                as_attachment=True,
                download_name=filename,
            )
        elif ext.lower() in [".xls", ".xlsx"]:
            mimetype = (
                "application/vnd.ms-excel"
                if ext.lower() == ".xls"
                else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
        # Check if requests library is available
        try:
            import requests
            from bs4 import BeautifulSoup
        except ImportError as e:
            logger.error(f"Missing required library: {str(e)}")
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Server missing required library: {str(e)}. Please install with pip install requests beautifulsoup4",
                    }
                ),
                500,
            )

        # Get URL from request
        data = request.json
        if not data:
            logger.error("No JSON data in request")
            return jsonify({"success": False, "message": "No data provided"}), 400

        url = data.get("url", "")
        logger.info(f"Received URL fetch request for: {url}")

        if not url:
            return jsonify({"success": False, "message": "No URL provided"}), 400

        # Basic URL validation
        if not (url.startswith("http://") or url.startswith("https://")):
            url = "https://" + url
            logger.info(f"Added https:// prefix to URL: {url}")

        # Add user agent to avoid being blocked
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        # Fetch the webpage content
        try:
            logger.info(f"Sending GET request to: {url}")
            response = requests.get(url, headers=headers, timeout=15)

            # Log response details
            logger.info(f"Response status code: {response.status_code}")
            logger.info(f"Response encoding: {response.encoding}")
            logger.info(
                f"Response content type: {response.headers.get('Content-Type', 'unknown')}"
            )

            # Raise an HTTP error if the status isn't successful
            response.raise_for_status()

            # Parse HTML content
            soup = BeautifulSoup(response.text, "html.parser")

            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.extract()

            # Extract text
            text = soup.get_text()

            # Clean up text: break into lines and remove leading/trailing spaces
            lines = (line.strip() for line in text.splitlines())
            # Break multi-headlines into a line each
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            # Remove blank lines
            text = "\n".join(chunk for chunk in chunks if chunk)

            # Limit content size
            max_chars = 100000  # 100K characters should be plenty
            if len(text) > max_chars:
                logger.warning(
                    f"Truncating large content from {len(text)} to {max_chars} characters"
                )
                text = text[:max_chars] + "\n[Content truncated due to size]"

            # Get meta title and description if available
            title = soup.title.string if soup.title else "Unknown Title"

            meta_desc = soup.find("meta", attrs={"name": "description"})
            description = meta_desc.get("content", "") if meta_desc else ""

            # Create content with metadata
            formatted_content = f"Title: {title}\nURL: {url}\n\n{text}"

            logger.info(f"Successfully extracted {len(text)} characters from {url}")

            # Return the content
            return jsonify(
                {
                    "success": True,
                    "content": formatted_content,
                    "url": url,
                    "title": title,
                    "description": description,
                    "contentLength": len(text),
                }
            )

        except requests.exceptions.RequestException as e:
            error_msg = f"Failed to fetch URL: {str(e)}"
            logger.error(error_msg)

            # Provide more specific error messages for common issues
            if isinstance(e, requests.exceptions.ConnectionError):
                error_msg = f"Could not connect to the website '{url}'. Please check the URL and try again."
            elif isinstance(e, requests.exceptions.Timeout):
                error_msg = f"The request to '{url}' timed out. The website may be slow or unavailable."
            elif isinstance(e, requests.exceptions.TooManyRedirects):
                error_msg = f"Too many redirects for '{url}'. The URL may be incorrect."
            elif isinstance(e, requests.exceptions.HTTPError):
                status_code = (
                    e.response.status_code if hasattr(e, "response") else "unknown"
                )
                error_msg = f"HTTP Error {status_code} when accessing '{url}'. The page may not exist or you may not have permission to access it."

            return jsonify({"success": False, "message": error_msg}), 500

    except Exception as e:
        error_msg = f"Unexpected error fetching URL: {str(e)}"
        logger.error(error_msg, exc_info=True)  # Log the full stack trace
        return jsonify({"success": False, "message": error_msg}), 500


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
