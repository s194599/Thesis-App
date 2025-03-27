from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import requests
import uuid
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF for PDF processing
import logging
import time

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
            # Get the full response
            response_json = response.json()
            raw_quiz = response_json.get("response", "No response received.")

            # Log the complete response
            logger.info("Ollama raw response:")
            logger.info(raw_quiz)

            # Also log information about tokens
            if "eval_count" in response_json:
                logger.info(f"Tokens used: {response_json.get('eval_count')}")
            if "eval_duration" in response_json:
                logger.info(f"Generation time: {response_json.get('eval_duration')}ns")

            return raw_quiz
        else:
            logger.error(f"Error from Ollama API: {response.status_code}")
            logger.error(response.text)
            return None
    except requests.exceptions.Timeout:
        logger.error("Timeout while calling Ollama API")
        return None
    except Exception as e:
        logger.error(f"Exception when calling Ollama API: {e}")
        return None


# Function to parse raw quiz text into structured format
def parse_quiz(raw_quiz, question_type="multipleChoice"):
    logger.info("Starting to parse quiz text")
    questions = []

    if question_type == "multipleChoice":
        # Split by numbered questions (1., 2., etc.)
        raw_questions = []
        current_question = ""

        # Split up all questions line by line
        lines = raw_quiz.split("\n")
        logger.info(f"Raw quiz has {len(lines)} lines")

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

        logger.info(f"Found {len(raw_questions)} raw questions")

        # Process each question
        for i, q in enumerate(raw_questions):
            if not q.strip():
                continue

            logger.info(f"Processing question {i+1}")

            # Initialize question object
            question = {
                "id": f"q{i+1}",  # Start from q1 instead of q0
                "question": "",  # Use only question, not questionText
                "options": [],
                "correctAnswer": "",
                # "explanation": "",
            }

            # Split the question into lines for processing
            lines = q.strip().split("\n")
            logger.info(f"Question {i+1} has {len(lines)} lines")

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
                logger.info(f"Question text: {question_text[:50]}...")

            # Process options and correct answer
            options = []
            correct_answer_line = ""

            for line in lines[1:]:  # Skip the first line (question text)
                line = line.strip()

                # Log current line for debugging
                if line:
                    logger.debug(f"Processing line: {line}")

                # Check if it's an option line (A), B), A., B. etc)
                if line and line[0] in "ABCD" and line[1] in ").":
                    options.append(line[2:].strip())
                    logger.debug(f"Added option: {line[0]}: {line[2:].strip()}")
                # Check various formats of correct answer lines
                elif (
                    "correct answer" in line.lower()
                    or "correct:" in line.lower()
                    or "answer:" in line.lower()
                ):
                    correct_answer_line = line
                    logger.info(f"Found correct answer line: {line}")

            # Add options to question
            question["options"] = options
            logger.info(f"Question has {len(options)} options")

            # Process correct answer
            if correct_answer_line:
                parts = (
                    correct_answer_line.split(":", 1)
                    if ":" in correct_answer_line
                    else correct_answer_line.split(" ", 2)
                )
                logger.debug(f"Split correct answer line into parts: {parts}")

                if len(parts) > 1:
                    answer_letter = parts[1].strip()
                    # Handle multi-character answers like "A" or just "A"
                    answer_letter = answer_letter[0] if answer_letter else ""
                    logger.info(f"Extracted answer letter: {answer_letter}")

                    # Convert letter to option text
                    option_index = -1

                    if answer_letter == "A":
                        option_index = 0
                    elif answer_letter == "B":
                        option_index = 1
                    elif answer_letter == "C":
                        option_index = 2
                    elif answer_letter == "D":
                        option_index = 3

                    if option_index >= 0 and option_index < len(options):
                        question["correctAnswer"] = options[option_index]
                        logger.info(
                            f"Set correct answer to: {question['correctAnswer'][:50]}..."
                        )
                    else:
                        logger.warning(
                            f"Invalid answer letter: {answer_letter} or options index out of range"
                        )
                else:
                    logger.warning(
                        f"Could not parse correct answer from: {correct_answer_line}"
                    )
            else:
                logger.warning(f"No correct answer line found for question {i+1}")

            questions.append(question)

    # Create a quiz object with unique ID
    quiz = {
        "title": "Quiz",
        "description": "Quiz generated from your content",
        "questions": questions,
    }

    logger.info(
        f"Finished parsing quiz with {len(questions)} questions"
    )
    return quiz


# Updated endpoint to match the frontend API call
@app.route("/api/generate-quiz", methods=["POST"])
def generate_quiz():
    try:
        logger.info("=== Starting Quiz Generation Process ===")
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
            quiz_title = data.get(
                "quizTitle", "Quiz"
            )  # Get quiz title with default value

            logger.info(
                f"Received JSON request with input_type: {input_type}, question_type: {question_type}, language: {language}"
            )
            logger.info(
                f"Content length: {len(content)} characters, requested questions: {num_questions}"
            )
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
            quiz_title = request.form.get(
                "quizTitle", "Quiz"
            )  # Get quiz title with default value

            logger.info(
                f"Received form data with input_type: {input_type}, question_type: {question_type}, language: {language}"
            )

            # Handle document upload if present
            document = request.files.get("document")
            if document and input_type == "document":
                filename = secure_filename(document.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                logger.info(f"Handling document upload: {filename}")
                document.save(filepath)

                # Process PDF to extract content if it's a PDF
                if filename.lower().endswith(".pdf"):
                    logger.info(f"Extracting text from PDF: {filename}")
                    content = extract_text_from_pdf(filepath)
                    logger.info(f"Extracted {len(content)} characters from PDF")
                else:
                    # For non-PDF files, just use the filename as a placeholder
                    logger.info(f"Non-PDF file uploaded: {filename}")
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

            logger.info(
                f"Calling Ollama with language: {language}, instructions: '{combined_instructions}'"
            )

            # Generate quiz using Ollama with the user-specified number of questions
            logger.info("Starting LLM quiz generation")
            raw_quiz = generate_quiz_with_ollama(
                content,
                num_questions=num_questions,  # Use the value from the request
                model="mistral",
                question_type=question_type,
                additional_instructions=combined_instructions,
            )

            if raw_quiz:
                logger.info(
                    f"Successfully received raw quiz from Ollama (length: {len(raw_quiz)} characters)"
                )

                # # Log the raw quiz with line numbers for easier debugging
                # logger.info("Raw quiz content with line numbers:")
                # for i, line in enumerate(raw_quiz.strip().split("\n")):
                #     logger.info(f"Line {i+1}: {line}")

                # Parse the raw quiz text into structured format
                logger.info("Parsing raw quiz text into structured format")
                quiz = parse_quiz(raw_quiz, question_type)

                # Add the title from the request to the quiz data
                quiz["title"] = quiz_title

                logger.info(f"Returning quiz with {len(quiz['questions'])} questions")
                return jsonify(quiz)
            else:
                logger.error(
                    "Failed to get a response from Ollama or response was empty"
                )
        else:
            logger.warning("No content provided for quiz generation")

        # Fallback to sample quiz if unable to generate one
        logger.info("Using fallback sample quiz")
        sample_quiz = {
            "title": quiz_title,
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
        logger.error(
            f"Error in generate_quiz: {e}", exc_info=True
        )  # Include stack trace
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


# Combined endpoint for uploading one or multiple files
@app.route("/api/upload-files", methods=["POST"])
def upload_files():
    try:
        logger.info("Received upload request for 1 or more files")

        # Handle multiple files upload
        if "files" not in request.files:
            logger.error("No files part in request")
            return jsonify({"success": False, "message": "No files part"}), 400

        files = request.files.getlist("files")

        # Check if any files were selected
        if not files or all(file.filename == "" for file in files):
            logger.error("No files selected")
            return jsonify({"success": False, "message": "No files selected"}), 400

        uploaded_contents = []
        uploaded_filenames = []

        for file in files:
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            logger.info(f"Saving file to: {filepath}")

            try:
                file.save(filepath)
                uploaded_filenames.append(filename)
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

        # Combine contents
        combined_content = "\n\n".join(uploaded_contents)

        # Return response for multiple file upload
        return jsonify(
            {
                "success": True,
                "message": "Files uploaded successfully",
                "filenames": uploaded_filenames,
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


# Add endpoint for saving quizzes
@app.route("/api/save-quiz", methods=["POST"])
def save_quiz():
    try:
        quiz_data = request.json

        if not quiz_data:
            logger.error("No quiz data provided")
            return jsonify({"success": False, "message": "No quiz data provided"}), 400

        # Create a quizzes directory if it doesn't exist
        QUIZZES_FOLDER = "quizzes"
        if not os.path.exists(QUIZZES_FOLDER):
            os.makedirs(QUIZZES_FOLDER)

        # Generate a unique ID for the quiz if not present
        if "id" not in quiz_data:
            quiz_data["id"] = f"quiz_{int(time.time())}"

        # Add timestamp if not present
        if "timestamp" not in quiz_data:
            quiz_data["timestamp"] = time.time()

        # Load existing quizzes
        quizzes_file = os.path.join(QUIZZES_FOLDER, "quizzes.json")
        quizzes = []

        if os.path.exists(quizzes_file):
            try:
                with open(quizzes_file, "r") as f:
                    quizzes = json.load(f)
            except json.JSONDecodeError:
                logger.error(f"Error reading quizzes file: invalid JSON")
                quizzes = []

        # Check if quiz with same ID already exists
        updated = False
        for i, quiz in enumerate(quizzes):
            if quiz.get("id") == quiz_data["id"]:
                quizzes[i] = quiz_data
                updated = True
                break

        # Add quiz if it doesn't exist
        if not updated:
            quizzes.append(quiz_data)

        # Save quizzes back to file
        with open(quizzes_file, "w") as f:
            json.dump(quizzes, f, indent=2)

        return jsonify(
            {
                "success": True,
                "message": "Quiz saved successfully",
                "quizId": quiz_data["id"],
            }
        )

    except Exception as e:
        logger.error(f"Error saving quiz: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


# Add endpoint for getting all saved quizzes
@app.route("/api/quizzes", methods=["GET"])
def get_quizzes():
    try:
        QUIZZES_FOLDER = "quizzes"
        quizzes_file = os.path.join(QUIZZES_FOLDER, "quizzes.json")

        if not os.path.exists(quizzes_file):
            return jsonify([])

        with open(quizzes_file, "r") as f:
            quizzes = json.load(f)

        return jsonify(quizzes)

    except Exception as e:
        logger.error(f"Error getting quizzes: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


# Add endpoint for getting a specific quiz
@app.route("/api/quizzes/<quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    try:
        QUIZZES_FOLDER = "quizzes"
        quizzes_file = os.path.join(QUIZZES_FOLDER, "quizzes.json")

        if not os.path.exists(quizzes_file):
            return jsonify({"success": False, "message": "Quiz not found"}), 404

        with open(quizzes_file, "r") as f:
            quizzes = json.load(f)

        quiz = next((q for q in quizzes if q.get("id") == quiz_id), None)

        if not quiz:
            return jsonify({"success": False, "message": "Quiz not found"}), 404

        return jsonify(quiz)

    except Exception as e:
        logger.error(f"Error getting quiz: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    # Disable Flask's reloader to prevent file system monitoring issues
    app.run(debug=True, port=5001, use_reloader=False)
