import logging
from config.app_config import logger


def parse_quiz(raw_quiz, question_type="multipleChoice"):
    """
    Parse raw quiz text into structured format

    Args:
        raw_quiz (str): Raw quiz text from LLM
        question_type (str): Type of questions in the quiz

    Returns:
        dict: Structured quiz object with questions, options, and correct answers
    """
    logger.info("Starting to parse quiz text")
    questions = []

    if question_type == "flashcards":
        # Split by numbered flashcards (1., 2., etc.)
        raw_flashcards = []
        current_flashcard = ""

        # Split up all flashcards line by line
        lines = raw_quiz.split("\n")
        logger.info(f"Raw quiz has {len(lines)} lines")

        for line in lines:
            line = line.strip()

            # Check if this is a new flashcard (starts with a number followed by a period)
            if line and line[0].isdigit() and ". " in line[:10]:
                if current_flashcard:  # Save the previous flashcard if it exists
                    raw_flashcards.append(current_flashcard)
                current_flashcard = line
            elif current_flashcard:  # Append to the current flashcard
                current_flashcard += "\n" + line

        # Add the last flashcard
        if current_flashcard:
            raw_flashcards.append(current_flashcard)

        logger.info(f"Found {len(raw_flashcards)} raw flashcards")

        # Process each flashcard
        for i, fc in enumerate(raw_flashcards):
            if not fc.strip():
                continue

            logger.info(f"Processing flashcard {i+1}")

            # Initialize flashcard object
            flashcard = {
                "id": f"fc{i+1}",  # Start from fc1 instead of fc0
                "question": "",  # Front side of the card
                "correctAnswer": "",  # Back side of the card
                "type": "flashcard"  # Indicate this is a flashcard
            }

            # Split the flashcard into lines for processing
            lines = fc.strip().split("\n")
            logger.info(f"Flashcard {i+1} has {len(lines)} lines")

            # Extract front side (first line)
            front_side = ""
            if lines:
                # Remove the flashcard number (e.g., "1. ")
                first_line = lines[0]
                dot_index = first_line.find(". ")
                if dot_index != -1:
                    front_side = first_line[dot_index + 2:].strip()
                else:
                    front_side = first_line.strip()

                flashcard["question"] = front_side
                logger.info(f"Front side: {front_side[:50]}...")

            # Find the back side ("Flip side:" content)
            for line in lines[1:]:  # Skip the first line (front side)
                line = line.strip().lower()
                if "flip side:" in line:
                    back_side = line[line.find("flip side:") + 10:].strip()
                    flashcard["correctAnswer"] = back_side
                    logger.info(f"Back side: {back_side[:50]}...")
                    break

            questions.append(flashcard)

    elif question_type == "multipleChoice":
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
