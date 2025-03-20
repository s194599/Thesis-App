from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    data = request.json
    num_questions = data.get("num_questions", 10)
    return jsonify({"message": f"Generated {num_questions} quiz questions."})

if __name__ == '__main__':
    app.run(debug=True)
