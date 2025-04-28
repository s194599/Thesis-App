from flask import Blueprint, request, jsonify, current_app
import os
import json
import uuid
import base64
from datetime import datetime
import re

# Create blueprint
forum_routes = Blueprint('forum_routes', __name__)

# Define path to forum data
FORUM_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'forum')
os.makedirs(FORUM_DIR, exist_ok=True)

# Define path for forum images
FORUM_IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'images', 'forum')
os.makedirs(FORUM_IMAGES_DIR, exist_ok=True)

# Helper function to save an image from base64 data
def save_image_from_base64(base64_data, module_id):
    # Check if the data is actually base64
    if not base64_data or not isinstance(base64_data, str):
        return None
    
    # Extract the actual base64 data (remove the data:image/jpeg;base64, prefix)
    if ',' in base64_data:
        _, base64_data = base64_data.split(',', 1)
    
    try:
        # Decode base64 data
        image_data = base64.b64decode(base64_data)
        
        # Generate a unique filename
        image_filename = f"{module_id}_{str(uuid.uuid4())}.jpg"
        image_path = os.path.join(FORUM_IMAGES_DIR, image_filename)
        
        # Save the image file
        with open(image_path, 'wb') as f:
            f.write(image_data)
        
        # Return the relative URL to the image
        return f"/static/images/forum/{image_filename}"
    except Exception as e:
        print(f"Error saving image: {str(e)}")
        return None

# Helper function to get all forum posts for a specific module
def get_forum_posts(module_id):
    file_path = os.path.join(FORUM_DIR, f'{module_id}.json')
    
    if not os.path.exists(file_path):
        # Create empty file if it doesn't exist
        with open(file_path, 'w') as f:
            json.dump([], f)
        return []
    
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading forum posts: {str(e)}")
        return []

# Helper function to save forum posts
def save_forum_posts(module_id, posts):
    file_path = os.path.join(FORUM_DIR, f'{module_id}.json')
    
    try:
        with open(file_path, 'w') as f:
            json.dump(posts, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving forum posts: {str(e)}")
        return False

# Get all forum posts for a module
@forum_routes.route('/forum/<module_id>', methods=['GET'])
def get_module_forum_posts(module_id):
    posts = get_forum_posts(module_id)
    return jsonify(posts)

# Create a new forum post
@forum_routes.route('/forum/<module_id>/post', methods=['POST'])
def create_forum_post(module_id):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['authorName', 'postTitle', 'bodyText', 'profilePictureUrl']
        for field in required_fields:
            if field not in data and field != 'profilePictureUrl':
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if there's an image attachment
        image_url = None
        if 'imageAttachment' in data and data['imageAttachment']:
            image_url = save_image_from_base64(data['imageAttachment'], module_id)
        
        # Create new post with timestamp and ID
        new_post = {
            'id': str(uuid.uuid4()),
            'authorName': data['authorName'],
            'postTitle': data['postTitle'],
            'bodyText': data['bodyText'],
            'profilePictureUrl': data.get('profilePictureUrl', ''),
            'timestamp': datetime.now().isoformat(),
            'comments': [],
            'moduleId': module_id
        }
        
        # Add image URL if available
        if image_url:
            new_post['imageAttachment'] = image_url
        
        # Get existing posts and add the new one
        posts = get_forum_posts(module_id)
        posts.append(new_post)
        
        # Save updated posts
        if save_forum_posts(module_id, posts):
            return jsonify(new_post), 201
        else:
            return jsonify({'error': 'Failed to save post'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add a comment to a forum post
@forum_routes.route('/forum/<module_id>/post/<post_id>/comment', methods=['POST'])
def add_comment(module_id, post_id):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['authorName', 'bodyText']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if there's an image attachment
        image_url = None
        if 'imageAttachment' in data and data['imageAttachment']:
            image_url = save_image_from_base64(data['imageAttachment'], module_id)
        
        # Create new comment
        new_comment = {
            'id': str(uuid.uuid4()),
            'authorName': data['authorName'],
            'bodyText': data['bodyText'],
            'profilePictureUrl': data.get('profilePictureUrl', ''),
            'timestamp': datetime.now().isoformat()
        }
        
        # Add image URL if available
        if image_url:
            new_comment['imageAttachment'] = image_url
        
        # Get existing posts
        posts = get_forum_posts(module_id)
        
        # Find the post and add the comment
        post_found = False
        for post in posts:
            if post['id'] == post_id:
                post.setdefault('comments', []).append(new_comment)
                post_found = True
                break
        
        if not post_found:
            return jsonify({'error': 'Post not found'}), 404
        
        # Save updated posts
        if save_forum_posts(module_id, posts):
            return jsonify(new_comment), 201
        else:
            return jsonify({'error': 'Failed to save comment'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete a forum post
@forum_routes.route('/forum/<module_id>/post/<post_id>', methods=['DELETE'])
def delete_forum_post(module_id, post_id):
    try:
        # Get existing posts
        posts = get_forum_posts(module_id)
        
        # Find and remove the post
        post_found = False
        filtered_posts = []
        for post in posts:
            if post['id'] == post_id:
                post_found = True
            else:
                filtered_posts.append(post)
        
        if not post_found:
            return jsonify({'error': 'Post not found'}), 404
        
        # Save updated posts
        if save_forum_posts(module_id, filtered_posts):
            return jsonify({'message': 'Post deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to save changes'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500 