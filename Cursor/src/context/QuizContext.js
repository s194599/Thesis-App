import React, { createContext, useState, useContext } from 'react';

const QuizContext = createContext();

export const useQuizContext = () => useContext(QuizContext);

// Sample quiz data for development
const sampleQuiz = {
  title: "Biology Quiz",
  description: "Test your knowledge of basic biology concepts",
  questions: [
    {
      id: "q1",
      question: "What is the green pigment in plants that absorbs sunlight called?",
      options: ["Chlorophyll", "Carotene", "Xanthophyll", "Melanin"],
      correctAnswers: ["Chlorophyll"], // Now using an array for multiple correct answers
      explanation: "Chlorophyll is the green pigment in plants that captures sunlight for photosynthesis."
    },
    {
      id: "q2",
      question: "What is the process by which plants make their own food using sunlight?",
      options: ["Photosynthesis", "Respiration", "Transpiration", "Germination"],
      correctAnswers: ["Photosynthesis"], // Now using an array for multiple correct answers
      explanation: "Photosynthesis is the process where plants convert light energy into chemical energy to fuel their activities."
    },
    {
      id: "q3",
      question: "Which organelle is known as the 'powerhouse' of the cell?",
      options: ["Mitochondria", "Nucleus", "Chloroplast", "Endoplasmic reticulum"],
      correctAnswers: ["Mitochondria"], // Now using an array for multiple correct answers
      explanation: "Mitochondria generate most of the cell's supply of ATP, used as a source of chemical energy."
    },
    {
      id: "q4",
      question: "Which of the following are components of a plant cell?",
      options: ["Cell wall", "Chloroplast", "Mitochondria", "Central vacuole"],
      correctAnswers: ["Cell wall", "Chloroplast", "Mitochondria", "Central vacuole"], // Multiple correct answers
      explanation: "Plant cells have all of these structures. Cell walls provide structure, chloroplasts perform photosynthesis, mitochondria produce energy, and central vacuoles store water and nutrients."
    }
  ]
};

export const QuizProvider = ({ children }) => {
  // Main form state
  const [formData, setFormData] = useState({
    inputType: 'topic',         // topic, text, webpage, document
    topic: '',                  // Used when inputType is 'topic'
    text: '',                   // Used when inputType is 'text'
    url: '',                    // Used when inputType is 'webpage'
    files: [],                  // Used when inputType is 'document' - now an array for multiple files
    questionType: 'multipleChoice', // multipleChoice, trueFalse, shortAnswer
    studentLevel: 'highSchool', // studentLevel (optional)
    additionalInstructions: '', // Additional instructions (optional)
    language: 'danish',         // Output language
  });

  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Generated quiz state - initialized with sample quiz for development
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  
  // Editing state - separate from the generated quiz
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  // Editing mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Loading state for AI question generation
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);

  // Handler to update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Start editing a quiz
  const startEditing = () => {
    // Create a deep copy of the generated quiz for editing
    setEditingQuiz(JSON.parse(JSON.stringify(generatedQuiz || sampleQuiz)));
    setIsEditing(true);
  };

  // Update a question in the editing quiz
  const updateQuestion = (questionId, field, value) => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  // Update an option in a question
  const updateOption = (questionId, optionIndex, value) => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          
          // If an option that's a correct answer is changed, update correctAnswers array
          if (q.correctAnswers && q.correctAnswers.includes(q.options[optionIndex])) {
            const updatedCorrectAnswers = q.correctAnswers.map(ca => 
              ca === q.options[optionIndex] ? value : ca
            );
            return { ...q, options: newOptions, correctAnswers: updatedCorrectAnswers };
          }
          
          return { ...q, options: newOptions };
        }
        return q;
      })
    }));
  };

  // Update the correct answers for a question
  const updateCorrectAnswers = (questionId, correctAnswers) => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, correctAnswers } : q
      )
    }));
  };

  // Toggle an option as correct/incorrect
  const toggleCorrectAnswer = (questionId, option) => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          // If this option is already in correctAnswers, remove it
          // Otherwise, add it
          let newCorrectAnswers;
          
          if (!q.correctAnswers) {
            // Backward compatibility - convert old format to new
            newCorrectAnswers = q.correctAnswer === option ? [] : [option];
          } else if (q.correctAnswers.includes(option)) {
            newCorrectAnswers = q.correctAnswers.filter(a => a !== option);
          } else {
            newCorrectAnswers = [...q.correctAnswers, option];
          }
          
          // Ensure at least one correct answer
          if (newCorrectAnswers.length === 0) {
            newCorrectAnswers = [option];
          }
          
          return { ...q, correctAnswers: newCorrectAnswers };
        }
        return q;
      })
    }));
  };

  // Add a new question manually
  const addQuestionManually = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      question: "New Question",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswers: ["Option 1"],
      explanation: "Add explanation here"
    };
    
    setEditingQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  // Generate a new question with AI
  const generateQuestion = async () => {
    setGeneratingQuestion(true);
    try {
      // Mock API call - in reality, this would call your backend
      // await api.generateAdditionalQuestion(formData);
      
      // For now, let's just simulate a delay and add a mock question
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newQuestion = {
        id: `q${Date.now()}`,
        question: "AI Generated Question: Which of the following are true about DNA?",
        options: [
          "It stores genetic information", 
          "It is a double helix structure", 
          "It is made of amino acids", 
          "It is found only in animals"
        ],
        correctAnswers: ["It stores genetic information", "It is a double helix structure"],
        explanation: "DNA (deoxyribonucleic acid) stores genetic information and has a double helix structure. It is made of nucleotides, not amino acids, and is found in all living organisms, not just animals."
      };
      
      setEditingQuiz(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
    } catch (err) {
      setError('Failed to generate a new question');
      console.error(err);
    } finally {
      setGeneratingQuestion(false);
    }
  };

  // Delete a question
  const deleteQuestion = (questionId) => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  // Save the edited quiz
  const saveQuiz = () => {
    setGeneratedQuiz(editingQuiz);
    setIsEditing(false);
    // Here you would typically send the quiz to your backend
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditingQuiz(null);
  };

  // Reset the form data
  const resetForm = () => {
    setFormData({
      inputType: 'topic',
      topic: '',
      text: '',
      url: '',
      files: [],
      questionType: 'multipleChoice',
      studentLevel: 'highSchool',
      additionalInstructions: '',
      language: 'danish',
    });
    setGeneratedQuiz(null);
    setEditingQuiz(null);
    setIsEditing(false);
    setError(null);
  };

  // For demo purposes - initialize with sample quiz
  const loadSampleQuiz = () => {
    setGeneratedQuiz(sampleQuiz);
  };

  return (
    <QuizContext.Provider
      value={{
        formData,
        updateFormData,
        loading,
        setLoading,
        generatedQuiz,
        setGeneratedQuiz,
        editingQuiz,
        isEditing,
        startEditing,
        updateQuestion,
        updateOption,
        updateCorrectAnswers,
        toggleCorrectAnswer,
        addQuestionManually,
        generateQuestion,
        deleteQuestion,
        saveQuiz,
        cancelEditing,
        generatingQuestion,
        error,
        setError,
        resetForm,
        loadSampleQuiz
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export default QuizProvider; 