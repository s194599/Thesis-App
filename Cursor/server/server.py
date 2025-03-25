from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import requests
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF for PDF processing

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# Function to extract text from PDF
def extract_text_from_pdf(pdf_path, max_pages=10):
    doc = fitz.open(pdf_path)
    text = ""

    for page_num in range(min(len(doc), max_pages)):  # Limit to 10 pages
        text += doc[page_num].get_text("text") + "\n"

    return text.strip()


# Function to generate quiz using Ollama's Mistral model
def generate_quiz_with_ollama(
    content,
    num_questions=5,
    model="mistral",
    question_type="multipleChoice",
    additional_instructions="",
):
    OLLAMA_API = "http://localhost:11434/api/generate"

    # Limit content length for token constraints
    if len(content) > 128000:
        print("Warning: Content is too long. Using only the first 128,000 characters.")
        content = content[:128000]

    # Adjust prompt based on question type
    if question_type == "multipleChoice":
        format_instructions = f"""
        Generate a multiple-choice quiz based on this content:
        {content}

        The quiz should have {num_questions} questions and follow this format:

        [Question 1]
        A) [Option 1]
        B) [Option 2]
        C) [Option 3]
        D) [Option 4]
        Correct answer: [A, B, C, or D]
        Explanation: [Brief explanation of the correct answer]

        [Question 2]
        ...and so on.
        """
    elif question_type == "trueFalse":
        format_instructions = f"""
        Generate a true/false quiz based on this content:
        {content}

        The quiz should have {num_questions} questions and follow this format:

        [Question 1]
        A) True
        B) False
        Correct answer: [A or B]
        Explanation: [Brief explanation of the correct answer]

        [Question 2]
        ...and so on.
        """
    else:  # Short answer
        format_instructions = f"""
        Generate a short answer quiz based on this content:
        {content}

        The quiz should have {num_questions} questions and follow this format:

        [Question 1]
        Correct answer: [Brief answer]
        Explanation: [Brief explanation of the correct answer]

        [Question 2]
        ...and so on.
        """

    # Add any additional instructions from the user
    if additional_instructions:
        format_instructions += f"\n\nAdditional instructions: {additional_instructions}"

    # Prepare payload for Ollama API
    payload = {"model": model, "prompt": format_instructions, "stream": False}

    try:
        response = requests.post(OLLAMA_API, json=payload)

        if response.status_code == 200:
            raw_quiz = response.json().get("response", "No response received.")
            return raw_quiz
        else:
            print(f"Error from Ollama API: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Exception when calling Ollama API: {e}")
        return None


# Function to parse raw quiz text into structured format
def parse_quiz(raw_quiz, question_type="multipleChoice"):
    questions = []

    if question_type == "multipleChoice":
        # Split by question
        raw_questions = raw_quiz.split("[Question")

        # Process each question
        for i, q in enumerate(raw_questions):
            if i == 0 and not q.strip():  # Skip empty first part
                continue

            q = q.strip()
            if not q:
                continue

            # Initialize question object
            question = {
                "id": f"q{i}",
                "question": "",
                "options": [],
                "correctAnswer": "",
                "explanation": "",
            }

            # Extract question text
            question_parts = q.split("\n", 1)
            if len(question_parts) > 1:
                question_text = question_parts[0].replace("]", "").strip()
                # If the question is numbered at the beginning, clean it up
                if question_text.startswith(str(i)):
                    question_text = question_text[1:].strip()
                question["question"] = question_text

                # Process options and answer
                options_text = question_parts[1]

                # Extract options
                options = []
                for line in options_text.split("\n"):
                    line = line.strip()
                    if (
                        line.startswith("A)")
                        or line.startswith("B)")
                        or line.startswith("C)")
                        or line.startswith("D)")
                    ):
                        option_letter = line[0]
                        option_text = line[2:].strip()
                        options.append(option_text)

                # Add options to question
                question["options"] = options

                # Extract correct answer
                for line in options_text.split("\n"):
                    if "Correct answer:" in line:
                        answer_letter = line.split("Correct answer:")[1].strip()
                        # Convert letter to option text
                        if answer_letter == "A":
                            question["correctAnswer"] = (
                                options[0] if len(options) > 0 else ""
                            )
                        elif answer_letter == "B":
                            question["correctAnswer"] = (
                                options[1] if len(options) > 1 else ""
                            )
                        elif answer_letter == "C":
                            question["correctAnswer"] = (
                                options[2] if len(options) > 2 else ""
                            )
                        elif answer_letter == "D":
                            question["correctAnswer"] = (
                                options[3] if len(options) > 3 else ""
                            )

                # Extract explanation
                for line in options_text.split("\n"):
                    if "Explanation:" in line:
                        question["explanation"] = line.split("Explanation:")[1].strip()

                questions.append(question)

    # Create a quiz object
    quiz = {
        "id": f"quiz_{len(questions)}",
        "title": "Generated Quiz",
        "description": "Quiz generated from your content",
        "questions": questions,
    }

    return quiz


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
            if document and input_type == "document":
                filename = secure_filename(document.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                document.save(filepath)

                # Process PDF to extract content if it's a PDF
                if filename.lower().endswith(".pdf"):
                    content = extract_text_from_pdf(filepath)
                    print(f"Extracted {len(content)} characters from PDF.")
                else:
                    # For non-PDF files, just use the filename as a placeholder
                    # In a production app, you would add support for other file types
                    content = f"Content from uploaded file: {filename}"

        # If content is available, generate quiz with Ollama
        if content:
            # Add instructions about language if specified
            lang_instruction = ""
            if language == "danish":
                lang_instruction = "Generate the quiz in Danish language."
            elif language == "english":
                lang_instruction = "Generate the quiz in English language."

            # Combine all instructions
            combined_instructions = f"{additional_instructions} {lang_instruction}"

            # Generate quiz using Ollama
            raw_quiz = generate_quiz_with_ollama(
                content,
                num_questions=5,  # Adjust as needed
                model="mistral",
                question_type=question_type,
                additional_instructions=combined_instructions,
            )

            if raw_quiz:
                # Parse the raw quiz text into structured format
                quiz = parse_quiz(raw_quiz, question_type)
                return jsonify(quiz)

        # Fallback to sample quiz if unable to generate one
        sample_quiz = {
            "id": "quiz123",
            "title": "Sample Quiz",
            "description": f"A quiz about {content[:50] + '...' if len(content) > 50 else content}",
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
        print(f"Error in generate_quiz: {e}")
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

            # Extract content if it's a PDF
            content = ""
            if filename.lower().endswith(".pdf"):
                content = extract_text_from_pdf(filepath)
            else:
                content = f"Content from {filename}"

            return jsonify(
                {
                    "success": True,
                    "message": "File uploaded successfully",
                    "filename": filename,
                    "content": (
                        content[:1000] + "..." if len(content) > 1000 else content
                    ),  # Return preview
                }
            )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
