from flask import Blueprint, request, jsonify
import os
import json

from config.app_config import MODULES_FOLDER, ACTIVITIES_FOLDER, logger
from utils.file_helpers import load_json_file, save_json_file

# Create blueprint for module-related routes
module_routes = Blueprint("module_routes", __name__)


@module_routes.route("/modules", methods=["GET"])
def get_modules():
    """
    Retrieves all modules from the server
    """
    try:
        modules_file = os.path.join(MODULES_FOLDER, "modules.json")
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
        modules_file = os.path.join(MODULES_FOLDER, "modules.json")
        modules = load_json_file(modules_file, [])
        
        # Load all activities
        activities_file = os.path.join(ACTIVITIES_FOLDER, "activities.json")
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
        modules_file = os.path.join(MODULES_FOLDER, "modules.json")
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
        updatable_fields = ["title", "date", "description", "subtitle"]
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