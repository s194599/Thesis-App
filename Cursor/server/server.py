from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import requests
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# Updated endpoint to match the frontend API call
@app.route("/api/generate-quiz", methods=["POST"])
def generate_quiz():
    try:
        # Check if the request is JSON or form data
        if request.is_json:
            # Handle JSON request from the frontend
            data = request.json
            input_type = data.get("inputType", "topic")
            content = data.get("content", "")
            question_type = data.get("questionType", "multipleChoice")
            student_level = data.get("studentLevel", "highSchool")
            additional_instructions = data.get("additionalInstructions", "")
            language = data.get("language", "danish")
        else:
            # For backward compatibility with form data
            input_type = request.form.get("inputType", "topic")
            content = request.form.get("content", "")
            question_type = request.form.get("questionType", "multipleChoice")
            student_level = request.form.get("studentLevel", "highSchool")
            additional_instructions = request.form.get("additionalInstructions", "")
            language = request.form.get("language", "danish")

            # Handle document upload if present
            document = request.files.get("document")
            if document:
                filename = secure_filename(document.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                document.save(filepath)
                # Here you would process the document to extract content
                content = f"Content from uploaded file: {filename}"

        # TODO: Implement actual quiz generation logic with Ollama
        # For now, return a sample quiz in the format expected by the frontend
        sample_quiz = {
            "id": "quiz123",
            "title": "Sample Quiz",
            "description": f"A quiz about {content}",
            "questions": [
                {
                    "id": "q1",
                    "question": "What is the capital of Denmark?",
                    "options": ["Copenhagen", "Oslo", "Stockholm", "Helsinki"],
                    "correctAnswer": "Copenhagen",
                    "explanation": "Copenhagen is the capital city of Denmark.",
                },
                {
                    "id": "q2",
                    "question": "Which of these is NOT a Danish invention?",
                    "options": ["Lego", "Insulin", "WiFi", "Bluetooth"],
                    "correctAnswer": "WiFi",
                    "explanation": "WiFi was not invented in Denmark. Lego, insulin treatment, and Bluetooth were all Danish innovations.",
                },
                {
                    "id": "q3",
                    "question": "What color is the Danish flag?",
                    "options": [
                        "Red and white",
                        "Blue and yellow",
                        "Red, white, and blue",
                        "Green and white",
                    ],
                    "correctAnswer": "Red and white",
                    "explanation": "The Danish flag (Dannebrog) is red with a white Scandinavian cross.",
                },
            ],
        }

        return jsonify(sample_quiz)

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# Add endpoint for fetching URL content
@app.route("/api/fetch-url", methods=["POST"])
def fetch_url_content():
    try:
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


# Add endpoint for uploading files
@app.route("/api/upload-file", methods=["POST"])
def upload_file():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "No file part"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"success": False, "message": "No file selected"}), 400

        if file:
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            # Here you would process the file to extract content
            # For simplicity, we'll just return a success message
            return jsonify(
                {
                    "success": True,
                    "message": "File uploaded successfully",
                    "filename": filename,
                    "content": f"Content extracted from {filename}",
                }
            )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
