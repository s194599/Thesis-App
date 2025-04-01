import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import SavedQuizzes from './components/SavedQuizzes';
import TakeQuiz from './components/TakeQuiz';
import QuizForm from './components/QuizForm';
import QuizOutput from './components/QuizOutput';
import { useQuizContext } from './context/QuizContext';

function App() {
  const { generatedQuiz } = useQuizContext();
  
  return (
    <div className="App d-flex flex-column min-vh-100">
      <Header />
      <div className="flex-grow-1">
        <Routes>
          {/* Landing page (new home page) */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Saved quizzes page */}
          <Route path="/saved-quizzes" element={<SavedQuizzes />} />
          
          {/* Take a quiz page */}
          <Route path="/take-quiz/:quizId" element={<TakeQuiz />} />
          
          {/* Quiz creation page */}
          <Route 
            path="/create-quiz" 
            element={
              <div className="container mt-4">
                <div className="row justify-content-center">
                  <div className="col-lg-8">
                    <div className="card shadow">
                      <div className="card-body">
                        {!generatedQuiz && (
                          <h1 className="text-center mb-4 editable-title">
                            Create Quiz
                          </h1>
                        )}
                        <QuizForm />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } 
          />
          
          {/* Redirect any unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
