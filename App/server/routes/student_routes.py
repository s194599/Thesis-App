import os
import json
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import random

student_bp = Blueprint("student", __name__)

# Path to store student quiz results
STUDENT_DATA_PATH = "database/student_results.json"
STUDENTS_LIST_PATH = "database/students.json"

# Current logged in student
CURRENT_STUDENT = {
    "student_id": "1",
    "name": "Christian Wu"
}


def ensure_student_data_exists():
    """Ensure the data directory and student_results.json file exist"""
    os.makedirs(os.path.dirname(STUDENT_DATA_PATH), exist_ok=True)
    if not os.path.exists(STUDENT_DATA_PATH):
        with open(STUDENT_DATA_PATH, "w") as f:
            json.dump({"quiz_history": []}, f, indent=2)


def load_student_data():
    """Load student quiz results from JSON file"""
    ensure_student_data_exists()
    try:
        with open(STUDENT_DATA_PATH, "r") as f:
            content = f.read().strip()
            if not content:  # Handle empty file
                return {"quiz_history": []}
            return json.loads(content)
    except json.JSONDecodeError:
        # If file has invalid JSON, return empty quiz history
        return {"quiz_history": []}


def save_student_data(data):
    """Save student quiz results to JSON file"""
    ensure_student_data_exists()
    with open(STUDENT_DATA_PATH, "w") as f:
        json.dump(data, f, indent=2)


def load_all_students():
    """Load all students from JSON file"""
    if not os.path.exists(STUDENTS_LIST_PATH):
        return {"students": []}
    
    try:
        with open(STUDENTS_LIST_PATH, "r") as f:
            content = f.read().strip()
            if not content:
                return {"students": []}
            return json.loads(content)
    except json.JSONDecodeError:
        return {"students": []}


@student_bp.route("/student/current", methods=["GET"])
def get_current_student():
    """Get information about the currently logged in student"""
    return jsonify(CURRENT_STUDENT)


@student_bp.route("/student/all", methods=["GET"])
def get_all_students():
    """Get list of all students"""
    students = load_all_students()
    
    # Sort students by name
    if "students" in students and isinstance(students["students"], list):
        students["students"] = sorted(students["students"], key=lambda x: x.get("name", ""))
    
    return jsonify(students)


@student_bp.route("/student/quiz-history", methods=["GET"])
def get_quiz_history():
    """Get all quiz results for the current student"""
    student_data = load_student_data()
    
    # Filter results by student ID
    student_id = CURRENT_STUDENT["student_id"]
    
    # Get only this student's quiz history
    history = [
        result for result in student_data["quiz_history"] 
        if result.get("student_id") == student_id
    ]
    
    return jsonify({"quiz_history": history})


@student_bp.route("/student/save-quiz-result", methods=["POST"])
def save_quiz_result():
    """Save a new quiz result for the student"""
    data = request.json
    student_data = load_student_data()
    
    quiz_id = data.get("quiz_id")
    student_id = CURRENT_STUDENT["student_id"]
    
    if not quiz_id:
        return jsonify({"success": False, "message": "Quiz ID is required"}), 400
    
    # Add timestamp to quiz result
    quiz_result = {
        "timestamp": datetime.now().isoformat(),
        "start_timestamp": data.get("start_timestamp", datetime.now().isoformat()),
        "quiz_id": quiz_id,
        "quiz_title": data.get("quiz_title"),
        "score": data.get("score"),
        "total_questions": data.get("total_questions"),
        "answers": data.get("answers", []),  # Each answer should now include question_id
        "attempts": 1,  # Initialize with 1
        "student_id": student_id,
        "student_name": CURRENT_STUDENT["name"]
    }
    
    # Check if a result with the same quiz ID and student ID already exists
    existing_index = -1
    for i, result in enumerate(student_data["quiz_history"]):
        if result.get("quiz_id") == quiz_id and result.get("student_id") == student_id:
            existing_index = i
            break
    
    if existing_index >= 0:
        # Update the existing result
        existing_result = student_data["quiz_history"][existing_index]
        attempts = existing_result.get("attempts", 1) + 1
        quiz_result["attempts"] = attempts
        student_data["quiz_history"][existing_index] = quiz_result
    else:
        # Add new result
        student_data["quiz_history"].append(quiz_result)
    
    save_student_data(student_data)
    
    return jsonify({"success": True, "message": "Quiz result saved"})


@student_bp.route('/student/quiz/<quiz_id>/results', methods=['GET'])
def get_quiz_results(quiz_id):
    try:
        # Get the userRole from query param (default to student if not provided)
        user_role = request.args.get('userRole', 'student')
        
        # Load student results using the correct path
        if not os.path.exists(STUDENT_DATA_PATH):
            # For teachers, always return mock data if no real data exists
            if user_role == 'teacher':
                return jsonify(generate_mock_quiz_results(quiz_id)), 200
            return jsonify([]), 200

        with open(STUDENT_DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            quiz_results = [result for result in data.get('quiz_history', []) 
                          if result.get('quiz_id') == quiz_id]
            
            # For teachers, return mock data if no real results exist
            if len(quiz_results) == 0 and user_role == 'teacher':
                return jsonify(generate_mock_quiz_results(quiz_id)), 200
                
            # Sort results by timestamp (newest first)
            quiz_results.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            return jsonify(quiz_results), 200

    except Exception as e:
        print(f"Error fetching quiz results: {str(e)}")
        return jsonify({'error': 'Kunne ikke indlæse quiz resultater'}), 500


@student_bp.route('/student/<student_id>/quiz/<quiz_id>/latest', methods=['GET'])
def get_student_latest_quiz_result(student_id, quiz_id):
    """Get the latest quiz result for a specific student and quiz"""
    try:
        # Load student results
        if not os.path.exists(STUDENT_DATA_PATH):
            return jsonify(None), 200

        with open(STUDENT_DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            # Filter results for this student and quiz
            student_quiz_results = [
                result for result in data.get('quiz_history', []) 
                if result.get('quiz_id') == quiz_id and result.get('student_id') == student_id
            ]
            
            if not student_quiz_results:
                return jsonify(None), 200
                
            # Sort results by timestamp (newest first)
            student_quiz_results.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            # Return only the latest result
            return jsonify(student_quiz_results[0]), 200

    except Exception as e:
        print(f"Error fetching student's latest quiz result: {str(e)}")
        return jsonify({'error': 'Kunne ikke indlæse quiz resultater'}), 500


def generate_mock_quiz_results(quiz_id):
    """Generate mock quiz results for demonstration purposes"""
    # Get all students
    students_data = load_all_students()
    students = students_data.get('students', [])
    
    if not students:
        # Fallback with some default students if none exist
        students = [
            {"student_id": "1", "name": "Christian Wu", "class": "3A"},
            {"student_id": "2", "name": "Mathilde Nielsen", "class": "3A"},
            {"student_id": "3", "name": "Mikkel Jensen", "class": "3B"},
            {"student_id": "4", "name": "Sofie Andersen", "class": "3A"},
            {"student_id": "5", "name": "Oliver Hansen", "class": "3B"}
        ]
    
    # Get current timestamp
    now = datetime.now()
    
    # Create mock results for all students
    mock_results = []
    for student in students:
        # Choose if this student has taken the quiz (80% chance)
        if random.random() > 0.2:
            # Generate a random score and completion timestamp for each student
            total_questions = 5
            score = random.randint(2, 5)  # Random score between 2 and 5 correct answers
            
            # Random timestamp within the last 7 days
            days_ago = random.randint(0, 7)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            
            completion_time = now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
            start_time = completion_time - timedelta(minutes=random.randint(5, 15))
            
            # Generate mock answers
            answers = []
            for i in range(total_questions):
                # 80% chance of a correct answer if the student got a good score
                is_correct = random.random() < (score / total_questions)
                
                answers.append({
                    "question_id": i + 1,
                    "question": f"Spørgsmål {i + 1}",
                    "answer": f"Svar på spørgsmål {i + 1}",
                    "correct": is_correct,
                    "correct_answer": f"Korrekt svar på spørgsmål {i + 1}"
                })
            
            # Create the mock result
            mock_result = {
                "quiz_id": quiz_id,
                "student_id": student.get("student_id", f"student_{len(mock_results) + 1}"),
                "student_name": student.get("name", f"Student {len(mock_results) + 1}"),
                "class": student.get("class", "3A"),
                "timestamp": completion_time.isoformat(),
                "start_timestamp": start_time.isoformat(),
                "score": score,
                "total_questions": total_questions,
                "answers": answers,
                "attempts": random.randint(1, 3)  # Random number of attempts
            }
            
            mock_results.append(mock_result)
    
    return mock_results
