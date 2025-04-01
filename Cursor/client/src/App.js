import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './styles/platform.css';

import Header from './components/AppHeader';
import PlatformOverview from './components/PlatformOverview';
import SavedQuizzes from './components/SavedQuizzes';
import TakeQuiz from './components/TakeQuiz';
import { PlatformProvider } from './context/PlatformContext';

function App() {
  return (
    <div className="App d-flex flex-column min-vh-100">
      <PlatformProvider>
        <Header />
        <div className="flex-grow-1">
          <Routes>
            {/* Platform Overview (new home page) */}
            <Route path="/" element={<PlatformOverview />} />
            
            {/* Saved quizzes page */}
            <Route path="/saved-quizzes" element={<SavedQuizzes />} />
            
            {/* Take a quiz page */}
            <Route path="/take-quiz/:quizId" element={<TakeQuiz />} />
            
            {/* Redirect any unknown paths to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </PlatformProvider>
    </div>
  );
}

export default App;
