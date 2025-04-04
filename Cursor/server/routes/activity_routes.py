from flask import Blueprint, request, jsonify
import os
import json

from config.app_config import ACTIVITIES_FOLDER, logger
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

        # Ensure the completed field is included
        if "completed" not in activity_data:
            activity_data["completed"] = False

        # Load existing activities
        activities_file = os.path.join(ACTIVITIES_FOLDER, "activities.json")
        activities = load_json_file(activities_file, [])

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
        if save_json_file(activities_file, activities):
            return jsonify(
                {
                    "success": True,
                    "message": "Activity saved successfully",
                    "activityId": activity_data.get("id"),
                    "completed": activity_data.get("completed", False),
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
        activities_file = os.path.join(ACTIVITIES_FOLDER, "activities.json")
        all_activities = load_json_file(activities_file, [])

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
        activities_file = os.path.join(ACTIVITIES_FOLDER, "activities.json")
        activities = load_json_file(activities_file, [])

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
        if save_json_file(activities_file, updated_activities):
            return jsonify(
                {
                    "success": True,
                    "message": "Activity deleted successfully",
                    "deleted": len(activities) - len(updated_activities) > 0,
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
