import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from config.app_config import logger

# Create a Blueprint for completions
completion_routes = Blueprint('completion_routes', __name__)

# Path to store completions data
COMPLETIONS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'completions.json')

def ensure_completions_file_exists():
    """Ensure the completions.json file exists, create if not"""
    os.makedirs(os.path.dirname(COMPLETIONS_PATH), exist_ok=True)
    if not os.path.exists(COMPLETIONS_PATH):
        with open(COMPLETIONS_PATH, 'w') as f:
            json.dump({"completions": []}, f)

def load_completions():
    """Load the completions data from the JSON file"""
    ensure_completions_file_exists()
    try:
        with open(COMPLETIONS_PATH, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {"completions": []}

def save_completions(data):
    """Save the completions data to the JSON file"""
    ensure_completions_file_exists()
    with open(COMPLETIONS_PATH, 'w') as f:
        json.dump(data, f, indent=2)

@completion_routes.route('/completion', methods=['POST'])
def record_completion():
    """Record a module completion for a student"""
    data = request.json
    
    # Validate required fields
    required_fields = ['studentId', 'moduleId', 'activityId']
    if not all(field in data for field in required_fields):
        return jsonify({
            "success": False,
            "message": "Missing required fields"
        }), 400
    
    # Load existing completions
    completions_data = load_completions()
    
    # Create a new completion record
    completion = {
        "id": len(completions_data["completions"]) + 1,
        "studentId": data["studentId"],
        "moduleId": data["moduleId"],
        "activityId": data["activityId"],
        "timestamp": datetime.now().isoformat(),
        "score": data.get("score", None)
    }
    
    # Add to completions list
    completions_data["completions"].append(completion)
    
    # Save updated completions
    save_completions(completions_data)
    
    return jsonify({
        "success": True,
        "message": "Completion recorded successfully",
        "completion": completion
    })

@completion_routes.route('/completions/<student_id>', methods=['GET'])
def get_student_completions(student_id):
    """Get all completions for a specific student"""
    completions_data = load_completions()
    
    # Filter completions for the specified student
    student_completions = [
        completion for completion in completions_data["completions"]
        if completion["studentId"] == student_id
    ]
    
    return jsonify({
        "success": True,
        "completions": student_completions
    })

@completion_routes.route('/completions/module/<module_id>', methods=['GET'])
def get_module_completions(module_id):
    """Get all completions for a specific module"""
    completions_data = load_completions()
    
    # Filter completions for the specified module
    module_completions = [
        completion for completion in completions_data["completions"]
        if completion["moduleId"] == module_id
    ]
    
    return jsonify({
        "success": True,
        "completions": module_completions
    })

@completion_routes.route('/completions/activity/<activity_id>', methods=['GET'])
def get_activity_completions(activity_id):
    """Get all completions for a specific activity"""
    completions_data = load_completions()
    
    # Filter completions for the specified activity
    activity_completions = [
        completion for completion in completions_data["completions"]
        if completion["activityId"] == activity_id
    ]
    
    return jsonify({
        "success": True,
        "completions": activity_completions
    }) 