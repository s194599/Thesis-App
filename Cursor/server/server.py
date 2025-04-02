from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import requests
import uuid
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF for PDF processing
import logging
import time
import random
import string
import re
import whisper_timestamped as whisper
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configure CORS with specific origins
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*",  # Allow all origins for API routes
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Disposition", "Content-Type"],
        }
    },
)

# Configure Flask app
app.config["PERMANENT_SESSION_LIFETIME"] = 300  # 5 minutes
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 300  # 5 minutes
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB max file size
app.config["TEMPLATES_AUTO_RELOAD"] = False  # Disable template auto-reload
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0  # Disable file caching

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
QUIZ_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "quizzes")

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(QUIZ_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["QUIZ_FOLDER"] = QUIZ_FOLDER

ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "txt", "mp4", "mov", "avi", "webm", 'png', 'jpeg', 'jpg'}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


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


# Function to transcribe video using Whisper-Timestamped
def transcribe_video(video_path):
    try:
        logger.info(f"Starting transcription of video: {video_path}")

        # First check if we can access the file
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        try:
            # Load Whisper model - using 'base' for a balance of speed and accuracy
            # Options: 'tiny', 'base', 'small', 'medium', 'large'
            logger.info("Starting transcription with whisper-timestamped...")

            # Transcribe the video - whisper-timestamped handles audio extraction automatically
            result = whisper.transcribe(model="base", audio=video_path, language="en")

            # Extract the text from segments
            if "segments" in result:
                segments = result["segments"]
                transcription = " ".join([segment["text"] for segment in segments])

                # Log some timing information
                duration = result.get("duration", 0)
                num_segments = len(segments)
                logger.info(
                    f"Transcription completed: {len(transcription)} characters, {num_segments} segments, {duration:.2f} seconds of audio"
                )

                logger.info(f"Transcription: {transcription}")

                return transcription
            else:
                logger.warning("No segments found in transcription result")
                return "No transcription segments were produced."
        except FileNotFoundError as e:
            if "ffmpeg" in str(e).lower() or "avconv" in str(e).lower():
                logger.error(
                    "FFmpeg not found. Please install FFmpeg to enable video transcription."
                )
                return "[VIDEO TRANSCRIPTION ERROR] FFmpeg not found. Please install FFmpeg to enable video transcription."
            else:
                raise

    except Exception as e:
        logger.error(f"Error transcribing video: {str(e)}")
        return f"Error transcribing video: {str(e)}"


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

    logger.info(f"Finished parsing quiz with {len(questions)} questions")
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
            # Handle video files
            elif any(
                filename.lower().endswith(ext)
                for ext in [".mp4", ".mov", ".avi", ".webm"]
            ):
                try:
                    logger.info(f"Starting video transcription for: {filename}")
                    # Transcribe the video using Whisper
                    transcription = transcribe_video(filepath)

                    # Format the content with the filename and transcription
                    content = (
                        f"[TRANSCRIPTION FROM VIDEO: {filename}]\n\n{transcription}"
                    )

                    logger.info(
                        f"Transcribed {len(transcription)} characters from video: {filename}"
                    )
                    uploaded_contents.append(content)
                except Exception as e:
                    logger.error(f"Error transcribing video {filename}: {str(e)}")
                    # Fall back to just the filename if transcription fails
                    content = f"[VIDEO FILE: {filename}] Transcription failed: {str(e)}"
                    uploaded_contents.append(content)
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
            return jsonify({"quizzes": []})

        with open(quizzes_file, "r") as f:
            quizzes = json.load(f)

        return jsonify({"quizzes": quizzes, "success": True})

    except Exception as e:
        logger.error(f"Error getting quizzes: {str(e)}")
        return jsonify({"success": False, "message": str(e), "quizzes": []}), 500


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


@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            # Add timestamp to filename to prevent duplicates
            base_name, ext = os.path.splitext(filename)
            timestamp = int(time.time())
            unique_filename = f"{base_name}_{timestamp}{ext}"

            filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(filepath)

            # Log successful file save
            logger.info(f"File saved successfully: {filepath}")

            # Determine file type based on extension
            file_type = 'file'
            if ext.lower() == '.pdf':
                file_type = 'pdf'
            elif ext.lower() in ['.doc', '.docx']:
                file_type = 'word'
            elif ext.lower() in ['.jpg', '.jpeg', '.png']:
                file_type = 'image'
            
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


@app.route("/api/uploads/<path:filename>")
def uploaded_file(filename):
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
        elif ext.lower() in ['.jpg', '.jpeg']:
            return send_from_directory(
                UPLOAD_FOLDER,
                filename,
                mimetype='image/jpeg',
                as_attachment=False
            )
        elif ext.lower() == '.png':
            return send_from_directory(
                UPLOAD_FOLDER,
                filename,
                mimetype='image/png',
                as_attachment=False
            )
        
        # For other files, use standard handling
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        logger.error(f"Error serving file {filename}: {str(e)}")
        return jsonify({"error": str(e)}), 500


# Disable catch-all route for now to prevent interference with file serving
# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def catch_all(path):
#     # Special case for API routes
#     if path.startswith('api/'):
#         # Let Flask handle API routes
#         return "API endpoint not found", 404
#
#     # For all non-API routes, send the React app's index.html
#     return send_from_directory('../client/build', 'index.html')


# Additional CORS headers for file downloads
@app.after_request
def add_cors_headers(response):
    # Add CORS headers for file downloads
    if request.path.startswith("/api/uploads/"):
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add(
            "Access-Control-Expose-Headers", "Content-Disposition, Content-Type"
        )
        response.headers.add(
            "Cache-Control", "no-store, no-cache, must-revalidate, max-age=0"
        )
        response.headers.add("Pragma", "no-cache")
        response.headers.add("Expires", "0")
    return response


# Add a debugging endpoint to list the uploads directory
@app.route("/api/debug/uploads", methods=["GET"])
def list_uploads():
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


# Add route for direct file access
@app.route("/direct-file/<path:filename>")
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


# Add a new route to sync mock PDFs from the client's mockModules data
@app.route("/api/sync-mock-pdfs", methods=["GET"])
def sync_mock_pdfs():
    """
    This functionality has been disabled since mock files are no longer needed.
    The application will now only use files that users have uploaded.
    """
    return jsonify(
        {
            "success": True,
            "message": "Mock files synchronization is disabled. Only uploaded files will be used.",
            "files": [],
        }
    )


# Add a new endpoint to store activity references for uploaded files
@app.route("/api/store-activity", methods=["POST"])
def store_activity():
    """
    Stores activity data including file references in the server
    so they can be retrieved even if localStorage is cleared
    """
    try:
        activity_data = request.json
        if not activity_data:
            return (
                jsonify({"success": False, "message": "No activity data provided"}),
                400,
            )

        # Create activities directory if it doesn't exist
        ACTIVITIES_FOLDER = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "activities"
        )
        os.makedirs(ACTIVITIES_FOLDER, exist_ok=True)

        # Load existing activities
        activities_file = os.path.join(ACTIVITIES_FOLDER, "activities.json")
        activities = []

        if os.path.exists(activities_file):
            try:
                with open(activities_file, "r") as f:
                    activities = json.load(f)
            except json.JSONDecodeError:
                logger.error("Error reading activities file: invalid JSON")
                activities = []

        # Add module ID if not present
        if "moduleId" not in activity_data:
            return jsonify({"success": False, "message": "Module ID is required"}), 400

        # Ensure the completed field is included
        if "completed" not in activity_data:
            activity_data["completed"] = False

        # Check if activity with same ID already exists
        existing_index = None
        for i, activity in enumerate(activities):
            if activity.get("id") == activity_data.get("id") and activity.get(
                "moduleId"
            ) == activity_data.get("moduleId"):
                existing_index = i
                break

        # Update or add the activity
        if existing_index is not None:
            # If the existing activity is already completed and new one isn't,
            # preserve the completed state
            if activities[existing_index].get(
                "completed", False
            ) and not activity_data.get("completed", False):
                activity_data["completed"] = True

            activities[existing_index] = activity_data
        else:
            activities.append(activity_data)

        # Save activities back to file
        with open(activities_file, "w") as f:
            json.dump(activities, f, indent=2)

        return jsonify(
            {
                "success": True,
                "message": "Activity saved successfully",
                "activityId": activity_data.get("id"),
                "completed": activity_data.get("completed", False),
            }
        )

    except Exception as e:
        logger.error(f"Error storing activity: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


# Add a new endpoint to retrieve all stored activities for a module
@app.route("/api/module-activities/<module_id>", methods=["GET"])
def get_module_activities(module_id):
    """
    Retrieves all activities for a specific module from the server
    """
    try:
        ACTIVITIES_FOLDER = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "activities"
        )
        activities_file = os.path.join(ACTIVITIES_FOLDER, "activities.json")

        if not os.path.exists(activities_file):
            return jsonify({"activities": [], "success": True})

        with open(activities_file, "r") as f:
            all_activities = json.load(f)

        # Filter activities by module ID
        module_activities = [
            activity
            for activity in all_activities
            if activity.get("moduleId") == module_id
        ]

        return jsonify({"success": True, "activities": module_activities})

    except Exception as e:
        logger.error(f"Error retrieving module activities: {str(e)}")
        return jsonify({"success": False, "message": str(e), "activities": []}), 500


# Add endpoint to delete an activity
@app.route("/api/delete-activity", methods=["POST"])
def delete_activity():
    """
    Deletes an activity from the server-side storage
    """
    try:
        data = request.json
        if not data or "id" not in data or "moduleId" not in data:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Activity ID and Module ID are required",
                    }
                ),
                400,
            )

        activity_id = data.get("id")
        module_id = data.get("moduleId")

        # Load existing activities
        ACTIVITIES_FOLDER = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "activities"
        )
        activities_file = os.path.join(ACTIVITIES_FOLDER, "activities.json")

        if not os.path.exists(activities_file):
            return jsonify({"success": True, "message": "No activities to delete"})

        try:
            with open(activities_file, "r") as f:
                activities = json.load(f)

            # Filter out the activity to delete
            updated_activities = [
                activity
                for activity in activities
                if not (
                    activity.get("id") == activity_id
                    and activity.get("moduleId") == module_id
                )
            ]

            # Save the updated list back to file
            with open(activities_file, "w") as f:
                json.dump(updated_activities, f, indent=2)

            return jsonify(
                {
                    "success": True,
                    "message": "Activity deleted successfully",
                    "deleted": len(activities) - len(updated_activities) > 0,
                }
            )

        except json.JSONDecodeError:
            logger.error("Error reading activities file: invalid JSON")
            return (
                jsonify({"success": False, "message": "Error reading activities file"}),
                500,
            )

    except Exception as e:
        logger.error(f"Error deleting activity: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/youtube-title', methods=['GET'])
def get_youtube_title():
    """
    Endpoint to fetch YouTube video title
    """
    video_id = request.args.get('videoId')
    if not video_id:
        return jsonify({"error": "No video ID provided"}), 400
    
    try:
        # Create YouTube oEmbed API URL
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        
        # Make request to YouTube API
        response = requests.get(oembed_url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            title = data.get('title', f"YouTube Video ({video_id})")
            return jsonify({"title": title, "success": True})
        else:
            logger.error(f"Error fetching YouTube title: {response.status_code}")
            return jsonify({"title": f"YouTube Video ({video_id})", "success": False}), 200
            
    except Exception as e:
        logger.error(f"Error in YouTube title endpoint: {str(e)}")
        return jsonify({"title": f"YouTube Video ({video_id})", "success": False}), 200

if __name__ == "__main__":
    # Remove automatic mock PDF sync on startup
    logger.info("Starting server without mock files...")
    app.run(host="0.0.0.0", port=5001, debug=True)
