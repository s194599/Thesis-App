from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import json
import requests
from werkzeug.utils import secure_filename
from localllm import extract_text_from_pdf, generate_quiz

app = Flask(__name__)
# Enable CORS for all domains on all routes - necessary for local development
CORS(app, resources={r"/*": {"origins": "*"}})

# File upload configurations
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'doc', 'docx'}

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def check_ollama_availability():
    """Check if Ollama is running and available"""
    OLLAMA_API = "http://localhost:11434/api/generate"
    try:
        # Simple test prompt
        payload = {
            "model": "mistral",
            "prompt": "test",
            "stream": False
        }
        response = requests.post(OLLAMA_API, json=payload, timeout=5)
        return response.status_code == 200
    except:
        return False

@app.route('/api/status', methods=['GET'])
def api_status():
    """Check API status and Ollama availability"""
    ollama_available = check_ollama_availability()
    
    return jsonify({
        "status": "online",
        "ollama_available": ollama_available,
        "message": "Ollama is not running. Start it with 'ollama serve'" if not ollama_available else "All systems operational"
    })

@app.route('/api/upload-file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Extract text from the uploaded file
        try:
            if filename.endswith('.pdf'):
                text = extract_text_from_pdf(filepath)
            elif filename.endswith('.txt'):
                with open(filepath, 'r', encoding='utf-8') as f:
                    text = f.read()
            else:
                # For doc and docx, you would need additional libraries like python-docx
                # For simplicity, we're returning an error for now
                return jsonify({"error": "Doc/docx processing not implemented yet"}), 501
            
            return jsonify({"filename": filename, "content": text})
        except Exception as e:
            return jsonify({"error": f"Error processing file: {str(e)}"}), 500
    
    return jsonify({"error": "File type not allowed"}), 400

@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz_endpoint():
    # First check if Ollama is available
    if not check_ollama_availability():
        return jsonify({
            "error": "Ollama LLM service is not available. Please start Ollama with 'ollama serve' command.",
            "code": "OLLAMA_UNAVAILABLE"
        }), 503
    
    data = request.json
    
    try:
        content = data.get('content', '')
        num_questions = int(data.get('num_questions', 5))
        model = data.get('model', 'mistral')  # Default to mistral model
        language = data.get('language', 'danish')  # Get language preference
        student_level = data.get('studentLevel', 'highSchool')  # Get student level
        
        # Validate input
        if not content:
            return jsonify({"error": "No content provided"}), 400
        
        # Customize prompt based on language and student level
        additional_instructions = data.get('additionalInstructions', '')
        
        # Generate quiz using the local LLM
        quiz_text = generate_quiz(
            content, 
            num_questions=num_questions,
            model=model,
            language=language, 
            student_level=student_level
        )
        
        # Parse the generated quiz into a structured format
        structured_quiz = parse_quiz_text(quiz_text, language)
        
        return jsonify(structured_quiz)
    
    except Exception as e:
        app.logger.error(f"Error generating quiz: {str(e)}")
        return jsonify({"error": f"Failed to generate quiz: {str(e)}"}), 500

@app.route('/api/fetch-url', methods=['POST'])
def fetch_url():
    # This would use a library like BeautifulSoup or requests to fetch webpage content
    # For now, returning a simple response
    return jsonify({"content": "URL content would be fetched here"})

def parse_quiz_text(quiz_text, language="danish"):
    """
    Parse the raw quiz text from the LLM into a structured quiz format
    """
    lines = quiz_text.strip().split('\n')
    
    # Initialize quiz structure
    quiz = {
        "title": f"Generated Quiz ({language.capitalize()})",
        "description": "Quiz generated based on provided content",
        "questions": []
    }
    
    current_question = None
    options = []
    correct_answer = None
    
    # Check if we have any content to parse
    if not lines or len(lines) < 4:  # Need at least one question with options
        # Return a basic structure with an error question
        error_question = {
            "id": "q1",
            "question": "Error: The AI model did not generate a proper quiz format.",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "Option 1",
            "explanation": "Please try again with different content or adjust your request."
        }
        quiz["questions"].append(error_question)
        return quiz
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
        
        # Check if this is a question line - any line that's not an option or correct answer indication
        if not (line.startswith(('A)', 'B)', 'C)', 'D)')) or line.lower().startswith('correct answer')):
            
            # If we already have a question, save it before starting a new one
            if current_question and options and len(options) >= 2:
                # If no correct answer was specified, use the first option as default
                if not correct_answer:
                    correct_answer = options[0]
                
                question_obj = {
                    "id": f"q{len(quiz['questions']) + 1}",
                    "question": current_question,
                    "options": options,
                    "correctAnswer": correct_answer,
                    "explanation": ""  # The LLM doesn't provide explanations by default
                }
                quiz['questions'].append(question_obj)
            
            # Start a new question
            current_question = line
            options = []
            correct_answer = None
        
        # Parse options - look for patterns like A), B), etc.
        elif any(line.startswith(f"{letter})") for letter in ['A', 'B', 'C', 'D']):
            # Extract the option letter and text
            option_parts = line.split(')', 1)
            if len(option_parts) > 1:
                option_text = option_parts[1].strip()
                options.append(option_text)
        
        # Parse correct answer - look for variations like "Correct answer: A" or "The correct answer is B"
        elif ("correct answer" in line.lower() or "right answer" in line.lower()):
            # Find the answer letter in the line
            for letter in ['A', 'B', 'C', 'D']:
                if letter in line:
                    # Convert letter to option index (A->0, B->1, etc.)
                    answer_index = ord(letter) - ord('A')
                    if 0 <= answer_index < len(options):
                        correct_answer = options[answer_index]
                    break
    
    # Don't forget to add the last question
    if current_question and options and len(options) >= 2:
        # If no correct answer was specified, use the first option as default
        if not correct_answer:
            correct_answer = options[0]
            
        question_obj = {
            "id": f"q{len(quiz['questions']) + 1}",
            "question": current_question,
            "options": options,
            "correctAnswer": correct_answer,
            "explanation": ""
        }
        quiz['questions'].append(question_obj)
    
    # If we didn't parse any questions, add a default error question
    if not quiz["questions"]:
        error_question = {
            "id": "q1",
            "question": "Error: Could not parse any questions from the AI response.",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "Option 1",
            "explanation": "The AI response didn't match the expected format. Here's what was returned: " + 
                        (quiz_text[:200] + "..." if len(quiz_text) > 200 else quiz_text)
        }
        quiz["questions"].append(error_question)
    
    return quiz

if __name__ == '__main__':
    # Using port 5001 instead of 5000 to avoid conflicts with AirPlay on macOS
    PORT = 5001
    print(f"Server running on http://localhost:{PORT}")
    print("API endpoints:")
    print("- GET /api/status - Check API and Ollama status")
    print("- POST /api/upload-file - Upload a file for processing")
    print("- POST /api/generate-quiz - Generate a quiz from provided content")
    print("- POST /api/fetch-url - Fetch content from a URL")
    print("\nPress Ctrl+C to stop the server")
    app.run(debug=True, port=PORT, host='0.0.0.0')
