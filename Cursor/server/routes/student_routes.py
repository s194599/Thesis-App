import os
import json
from flask import Blueprint, request, jsonify
from datetime import datetime

student_bp = Blueprint("student", __name__)

# Path to store student quiz results
STUDENT_DATA_PATH = "data/student_results.json"
STUDENTS_LIST_PATH = "data/students.json"

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
        "quiz_id": quiz_id,
        "quiz_title": data.get("quiz_title"),
        "score": data.get("score"),
        "total_questions": data.get("total_questions"),
        "answers": data.get("answers"),
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
