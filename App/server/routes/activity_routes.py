from flask import Blueprint, request, jsonify
import os
import json
from datetime import datetime

from config.app_config import DATABASE_FOLDER, logger
from utils.file_helpers import load_json_file, save_json_file

# Create blueprint for activity-related routes
activity_routes = Blueprint("activity_routes", __name__)


@activity_routes.route("/store-activity", methods=["POST"])
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

        # Add module ID if not present
        if "moduleId" not in activity_data:
            return jsonify({"success": False, "message": "Module ID is required"}), 400

        # Remove completed field if present
        if "completed" in activity_data:
            del activity_data["completed"]
            
        # Make sure isHomework field exists, default to false if not provided
        if "isHomework" not in activity_data:
            activity_data["isHomework"] = False

        # Load existing activities
        activities_file = os.path.join(DATABASE_FOLDER, "activities.json")
        activities = load_json_file(activities_file, [])

        # Special handling for quiz activities to prevent duplication across modules
        if (activity_data.get("type") == "quiz" or 
            activity_data.get("type") == "flashcards" or
            activity_data.get("type") == "multiple_choice" or
            activity_data.get("type") == "flashcard") and activity_data.get("quizId"):
            
            quiz_id = activity_data.get("quizId")
            module_id = activity_data.get("moduleId")
            
            # Automatically determine the correct type based on the quiz type
            try:
                quizzes_file = os.path.join(DATABASE_FOLDER, "quizzes.json")
                quizzes = load_json_file(quizzes_file, [])
                
                # Find the quiz with matching ID
                quiz_item = next((q for q in quizzes if q.get("id") == quiz_id), None)
                
                # If the quiz is found, set the activity type based on the quiz type
                if quiz_item:
                    # Check quiz-level type first
                    if quiz_item.get("type") == "flashcard":
                        activity_data["type"] = "flashcard"
                    elif quiz_item.get("type") == "multiple_choice":
                        activity_data["type"] = "multiple_choice"
                    # If no quiz-level type, check the first question's type
                    elif quiz_item.get("questions") and len(quiz_item.get("questions", [])) > 0:
                        first_question = quiz_item["questions"][0]
                        if first_question.get("type") == "flashcard":
                            activity_data["type"] = "flashcard"
                        else:
                            activity_data["type"] = "multiple_choice"
                    else:
                        # Default to multiple_choice if can't determine
                        activity_data["type"] = "multiple_choice"
                        
                    # Log the activity type set
                    logger.info(f"Set activity type for quiz {quiz_id} to {activity_data['type']}")
            except Exception as e:
                logger.error(f"Error determining quiz type: {str(e)}")
            
            # Check if this quiz already exists in any module
            existing_quiz_indices = []
            for i, activity in enumerate(activities):
                if ((activity.get("type") == "quiz" or 
                     activity.get("type") == "flashcards" or
                     activity.get("type") == "multiple_choice" or
                     activity.get("type") == "flashcard") and 
                    activity.get("quizId") == quiz_id):
                    existing_quiz_indices.append(i)
                    
            # If quiz exists in other modules, log a warning but continue
            if existing_quiz_indices:
                for idx in existing_quiz_indices:
                    existing_module = activities[idx].get("moduleId")
                    if existing_module != module_id:
                        logger.warning(
                            f"Quiz {quiz_id} already exists in module {existing_module}, "
                            f"now being added to module {module_id} as well."
                        )
                        
                # If quiz already exists in THIS module, update it instead of adding again
                for idx in existing_quiz_indices:
                    if activities[idx].get("moduleId") == module_id:
                        activities[idx] = activity_data
                        
                        # Save activities back to file
                        if save_json_file(activities_file, activities):
                            return jsonify(
                                {
                                    "success": True,
                                    "message": "Quiz activity updated successfully",
                                    "activityId": activity_data.get("id")
                                }
                            )
                        else:
                            return (
                                jsonify({"success": False, "message": "Failed to save activity data"}),
                                500,
                            )

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
            activities[existing_index] = activity_data
        else:
            activities.append(activity_data)

        # Save activities back to file
        if save_json_file(activities_file, activities):
            return jsonify(
                {
                    "success": True,
                    "message": "Activity saved successfully",
                    "activityId": activity_data.get("id")
                }
            )
        else:
            return (
                jsonify({"success": False, "message": "Failed to save activity data"}),
                500,
            )

    except Exception as e:
        logger.error(f"Error storing activity: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@activity_routes.route("/module-activities/<module_id>", methods=["GET"])
def get_module_activities(module_id):
    """
    Retrieves all activities for a specific module from the server
    """
    try:
        activities_file = os.path.join(DATABASE_FOLDER, "activities.json")
        all_activities = load_json_file(activities_file, [])

        # Filter activities by module ID
        module_activities = [
            activity
            for activity in all_activities
            if activity.get("moduleId") == module_id
        ]
        
        # Get completion information for the current student (default to Christian Wu)
        student_id = request.args.get("studentId", "1")  # Default to ID 1 (Christian Wu)
        completions_file = os.path.join(DATABASE_FOLDER, "activity_completions.json")
        completions_data = load_json_file(completions_file, {"completions": []})
        
        # Create a set of completed activity IDs for this student
        completed_activities = {
            completion.get("activity_id") 
            for completion in completions_data.get("completions", [])
            if completion.get("student_id") == student_id
        }
        
        # Add completion status to activities
        for activity in module_activities:
            activity["completed"] = activity.get("id") in completed_activities

        return jsonify({"success": True, "activities": module_activities})

    except Exception as e:
        logger.error(f"Error retrieving module activities: {str(e)}")
        return jsonify({"success": False, "message": str(e), "activities": []}), 500


@activity_routes.route("/delete-activity", methods=["POST"])
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
        activities_file = os.path.join(DATABASE_FOLDER, "activities.json")
        activities = load_json_file(activities_file, [])

        # Find the activity before removing it to check if it's a quiz
        activity_to_delete = None
        for activity in activities:
            if (activity.get("id") == activity_id and 
                activity.get("moduleId") == module_id):
                activity_to_delete = activity
                break

        # Filter out the activity to delete
        updated_activities = [
            activity
            for activity in activities
            if not (
                activity.get("id") == activity_id
                and activity.get("moduleId") == module_id
            )
        ]
        
        # Also remove from completions
        completions_file = os.path.join(DATABASE_FOLDER, "activity_completions.json")
        completions_data = load_json_file(completions_file, {"completions": []})
        
        # Filter out completions for this activity
        updated_completions = [
            completion 
            for completion in completions_data.get("completions", [])
            if completion.get("activity_id") != activity_id
        ]
        
        completions_data["completions"] = updated_completions
        
        # Variables to track if quiz data was deleted
        quiz_deleted = False
        quiz_results_deleted = False
        quiz_id = None
        
        # If this was a quiz activity, also remove the associated quiz from quizzes.json
        if activity_to_delete and activity_to_delete.get("type") == "quiz" and activity_to_delete.get("quizId"):
            quiz_id = activity_to_delete.get("quizId")
            
            # Remove from quizzes.json
            quizzes_file = os.path.join(DATABASE_FOLDER, "quizzes.json")
            quizzes = load_json_file(quizzes_file, [])
            
            # Filter out the quiz with the matching ID
            updated_quizzes = [
                quiz for quiz in quizzes if quiz.get("id") != quiz_id
            ]
            
            # Save the updated quizzes list if there was a change
            if len(quizzes) != len(updated_quizzes):
                quiz_deleted = save_json_file(quizzes_file, updated_quizzes)
                logger.info(f"Quiz {quiz_id} deleted from quizzes.json")
            
            # Also remove corresponding quiz results from student_results.json
            results_file = os.path.join(DATABASE_FOLDER, "student_results.json")
            results_data = load_json_file(results_file, {"quiz_history": []})
            
            # Filter out quiz results for this quiz
            quiz_history = results_data.get("quiz_history", [])
            updated_quiz_history = [
                result for result in quiz_history if result.get("quiz_id") != quiz_id
            ]
            
            # Check if any results were removed
            if len(quiz_history) != len(updated_quiz_history):
                results_data["quiz_history"] = updated_quiz_history
                quiz_results_deleted = save_json_file(results_file, results_data)
                logger.info(f"Removed {len(quiz_history) - len(updated_quiz_history)} quiz results for quiz {quiz_id} from student_results.json")
        
        # Save both files
        activities_saved = save_json_file(activities_file, updated_activities)
        completions_saved = save_json_file(completions_file, completions_data)

        if activities_saved and completions_saved:
            return jsonify(
                {
                    "success": True,
                    "message": "Activity deleted successfully",
                    "deleted": len(activities) - len(updated_activities) > 0,
                    "quiz_deleted": quiz_deleted,
                    "quiz_results_deleted": quiz_results_deleted,
                    "quiz_id": quiz_id
                }
            )
        else:
            return (
                jsonify(
                    {"success": False, "message": "Failed to save updated activities"}
                ),
                500,
            )

    except Exception as e:
        logger.error(f"Error deleting activity: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@activity_routes.route("/youtube-title", methods=["GET"])
def get_youtube_title():
    """
    Endpoint to fetch YouTube video title
    """
    import requests

    video_id = request.args.get("videoId")
    if not video_id:
        return jsonify({"error": "No video ID provided"}), 400

    try:
        # Create YouTube oEmbed API URL
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"

        # Make request to YouTube API
        response = requests.get(oembed_url, timeout=5)

        if response.status_code == 200:
            data = response.json()
            title = data.get("title", f"YouTube Video ({video_id})")
            return jsonify({"title": title, "success": True})
        else:
            logger.error(f"Error fetching YouTube title: {response.status_code}")
            return (
                jsonify({"title": f"YouTube Video ({video_id})", "success": False}),
                200,
            )

    except Exception as e:
        logger.error(f"Error in YouTube title endpoint: {str(e)}")
        return jsonify({"title": f"YouTube Video ({video_id})", "success": False}), 200


@activity_routes.route("/update-quiz-activity-title", methods=["POST"])
def update_quiz_activity_title():
    """
    Updates the title of activities that reference a specific quiz
    """
    try:
        data = request.json
        quiz_id = data.get("quizId")
        new_title = data.get("newTitle")
        
        if not quiz_id or not new_title:
            return jsonify({"success": False, "message": "Quiz ID and new title are required"}), 400
            
        # Load all activities
        activities_file = os.path.join(DATABASE_FOLDER, "activities.json")
        all_activities = load_json_file(activities_file, [])
        
        # Update activities that reference this quiz
        updated = False
        for activity in all_activities:
            if activity.get("type") == "quiz" and activity.get("quizId") == quiz_id:
                activity["title"] = new_title
                updated = True
        
        # Save the updated activities
        if updated:
            if save_json_file(activities_file, all_activities):
                return jsonify({"success": True, "message": "Activity titles updated successfully"})
            else:
                return jsonify({"success": False, "message": "Failed to save activities file"}), 500
        else:
            return jsonify({"success": True, "message": "No activities found with the specified quiz ID"})
            
    except Exception as e:
        logger.error(f"Error updating quiz activity titles: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@activity_routes.route("/complete-activity", methods=["POST"])
def complete_activity():
    """
    Marks an activity as completed for a specific student
    """
    try:
        data = request.json
        activity_id = data.get("activityId")
        module_id = data.get("moduleId")
        student_id = data.get("studentId", "1")  # Default to Christian Wu (ID: 1)
        student_name = data.get("studentName", "Christian Wu")  # Default name
        quiz_score = data.get("quizScore")  # Get quiz score if provided
        
        if not activity_id or not module_id:
            return jsonify({"success": False, "message": "Activity ID and Module ID are required"}), 400
            
        # Path to store completions
        completions_file = os.path.join(DATABASE_FOLDER, "activity_completions.json")
        
        # Load existing completions
        completions = load_json_file(completions_file, {"completions": []})
        
        # Check if this completion already exists
        completion_exists = False
        for completion in completions["completions"]:
            if (completion.get("activity_id") == activity_id and 
                completion.get("student_id") == student_id):
                # If record exists and we have a quiz score, update it
                if quiz_score is not None:
                    completion["quiz_score"] = quiz_score
                    completion_exists = True
                    break
                else:
                    completion_exists = True
                    break
                
        # Add completion if it doesn't exist
        if not completion_exists:
            new_completion = {
                "activity_id": activity_id,
                "module_id": module_id,
                "student_id": student_id,
                "student_name": student_name,
                "timestamp": datetime.now().isoformat()
            }
            
            # Add quiz score if provided
            if quiz_score is not None:
                new_completion["quiz_score"] = quiz_score
                
            completions["completions"].append(new_completion)
            
            # Save completions back to file
            if not save_json_file(completions_file, completions):
                return jsonify({"success": False, "message": "Failed to save completion"}), 500
        else:
            # Save any updates made to existing completions
            if not save_json_file(completions_file, completions):
                return jsonify({"success": False, "message": "Failed to update completion"}), 500
        
        return jsonify({"success": True, "message": "Activity marked as completed"})
        
    except Exception as e:
        logger.error(f"Error completing activity: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@activity_routes.route("/student-activity-completions", methods=["GET"])
def get_student_activity_completions():
    """
    Get all activity completions for a specific student
    """
    try:
        student_id = request.args.get("studentId", "1")  # Default to Christian Wu (ID: 1)
        
        # Path to completions file
        completions_file = os.path.join(DATABASE_FOLDER, "activity_completions.json")
        
        # Load existing completions
        completions = load_json_file(completions_file, {"completions": []})
        
        # Filter completions for this student
        student_completions = [
            completion for completion in completions["completions"]
            if completion.get("student_id") == student_id
        ]
        
        # Return list of activity IDs completed by this student
        completed_activity_ids = [
            completion.get("activity_id") for completion in student_completions
        ]
        
        # Include detailed completion data with scores
        completed_activities_data = []
        for completion in student_completions:
            activity_data = {
                "id": completion.get("activity_id"),
                "score": completion.get("quiz_score")
            }
            completed_activities_data.append(activity_data)
        
        return jsonify({
            "success": True, 
            "student_id": student_id,
            "completed_activities": completed_activity_ids,
            "completed_activities_data": completed_activities_data
        })
        
    except Exception as e:
        logger.error(f"Error getting student completions: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@activity_routes.route("/activity-completions/detailed", methods=["GET"])
def get_detailed_activity_completions():
    """
    Get detailed activity completions including timestamps, optionally filtered by module
    """
    try:
        # Optional moduleId filter
        module_id = request.args.get("moduleId")
        
        # Path to completions file
        completions_file = os.path.join(DATABASE_FOLDER, "activity_completions.json")
        
        # Load existing completions
        completions_data = load_json_file(completions_file, {"completions": []})
        
        # Filter by module if specified
        if module_id:
            filtered_completions = [
                completion for completion in completions_data["completions"]
                if completion.get("module_id") == module_id
            ]
        else:
            filtered_completions = completions_data["completions"]
        
        return jsonify({
            "success": True,
            "completions": filtered_completions
        })
        
    except Exception as e:
        logger.error(f"Error getting detailed completions: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
