import React, { useState } from "react";
import axios from "axios";

function App() {
    const [numQuestions, setNumQuestions] = useState(10);
    const [response, setResponse] = useState("");

    const handleSubmit = async () => {
        try {
            const res = await axios.post("http://127.0.0.1:5000/generate-quiz", {
                num_questions: numQuestions,
            });
            setResponse(res.data.message);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div>
            <h1>Quiz Generator</h1>
            <input 
                type="number" 
                value={numQuestions} 
                onChange={(e) => setNumQuestions(e.target.value)}
            />
            <button onClick={handleSubmit}>Generate Quiz</button>
            <p>{response}</p>
        </div>
    );
}

export default App;
