from flask import Blueprint, request, jsonify
import os
import json

from config.app_config import DATABASE_FOLDER, DATABASE_FOLDER, logger
from utils.file_helpers import load_json_file, save_json_file

# Create blueprint for module-related routes
module_routes = Blueprint("module_routes", __name__)


@module_routes.route("/topics", methods=["GET"])
def get_topics():
    """
    Retrieves all topics from the server
    """
    try:
        topics_file = os.path.join(DATABASE_FOLDER, "topics.json")
        
        # Explicitly read with UTF-8 encoding
        if os.path.exists(topics_file):
            with open(topics_file, 'r', encoding='utf-8') as f:
                topics = json.load(f)
                logger.info(f"Successfully loaded {len(topics)} topics")
        else:
            logger.warning(f"Topics file not found at {topics_file}")
            topics = []
        
        return jsonify({"success": True, "topics": topics})
    
    except Exception as e:
        logger.error(f"Error retrieving topics: {str(e)}")
        return jsonify({"success": False, "message": str(e), "topics": []}), 500


@module_routes.route("/modules", methods=["GET"])
def get_modules():
    """
    Retrieves all modules from the server
    """
    try:
        modules_file = os.path.join(DATABASE_FOLDER, "modules.json")
        modules = load_json_file(modules_file, [])
        
        return jsonify({"success": True, "modules": modules})
    
    except Exception as e:
        logger.error(f"Error retrieving modules: {str(e)}")
        return jsonify({"success": False, "message": str(e), "modules": []}), 500


@module_routes.route("/modules-with-activities", methods=["GET"])
def get_modules_with_activities():
    """
    Retrieves all modules with their associated activities, 
    cross-referencing the moduleId field in activities.json
    """
    try:
        # Load all modules
        modules_file = os.path.join(DATABASE_FOLDER, "modules.json")
        modules = load_json_file(modules_file, [])
        
        # Load all activities
        activities_file = os.path.join(DATABASE_FOLDER, "activities.json")
        all_activities = load_json_file(activities_file, [])
        
        # Create a dictionary to map moduleId to activities
        activities_by_module = {}
        for activity in all_activities:
            module_id = activity.get("moduleId")
            if module_id:
                if module_id not in activities_by_module:
                    activities_by_module[module_id] = []
                activities_by_module[module_id].append(activity)
        
        # Attach activities to their respective modules
        for module in modules:
            module_id = module.get("id")
            if module_id and module_id in activities_by_module:
                module["activities"] = activities_by_module[module_id]
            else:
                module["activities"] = []
        
        return jsonify({"success": True, "modules": modules})
        
    except Exception as e:
        logger.error(f"Error retrieving modules with activities: {str(e)}")
        return jsonify({"success": False, "message": str(e), "modules": []}), 500


@module_routes.route("/update-module", methods=["POST"])
def update_module():
    """
    Updates module information (title, date, description)
    """
    try:
        module_data = request.json
        if not module_data or "id" not in module_data:
            return jsonify({"success": False, "message": "Module ID is required"}), 400
        
        module_id = module_data.get("id")
        
        # Load existing modules
        modules_file = os.path.join(DATABASE_FOLDER, "modules.json")
        modules = load_json_file(modules_file, [])
        
        # Find the module to update
        module_index = None
        for i, module in enumerate(modules):
            if module.get("id") == module_id:
                module_index = i
                break
        
        if module_index is None:
            return jsonify({"success": False, "message": f"Module with ID {module_id} not found"}), 404
        
        # Update module properties, preserving any that aren't in the request
        updatable_fields = ["title", "date", "description", "subtitle", "icon", "topicId"]
        for field in updatable_fields:
            if field in module_data:
                modules[module_index][field] = module_data[field]
        
        # Save the updated modules back to file
        if save_json_file(modules_file, modules):
            return jsonify({
                "success": True,
                "message": "Module updated successfully",
                "module": modules[module_index]
            })
        else:
            return jsonify({"success": False, "message": "Failed to save module data"}), 500
        
    except Exception as e:
        logger.error(f"Error updating module: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@module_routes.route("/create-module", methods=["POST"])
def create_module():
    """
    Creates a new module
    """
    try:
        module_data = request.json
        if not module_data or "title" not in module_data:
            return jsonify({"success": False, "message": "Module title is required"}), 400
        
        # Load existing modules
        modules_file = os.path.join(DATABASE_FOLDER, "modules.json")
        modules = load_json_file(modules_file, [])
        
        # Generate a new module ID
        new_id = module_data.get("id")
        if not new_id:
            # Generate an ID based on title if not provided
            base_id = f"module-{len(modules) + 1}"
            new_id = base_id
            
            # Ensure ID is unique
            existing_ids = [m.get("id") for m in modules]
            counter = 1
            while new_id in existing_ids:
                new_id = f"{base_id}-{counter}"
                counter += 1
        
        # Create the new module object
        new_module = {
            "id": new_id,
            "title": module_data.get("title"),
            "date": module_data.get("date", ""),
            "description": module_data.get("description", ""),
            "topicId": module_data.get("topicId", "topic-1")  # Default to topic-1 if not specified
        }
        
        # Add optional fields if provided
        if "subtitle" in module_data:
            new_module["subtitle"] = module_data["subtitle"]
        
        if "icon" in module_data:
            new_module["icon"] = module_data["icon"]
        
        # Add the new module to the list
        modules.append(new_module)
        
        # Save the updated modules back to file
        if save_json_file(modules_file, modules):
            return jsonify({
                "success": True,
                "message": "Module created successfully",
                "module": new_module
            })
        else:
            return jsonify({"success": False, "message": "Failed to save module data"}), 500
        
    except Exception as e:
        logger.error(f"Error creating module: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@module_routes.route("/delete-module/<module_id>", methods=["DELETE"])
def delete_module(module_id):
    """
    Deletes a module by ID
    """
    try:
        if not module_id:
            return jsonify({"success": False, "message": "Module ID is required"}), 400
        
        # Load existing modules
        modules_file = os.path.join(DATABASE_FOLDER, "modules.json")
        modules = load_json_file(modules_file, [])
        
        # Find the module to delete
        module_index = None
        for i, module in enumerate(modules):
            if module.get("id") == module_id:
                module_index = i
                break
        
        if module_index is None:
            return jsonify({"success": False, "message": f"Module with ID {module_id} not found"}), 404
        
        # Remove the module
        deleted_module = modules.pop(module_index)
        
        # Save the updated modules back to file
        if save_json_file(modules_file, modules):
            return jsonify({
                "success": True,
                "message": "Module deleted successfully",
                "deleted_module": deleted_module
            })
        else:
            return jsonify({"success": False, "message": "Failed to save module data"}), 500
        
    except Exception as e:
        logger.error(f"Error deleting module: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@module_routes.route("/topics/update", methods=["POST"])
def update_topic():
    """
    Updates topic information (name, description)
    """
    try:
        # Log received request
        logger.info("Topics update endpoint called")
        
        # Get request data
        topic_data = request.json
        logger.info(f"Received data for topic update: {topic_data}")
        
        topic_id = topic_data.get('id')
        if not topic_id:
            logger.error("Error: Topic ID is missing")
            return jsonify({"success": False, "error": "Topic ID is required"}), 400
        
        # Get file path and verify it exists
        topics_file = os.path.join(DATABASE_FOLDER, "topics.json")
        if not os.path.exists(topics_file):
            logger.error(f"Error: topics.json file not found at {topics_file}")
            return jsonify({"success": False, "error": "Topics file not found"}), 404
            
        # Explicitly load topics file with UTF-8 encoding
        with open(topics_file, 'r', encoding='utf-8') as f:
            topics = json.load(f)
            logger.info(f"Successfully loaded topics from {topics_file}")
            
        # Find and update the topic
        topic_found = False
        topic_updated = False
        
        for topic in topics:
            if topic.get('id') == topic_id:
                logger.info(f"Found topic with ID {topic_id}")
                topic_found = True
                
                # Update name if provided
                if 'name' in topic_data:
                    old_name = topic.get('name', '')
                    topic['name'] = topic_data['name']
                    logger.info(f"Updated topic name from '{old_name}' to '{topic_data['name']}'")
                    topic_updated = True
                    
                # Update description if provided
                if 'description' in topic_data:
                    topic['description'] = topic_data['description']
                    logger.info(f"Updated topic description")
                    topic_updated = True
                
                break
                
        if not topic_found:
            logger.error(f"Topic with ID {topic_id} not found")
            return jsonify({"success": False, "error": f"Topic with ID {topic_id} not found"}), 404
            
        if not topic_updated:
            logger.warning("No changes were made to the topic")
            return jsonify({"success": False, "error": "No changes provided"}), 400
            
        # Explicitly save with UTF-8 encoding and ensure_ascii=False
        with open(topics_file, 'w', encoding='utf-8') as f:
            json.dump(topics, f, indent=2, ensure_ascii=False)
        logger.info(f"Successfully saved updated topics to {topics_file}")
            
        return jsonify({"success": True, "message": f"Topic {topic_id} updated successfully"})
        
    except Exception as e:
        logger.error(f"Unexpected error in update_topic: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500 