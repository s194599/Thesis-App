from flask import Blueprint, request, jsonify
import os
import time
import json

from config.app_config import DATABASE_FOLDER, logger
from services.quiz_generation import generate_quiz_with_ollama
from services.quiz_parsing import parse_quiz
from utils.file_helpers import load_json_file, save_json_file

# Create blueprint for quiz-related routes
quiz_routes = Blueprint("quiz_routes", __name__)


@quiz_routes.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    """
    Generate a quiz from provided content
    """
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


@quiz_routes.route("/save-quiz", methods=["POST"])
def save_quiz():
    """
    Save a quiz to the quizzes directory
    """
    try:
        quiz_data = request.json

        if not quiz_data:
            logger.error("No quiz data provided")
            return jsonify({"success": False, "message": "No quiz data provided"}), 400

        # Create a quizzes directory if it doesn't exist
        if not os.path.exists(DATABASE_FOLDER):
            os.makedirs(DATABASE_FOLDER)

        # Generate a unique ID for the quiz if not present
        if "id" not in quiz_data:
            quiz_data["id"] = f"quiz_{int(time.time())}"

        # Add timestamp if not present
        if "timestamp" not in quiz_data:
            quiz_data["timestamp"] = time.time()

        # Load existing quizzes
        quizzes_file = os.path.join(DATABASE_FOLDER, "quizzes.json")
        quizzes = load_json_file(quizzes_file, [])

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
        if save_json_file(quizzes_file, quizzes):
            return jsonify(
                {
                    "success": True,
                    "message": "Quiz saved successfully",
                    "quizId": quiz_data["id"],
                }
            )
        else:
            return (
                jsonify({"success": False, "message": "Failed to save quiz file"}),
                500,
            )

    except Exception as e:
        logger.error(f"Error saving quiz: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@quiz_routes.route("/quizzes", methods=["GET"])
def get_quizzes():
    """
    Get all saved quizzes
    """
    try:
        quizzes_file = os.path.join(DATABASE_FOLDER, "quizzes.json")
        quizzes = load_json_file(quizzes_file, [])
        return jsonify({"quizzes": quizzes, "success": True})

    except Exception as e:
        logger.error(f"Error getting quizzes: {str(e)}")
        return jsonify({"success": False, "message": str(e), "quizzes": []}), 500


@quiz_routes.route("/quizzes/<quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    """
    Get a specific quiz by ID
    """
    try:
        quizzes_file = os.path.join(DATABASE_FOLDER, "quizzes.json")
        quizzes = load_json_file(quizzes_file, [])

        quiz = next((q for q in quizzes if q.get("id") == quiz_id), None)

        if not quiz:
            return jsonify({"success": False, "message": "Quiz not found"}), 404

        return jsonify(quiz)

    except Exception as e:
        logger.error(f"Error getting quiz: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
