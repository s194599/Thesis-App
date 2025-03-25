from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    try:
        # Extract form data
        topic = request.form.get("topic", "")
        text = request.form.get("text", "")
        webpage = request.form.get("webpage", "")
        question_type = request.form.get("questionType", "multiple-choice")
        student_level = request.form.get("studentLevel", "")
        additional_instructions = request.form.get("additionalInstructions", "")
        output_language = request.form.get("outputLanguage", "danish")

        # Handle document upload if present
        document = request.files.get("document")
        if document:
            filename = os.path.join(UPLOAD_FOLDER, document.filename)
            document.save(filename)

        # TODO: Implement actual quiz generation logic with Ollama
        # For now, return a mock response
        mock_quiz = {
            "success": True,
            "message": "Quiz generated successfully",
            "quiz": {
                "topic": topic
                or text
                or webpage
                or (document.filename if document else ""),
                "questions": [
                    {
                        "question": "This is a sample question?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "Option A",
                    }
                ],
            },
        }

        return jsonify(mock_quiz)

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
