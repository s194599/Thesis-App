from flask import Blueprint, request, jsonify
import os
import json
import uuid
from datetime import datetime

# Create blueprint
forum_routes = Blueprint('forum_routes', __name__)

# Define path to forum data
FORUM_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'forum')
os.makedirs(FORUM_DIR, exist_ok=True)

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
        
        # Create new comment
        new_comment = {
            'id': str(uuid.uuid4()),
            'authorName': data['authorName'],
            'bodyText': data['bodyText'],
            'profilePictureUrl': data.get('profilePictureUrl', ''),
            'timestamp': datetime.now().isoformat()
        }
        
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