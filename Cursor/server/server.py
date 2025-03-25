from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import requests
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF for PDF processing
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configure CORS with specific origins
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],  # React development server
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
        }
    },
)

# Configure Flask app
app.config["PERMANENT_SESSION_LIFETIME"] = 300  # 5 minutes
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 300  # 5 minutes
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max file size
app.config["TEMPLATES_AUTO_RELOAD"] = False  # Disable template auto-reload
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0  # Disable file caching

UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# Function to extract text from PDF
def extract_text_from_pdf(pdf_path, max_pages=10):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page_num in range(min(len(doc), max_pages)):
            text += doc[page_num].get_text("text") + "\n"
        doc.close()  # Close the document properly
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise


# Function to generate quiz using Ollama's Mistral model
def generate_quiz_with_ollama(
    content,
    num_questions=5,
    model="mistral",
    question_type="multipleChoice",
    additional_instructions="",
):
    OLLAMA_API = "http://localhost:11434/api/generate"
    logger.info("Starting quiz generation with Ollama")

    # Limit content length for token constraints
    if len(content) > 128000:
        logger.warning("Content too long, truncating to 128,000 characters")
        content = content[:128000]

    # Adjust prompt based on question type
    if question_type == "multipleChoice":
        format_instructions = f"""
        Generate a multiple-choice quiz based on this content:
        {content}

        The quiz should have {num_questions} questions and follow EXACTLY this format:

        1. [Question text]
        A) [Option 1]
        B) [Option 2]
        C) [Option 3]
        D) [Option 4]
        Correct answer: [A, B, C, or D]

        2. [Question text]
        A) [Option 1]
        B) [Option 2]
        C) [Option 3]
        D) [Option 4]
        Correct answer: [A, B, C, or D]
    

        And so on. IMPORTANT: 
        - Number the questions starting with 1.
        - Make each question challenging but fair
        - Ensure there is only ONE correct answer
        - Format the options exactly as shown with A), B), C), D)
        - End each question with "Correct answer: X" where X is the letter
        """
    elif question_type == "trueFalse":
        format_instructions = f"""
        Generate a true/false quiz based on this content:
        {content}

        The quiz should have {num_questions} questions and follow EXACTLY this format:

        1. [Question text]
        A) True
        B) False
        Correct answer: [A or B]

        2. [Question text]
        A) True
        B) False
        Correct answer: [A or B]

        And so on. IMPORTANT:
        - Number the questions starting with 1.
        - Make each question testing accurate information from the content
        - Format the options exactly as shown with A), B)
        - End each question with "Correct answer: X" where X is the letter
        """
    else:  # Short answer
        format_instructions = f"""
        Generate a short answer quiz based on this content:
        {content}

        The quiz should have {num_questions} questions and follow EXACTLY this format:

        1. [Question text]
        Correct answer: [Brief answer]

        2. [Question text]
        Correct answer: [Brief answer]

        And so on. IMPORTANT:
        - Number the questions starting with 1.
        - Make each question testing specific information from the content
        - Format the answer as "Correct answer: [brief answer]"
        - Keep answers concise but complete
        """

    # Add any additional instructions from the user
    if additional_instructions:
        format_instructions += f"\n\nAdditional instructions: {additional_instructions}"

    # Prepare payload for Ollama API
    payload = {"model": model, "prompt": format_instructions, "stream": False}

    try:
        # Add timeout to the Ollama API call
        response = requests.post(
            OLLAMA_API, json=payload, timeout=300
        )  # 5-minute timeout

        if response.status_code == 200:
            raw_quiz = response.json().get("response", "No response received.")
            return raw_quiz
        else:
            print(f"Error from Ollama API: {response.status_code}")
            print(response.text)
            return None
    except requests.exceptions.Timeout:
        print("Timeout while calling Ollama API")
        return None
    except Exception as e:
        print(f"Exception when calling Ollama API: {e}")
        return None


# Function to parse raw quiz text into structured format
def parse_quiz(raw_quiz, question_type="multipleChoice"):
    questions = []

    if question_type == "multipleChoice":
        # Split by numbered questions (1., 2., etc.)
        raw_questions = []
        current_question = ""

        # Split up all questions line by line
        lines = raw_quiz.split("\n")
        for line in lines:
            line = line.strip()

            # Check if this is a new question (starts with a number followed by a period)
            if line and line[0].isdigit() and ". " in line[:10]:
                if current_question:  # Save the previous question if it exists
                    raw_questions.append(current_question)
                current_question = line
            elif current_question:  # Append to the current question
                current_question += "\n" + line

        # Add the last question
        if current_question:
            raw_questions.append(current_question)

        # Process each question
        for i, q in enumerate(raw_questions):
            if not q.strip():
                continue

            # Initialize question object
            question = {
                "id": f"q{i+1}",  # Start from q1 instead of q0
                "question": "",
                "options": [],
                "correctAnswer": "",
                # "explanation": "",
            }

            # Split the question into lines for processing
            lines = q.strip().split("\n")

            # Extract question text (first line)
            question_text = ""
            if lines:
                # Remove the question number (e.g., "1. ")
                first_line = lines[0]
                dot_index = first_line.find(". ")
                if dot_index != -1:
                    question_text = first_line[dot_index + 2 :].strip()
                else:
                    question_text = first_line.strip()

                question["question"] = question_text

            # Process options and correct answer
            options = []
            correct_answer_line = ""

            for line in lines[1:]:  # Skip the first line (question text)
                line = line.strip()

                # Check if it's an option line
                if (
                    line.startswith("A)")
                    or line.startswith("B)")
                    or line.startswith("C)")
                    or line.startswith("D)")
                    or line.startswith("A. ")
                    or line.startswith("B. ")
                    or line.startswith("C. ")
                    or line.startswith("D. ")
                ):
                    option_letter = line[0]
                    # Handle both A) and A. formats
                    delimiter = line[1]
                    option_text = (
                        line[2:].strip() if delimiter == ")" else line[2:].strip()
                    )
                    options.append(option_text)

                # Check if it's the correct answer line
                elif "Correct answer:" in line:
                    correct_answer_line = line
                elif line.startswith("Correct answer"):  # Also handle without colon
                    correct_answer_line = line

            # Add options to question
            question["options"] = options

            # Process correct answer
            if correct_answer_line:
                parts = (
                    correct_answer_line.split(":", 1)
                    if ":" in correct_answer_line
                    else correct_answer_line.split(" ", 2)
                )
                if len(parts) > 1:
                    answer_letter = parts[1].strip()
                    # Handle multi-character answers like "A" or just "A"
                    answer_letter = answer_letter[0] if answer_letter else ""

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

            # # Look for an explanation (if present)
            # for line in lines:
            #     if "Explanation:" in line:
            #         question["explanation"] = line.split("Explanation:")[1].strip()

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
            num_questions = data.get("numQuestions", 5)  # Default to 5 if not provided
        else:
            # For backward compatibility with form data
            input_type = request.form.get("inputType", "topic")
            content = request.form.get("content", "")
            question_type = request.form.get("questionType", "multipleChoice")
            student_level = request.form.get("studentLevel", "highSchool")
            additional_instructions = request.form.get("additionalInstructions", "")
            language = request.form.get("language", "danish")
            num_questions = int(
                request.form.get("numQuestions", 5)
            )  # Default to 5 if not provided

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

            # Generate quiz using Ollama with the user-specified number of questions
            raw_quiz = generate_quiz_with_ollama(
                content,
                num_questions=num_questions,  # Use the value from the request
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
        logger.info("Received upload request")
        if "file" not in request.files:
            logger.error("No file part in request")
            return jsonify({"success": False, "message": "No file part"}), 400

        file = request.files["file"]
        logger.info(f"Received file: {file.filename}")

        if file.filename == "":
            logger.error("Empty filename")
            return jsonify({"success": False, "message": "No file selected"}), 400

        if file:
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            logger.info(f"Saving file to: {filepath}")

            try:
                file.save(filepath)
            except Exception as e:
                logger.error(f"Error saving file: {str(e)}")
                return jsonify({"success": False, "message": "Error saving file"}), 500

            # Extract content if it's a PDF
            content = ""
            if filename.lower().endswith(".pdf"):
                try:
                    content = extract_text_from_pdf(filepath)
                    logger.info(f"Extracted {len(content)} characters from PDF")
                except Exception as e:
                    logger.error(f"Error processing PDF: {str(e)}")
                    return (
                        jsonify({"success": False, "message": "Error processing PDF"}),
                        500,
                    )
            else:
                content = f"Content from {filename}"

            return jsonify(
                {
                    "success": True,
                    "message": "File uploaded successfully",
                    "filename": filename,
                    "content": (
                        content[:1000] + "..." if len(content) > 1000 else content
                    ),
                }
            )

    except Exception as e:
        logger.error(f"Error in upload_file: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


# Add endpoint for uploading multiple files
@app.route("/api/upload-files", methods=["POST"])
def upload_files():
    try:
        logger.info("Received multiple files upload request")
        if "files" not in request.files:
            logger.error("No files part in request")
            return jsonify({"success": False, "message": "No files part"}), 400

        files = request.files.getlist("files")
        if not files or all(file.filename == "" for file in files):
            logger.error("No files selected")
            return jsonify({"success": False, "message": "No files selected"}), 400

        uploaded_contents = []
        for file in files:
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            logger.info(f"Saving file to: {filepath}")

            try:
                file.save(filepath)
            except Exception as e:
                logger.error(f"Error saving file {filename}: {str(e)}")
                continue

            # Extract content if it's a PDF
            content = ""
            if filename.lower().endswith(".pdf"):
                try:
                    content = extract_text_from_pdf(filepath)
                    logger.info(
                        f"Extracted {len(content)} characters from PDF: {filename}"
                    )
                    uploaded_contents.append(content)
                except Exception as e:
                    logger.error(f"Error processing PDF {filename}: {str(e)}")
                    continue
            else:
                content = f"Content from {filename}"
                uploaded_contents.append(content)

        if not uploaded_contents:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "No files were successfully processed",
                    }
                ),
                400,
            )

        # Combine all contents with newlines between them
        combined_content = "\n\n".join(uploaded_contents)

        return jsonify(
            {
                "success": True,
                "message": "Files uploaded successfully",
                "content": (
                    combined_content[:1000] + "..."
                    if len(combined_content) > 1000
                    else combined_content
                ),
            }
        )

    except Exception as e:
        logger.error(f"Error in upload_files: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    # Disable Flask's reloader to prevent file system monitoring issues
    app.run(debug=True, port=5001, use_reloader=False)
