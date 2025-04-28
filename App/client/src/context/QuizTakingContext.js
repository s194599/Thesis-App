import React, { createContext, useContext, useState } from 'react';

const QuizTakingContext = createContext();

export const useQuizTakingContext = () => useContext(QuizTakingContext);

export const QuizTakingProvider = ({ children }) => {
  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Start a new quiz session
  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers(new Array(quiz.questions.length).fill(null));
    setScore(0);
    setQuizCompleted(false);
  };
  
  // Record an answer for the current question
  const answerQuestion = (answer, isCorrect) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = {
      answer,
      isCorrect
    };
    setUserAnswers(newAnswers);
    
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }
  };
  
  // Move to the next question or finish quiz
  const nextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < activeQuiz.questions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      setQuizCompleted(true);
    }
  };
  
  // Reset the current quiz
  const resetQuiz = () => {
    if (activeQuiz) {
      startQuiz(activeQuiz);
    }
  };
  
  // Calculate the final score percentage
  const getScorePercentage = () => {
    if (!activeQuiz || activeQuiz.questions.length === 0) return 0;
    return Math.round((score / activeQuiz.questions.length) * 100);
  };
  
  return (
    <QuizTakingContext.Provider
      value={{
        activeQuiz,
        currentQuestionIndex,
        userAnswers,
        score,
        quizCompleted,
        startQuiz,
        answerQuestion,
        nextQuestion,
        resetQuiz,
        getScorePercentage
      }}
    >
      {children}
    </QuizTakingContext.Provider>
  );
};

export default QuizTakingProvider; 