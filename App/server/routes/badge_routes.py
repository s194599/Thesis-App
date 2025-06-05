import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from config.app_config import logger, DATABASE_FOLDER

# Create a Blueprint for badge routes
badge_routes = Blueprint('badge_routes', __name__)

# Paths to relevant JSON files
BADGES_PATH = os.path.join(DATABASE_FOLDER, 'badges.json')
STUDENT_BADGES_PATH = os.path.join(DATABASE_FOLDER, 'student_badges.json')
QUIZ_COMPLETIONS_PATH = os.path.join(DATABASE_FOLDER, 'quiz_completions.json')
STUDENT_RESULTS_PATH = os.path.join(DATABASE_FOLDER, 'student_results.json')
ACTIVITY_COMPLETIONS_PATH = os.path.join(DATABASE_FOLDER, 'activity_completions.json')

def ensure_file_exists(file_path, default_data):
    """Ensure a JSON file exists, creating it with default data if not"""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    if not os.path.exists(file_path):
        with open(file_path, 'w') as f:
            json.dump(default_data, f, indent=2)

def load_json_file(file_path, default_data):
    """Load JSON data from a file, returning default data if issues occur"""
    ensure_file_exists(file_path, default_data)
    try:
        with open(file_path, 'r') as f:
            content = f.read().strip()
            if not content:  # Handle empty file
                return default_data
            return json.loads(content)
    except json.JSONDecodeError:
        return default_data

def save_json_file(file_path, data):
    """Save data to a JSON file"""
    ensure_file_exists(file_path, data)  # This ensures the directory exists
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def record_quiz_completion(student_id, quiz_id, module_id, score, total_questions):
    """Record a quiz completion and check for new badges"""
    # 1. Record the quiz completion
    quiz_completions = load_json_file(QUIZ_COMPLETIONS_PATH, {"quiz_completions": []})
    
    # Get student name
    student_name = "Unknown"
    students = load_json_file(os.path.join(DATABASE_FOLDER, 'students.json'), {"students": []})
    for student in students.get("students", []):
        if student.get("student_id") == student_id:
            student_name = student.get("name")
            break
    
    # Add the new completion
    completion = {
        "completion_id": f"qc_{int(datetime.now().timestamp())}",
        "student_id": student_id,
        "student_name": student_name,
        "quiz_id": quiz_id,
        "module_id": module_id,
        "score": score,
        "total_questions": total_questions,
        "score_percent": round((score / total_questions) * 100) if total_questions > 0 else 0,
        "timestamp": datetime.now().isoformat()
    }
    
    quiz_completions["quiz_completions"].append(completion)
    save_json_file(QUIZ_COMPLETIONS_PATH, quiz_completions)
    
    # 2. Check for earned badges
    check_and_award_badges(student_id, student_name)
    
    return completion

def check_and_award_badges(student_id, student_name):
    """Check if a student has earned any new badges and award them"""
    # Load necessary data
    badges = load_json_file(BADGES_PATH, {"badges": []})
    student_badges = load_json_file(STUDENT_BADGES_PATH, {"student_badges": []})
    quiz_completions = load_json_file(QUIZ_COMPLETIONS_PATH, {"quiz_completions": []})
    student_results = load_json_file(STUDENT_RESULTS_PATH, {"quiz_history": []})
    
    # Get completions for this student
    student_completions = [
        completion for completion in quiz_completions.get("quiz_completions", [])
        if completion.get("student_id") == student_id
    ]
    
    # Get quiz history for this student from student_results.json
    student_quiz_history = [
        result for result in student_results.get("quiz_history", [])
        if result.get("student_id") == student_id
    ]
    
    # Get badges already earned by this student
    earned_badge_ids = [
        badge.get("badge_id") for badge in student_badges.get("student_badges", [])
        if badge.get("student_id") == student_id
    ]
    
    newly_earned_badges = []
    
    # Check each badge to see if it's been earned
    for badge in badges.get("badges", []):
        badge_id = badge.get("badge_id")
        
        # Skip if already earned
        if badge_id in earned_badge_ids:
            continue
        
        # Check criteria
        criteria = badge.get("criteria", {})
        badge_earned = False
        badge_context = {}  # Store context information about the badge (e.g., which quiz)
        
        # Check quiz completion count
        if "quiz_completions" in criteria:
            required_completions = criteria.get("quiz_completions")
            if len(student_completions) >= required_completions:
                badge_earned = True
        
        # Check for perfect score
        if "quiz_perfect_score" in criteria and criteria.get("quiz_perfect_score") is True:
            for completion in student_completions:
                if completion.get("score") == completion.get("total_questions"):
                    badge_earned = True
                    break
        
        # Check unique module completions
        if "unique_module_completions" in criteria:
            required_modules = criteria.get("unique_module_completions")
            unique_modules = set(completion.get("module_id") for completion in student_completions)
            if len(unique_modules) >= required_modules:
                badge_earned = True
        
        # Check quiz streak
        if "quiz_streak" in criteria:
            required_streak = criteria.get("quiz_streak")
            min_score_percent = criteria.get("min_score_percent", 0)
            
            # Sort completions by timestamp
            sorted_completions = sorted(
                student_completions, 
                key=lambda x: x.get("timestamp", "")
            )
            
            current_streak = 0
            for completion in sorted_completions:
                score_percent = completion.get("score_percent", 0)
                if score_percent >= min_score_percent:
                    current_streak += 1
                    if current_streak >= required_streak:
                        badge_earned = True
                        break
                else:
                    current_streak = 0
        
        # Check for attempts on the same quiz
        if "same_quiz_attempts" in criteria:
            required_attempts = criteria.get("same_quiz_attempts")
            
            # Find quizzes with high attempt counts from student_results.json
            # This is more accurate than counting completions
            quiz_attempt_counts = {}
            for result in student_quiz_history:
                quiz_id = result.get("quiz_id")
                attempts = result.get("attempts", 1)
                quiz_title = result.get("quiz_title", "Unknown Quiz")
                
                if quiz_id and attempts >= required_attempts:
                    badge_earned = True
                    badge_context = {
                        "quiz_id": quiz_id,
                        "quiz_title": quiz_title,
                        "attempts": attempts
                    }
                    break
        
        # Check for speed demon badge (quick completion with high score)
        if "quick_completion" in criteria and criteria.get("quick_completion") is True:
            max_seconds = criteria.get("max_seconds", 30)
            min_score_percent = criteria.get("min_score_percent", 80)
            
            # Look through the student's quiz history for quick completions
            for result in student_quiz_history:
                # Skip if score is too low
                score = result.get("score", 0)
                total_questions = result.get("total_questions", 1)
                if total_questions == 0:
                    continue
                
                score_percent = (score / total_questions) * 100
                if score_percent < min_score_percent:
                    continue
                
                # Check for completion time
                start_timestamp = result.get("start_timestamp")
                end_timestamp = result.get("timestamp")
                
                if start_timestamp and end_timestamp:
                    try:
                        # Parse timestamps and ensure they're both naive or both timezone-aware
                        # Strip any timezone info to make both naive
                        if isinstance(start_timestamp, str):
                            start_time = datetime.fromisoformat(start_timestamp.replace('Z', '').split('+')[0])
                        else:
                            start_time = start_timestamp
                            
                        if isinstance(end_timestamp, str):
                            end_time = datetime.fromisoformat(end_timestamp.replace('Z', '').split('+')[0])
                        else:
                            end_time = end_timestamp
                        
                        # Calculate time difference in seconds
                        time_diff = (end_time - start_time).total_seconds()
                        
                        # Check if time is within the required limit
                        if time_diff <= max_seconds:
                            quiz_id = result.get("quiz_id")
                            quiz_title = result.get("quiz_title", "Unknown Quiz")
                            
                            badge_earned = True
                            badge_context = {
                                "quiz_id": quiz_id,
                                "quiz_title": quiz_title,
                                "completion_time": time_diff,
                                "score_percent": score_percent
                            }
                            break
                    except (ValueError, TypeError) as e:
                        # Skip if there's an error parsing timestamps
                        logger.warning(f"Error parsing timestamps for speed demon badge: {e}")
                        continue
        
        # If badge is earned, add it to student's badges
        if badge_earned:
            new_badge = {
                "badge_id": badge_id,
                "student_id": student_id,
                "student_name": student_name,
                "badge_name": badge.get("name"),
                "badge_description": badge.get("description"),
                "badge_icon": badge.get("icon"),
                "earned_timestamp": datetime.now().isoformat()
            }
            
            # Add additional context if available
            if badge_context:
                new_badge["context"] = badge_context
            
            student_badges["student_badges"].append(new_badge)
            newly_earned_badges.append(new_badge)
    
    # Save updated student badges
    if newly_earned_badges:
        save_json_file(STUDENT_BADGES_PATH, student_badges)
    
    return newly_earned_badges

@badge_routes.route('/badges', methods=['GET'])
def get_all_badges():
    """Get all badge definitions"""
    badges = load_json_file(BADGES_PATH, {"badges": []})
    return jsonify({
        "success": True,
        "badges": badges.get("badges", [])
    })

@badge_routes.route('/student/<student_id>/badges', methods=['GET'])
def get_student_badges(student_id):
    """Get all badges earned by a student"""
    student_badges = load_json_file(STUDENT_BADGES_PATH, {"student_badges": []})
    
    # Filter for this student
    badges = [
        badge for badge in student_badges.get("student_badges", [])
        if badge.get("student_id") == student_id
    ]
    
    return jsonify({
        "success": True,
        "student_id": student_id,
        "badges": badges
    })

@badge_routes.route('/record-quiz-completion', methods=['POST'])
def handle_quiz_completion():
    """Record a quiz completion and award any earned badges"""
    try:
        data = request.json
        required_fields = ['student_id', 'quiz_id', 'module_id', 'score', 'total_questions']
        
        if not all(field in data for field in required_fields):
            return jsonify({
                "success": False,
                "message": "Missing required fields"
            }), 400
        
        # Record the completion and check for badges
        completion = record_quiz_completion(
            data["student_id"],
            data["quiz_id"],
            data["module_id"],
            data["score"],
            data["total_questions"]
        )
        
        # Get newly earned badges
        student_name = completion.get("student_name")
        newly_earned_badges = check_and_award_badges(data["student_id"], student_name)
        
        return jsonify({
            "success": True,
            "message": "Quiz completion recorded",
            "completion": completion,
            "newly_earned_badges": newly_earned_badges
        })
        
    except Exception as e:
        logger.error(f"Error recording quiz completion: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@badge_routes.route('/check-all-badges', methods=['GET'])
def check_all_badges():
    """Check and award badges for all students based on their current quiz history"""
    try:
        # Load student data
        students = load_json_file(os.path.join(DATABASE_FOLDER, 'students.json'), {"students": []})
        newly_earned_badges = []

        # Check badges for each student
        for student in students.get("students", []):
            student_id = student.get("student_id")
            student_name = student.get("name")
            
            if student_id and student_name:
                # Check and award badges for this student
                student_badges = check_and_award_badges(student_id, student_name)
                
                if student_badges:
                    newly_earned_badges.extend(student_badges)
        
        return jsonify({
            "success": True,
            "message": f"Checked badges for all students",
            "newly_earned_badges": newly_earned_badges
        })
    
    except Exception as e:
        logger.error(f"Error checking badges for all students: {str(e)}")
        return jsonify({
            "success": False, 
            "message": str(e)
        }), 500


@badge_routes.route('/check-student-badges/<student_id>', methods=['GET'])
def check_student_badges(student_id):
    """Check and award badges for a specific student"""
    try:
        # Get student name
        student_name = "Unknown"
        students = load_json_file(os.path.join(DATABASE_FOLDER, 'students.json'), {"students": []})
        
        for student in students.get("students", []):
            if student.get("student_id") == student_id:
                student_name = student.get("name", "Unknown")
                break
        
        # Check and award badges for this student
        newly_earned_badges = check_and_award_badges(student_id, student_name)
        
        return jsonify({
            "success": True,
            "message": f"Checked badges for student {student_id}",
            "newly_earned_badges": newly_earned_badges
        })
    
    except Exception as e:
        logger.error(f"Error checking badges for student {student_id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500 