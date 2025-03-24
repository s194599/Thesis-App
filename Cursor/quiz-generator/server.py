from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from localllm import extract_text_from_pdf, generate_quiz

app = Flask(__name__)
CORS(app)

# File upload configurations
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz_endpoint():
    try:
        # Get uploaded files
        files = request.files.getlist('files')
        
        if not files:
            return jsonify({
                "error": "No files provided. Please upload at least one PDF file."
            }), 400

        combined_text = ""

        # Process uploaded files
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                # Extract text from PDF
                text = extract_text_from_pdf(filepath)
                combined_text += text + "\n\n"
                
                # Clean up the uploaded file
                os.remove(filepath)

        if not combined_text.strip():
            return jsonify({
                "error": "No valid text content found in the provided PDFs."
            }), 400

        # Generate quiz
        quiz_text = generate_quiz(combined_text)

        # Parse the quiz text into a structured format
        questions = parse_quiz_text(quiz_text)

        return jsonify({
            "success": True,
            "quiz": {
                "title": "Generated Quiz",
                "description": f"Quiz generated from {len(files)} PDF file(s)",
                "questions": questions
            }
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

def parse_quiz_text(quiz_text):
    """Parse the raw quiz text into structured format"""
    questions = []
    current_question = None
    
    for line in quiz_text.split('\n'):
        line = line.strip()
        if not line:
            continue
            
        if line.startswith('[Question]'):
            if current_question:
                questions.append(current_question)
            current_question = {
                'id': len(questions) + 1,
                'question': line.replace('[Question]', '').strip(),
                'options': [],
                'correctAnswer': None,
                'explanation': ''
            }
        elif current_question and line.startswith(('A)', 'B)', 'C)', 'D)')):
            option = line[2:].strip()
            current_question['options'].append(option)
        elif current_question and line.startswith('Correct answer:'):
            answer_letter = line.split(':')[1].strip()
            if answer_letter in ['A', 'B', 'C', 'D']:
                answer_index = ord(answer_letter) - ord('A')
                if 0 <= answer_index < len(current_question['options']):
                    current_question['correctAnswer'] = current_question['options'][answer_index]

    if current_question:
        questions.append(current_question)

    return questions

if __name__ == '__main__':
    app.run(port=5001, debug=True) 