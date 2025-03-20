from flask import Flask, request, jsonify
#from flask_cors import CORS

app = Flask(__name__)
#CORS(app)  # Enable CORS for React frontend

@app.route('/generate-quiz')
def generate_quiz():
    return {"quiz": ["Quiz"]}

if __name__ == '__main__':
    app.run(debug=True)
