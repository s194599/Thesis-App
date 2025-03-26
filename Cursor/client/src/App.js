import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import QuizForm from './components/QuizForm';
import { useQuizContext } from './context/QuizContext';

function App() {
  const { formData, updateFormData, generatedQuiz } = useQuizContext();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };
  
  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };
  
  const handleTitleChange = (e) => {
    updateFormData("quizTitle", e.target.value);
  };
  
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    }
  };
  
  return (
    <div className="App">
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-body">
                {!generatedQuiz && (
                  <>
                    {isEditingTitle ? (
                      <input
                        type="text"
                        className="form-control form-control-lg text-center mb-4"
                        value={formData.quizTitle}
                        onChange={handleTitleChange}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        autoFocus
                        placeholder="Enter quiz title"
                      />
                    ) : (
                      <h1 
                        className="text-center mb-4 editable-title" 
                        onClick={handleTitleClick}
                      >
                        {formData.quizTitle || "Click to add title"}
                        <span className="editable-title-hint">Click to edit</span>
                      </h1>
                    )}
                  </>
                )}
                <QuizForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
