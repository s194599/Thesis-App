import React, { createContext, useState, useContext } from "react";
import { cancelRequests } from "../services/api";
import { saveQuiz as saveQuizApi } from "../services/api";
import { toast } from "react-toastify";

const QuizContext = createContext();

export const useQuizContext = () => useContext(QuizContext);

// Sample quiz data for development
const sampleQuiz = {
  title: "Biology Quiz",
  description: "Test your knowledge of basic biology concepts",
  questions: [
    {
      id: "q1",
      question:
        "What is the green pigment in plants that absorbs sunlight called?",
      options: ["Chlorophyll", "Carotene", "Xanthophyll", "Melanin"],
      correctAnswer: "Chlorophyll",
      explanation:
        "Chlorophyll is the green pigment in plants that captures sunlight for photosynthesis.",
    },
    {
      id: "q2",
      question:
        "What is the process by which plants make their own food using sunlight?",
      options: [
        "Photosynthesis",
        "Respiration",
        "Transpiration",
        "Germination",
      ],
      correctAnswer: "Photosynthesis",
      explanation:
        "Photosynthesis is the process where plants convert light energy into chemical energy to fuel their activities.",
    },
    {
      id: "q3",
      question: "Which organelle is known as the 'powerhouse' of the cell?",
      options: [
        "Mitochondria",
        "Nucleus",
        "Chloroplast",
        "Endoplasmic reticulum",
      ],
      correctAnswer: "Mitochondria",
      explanation:
        "Mitochondria generate most of the cell's supply of ATP, used as a source of chemical energy.",
    },
  ],
};

export const QuizProvider = ({ children }) => {
  // Main form state
  const [formData, setFormData] = useState({
    inputType: "topic", // topic, text, document
    topic: "", // Used when inputType is 'topic'
    text: "", // Used when inputType is 'text'
    files: null, // Used when inputType is 'document' - now supports multiple files
    questionType: "multipleChoice", // multipleChoice, trueFalse, shortAnswer
    studentLevel: "highSchool", // studentLevel (optional)
    additionalInstructions: "", // Additional instructions (optional)
    language: "danish", // Output language
    numQuestions: 5, // Number of questions to generate (default: 5)
    useSampleQuiz: false, // Whether to use sample quiz instead of AI-generated quiz
    quizTitle: "Quiz", // Title for the quiz (default: "Quiz")
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

  // States for quiz saving
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handler to update form data
  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
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
    setEditingQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    }));
  };

  // Update an option in a question
  const updateOption = (questionId, optionIndex, value) => {
    setEditingQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      }),
    }));
  };

  // Update the correct answer for a question
  const updateCorrectAnswer = (questionId, value) => {
    setEditingQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, correctAnswer: value } : q
      ),
    }));
  };

  // Add a new question manually
  const addQuestionManually = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      question: "New Question",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "Option 1",
      explanation: "Add explanation here",
    };

    setEditingQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  // Generate a new question with AI
  const generateQuestion = async () => {
    setGeneratingQuestion(true);
    try {
      // Mock API call - in reality, this would call your backend
      // await api.generateAdditionalQuestion(formData);

      // For now, let's just simulate a delay and add a mock question
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newQuestion = {
        id: `q${Date.now()}`,
        question: "AI Generated Question: What is the main function of DNA?",
        options: [
          "Store genetic information",
          "Produce energy",
          "Break down nutrients",
          "Transport oxygen",
        ],
        correctAnswer: "Store genetic information",
        explanation:
          "DNA (deoxyribonucleic acid) stores genetic information in the form of genes.",
      };

      setEditingQuiz((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
      }));
    } catch (err) {
      setError("Failed to generate a new question");
      console.error(err);
    } finally {
      setGeneratingQuestion(false);
    }
  };

  // Delete a question
  const deleteQuestion = (questionId) => {
    setEditingQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
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
      inputType: "topic",
      topic: "",
      text: "",
      files: null,
      questionType: "multipleChoice",
      studentLevel: "highSchool",
      additionalInstructions: "",
      language: "danish",
      numQuestions: 5,
      useSampleQuiz: false,
      quizTitle: "Quiz",
    });
    setGeneratedQuiz(null);
    setEditingQuiz(null);
    setIsEditing(false);
    setError(null);
  };

  // For demo purposes - initialize with sample quiz
  const loadSampleQuiz = () => {
    // Create a copy of the sample quiz with the user's custom title
    const customizedSampleQuiz = {
      ...sampleQuiz,
      title: formData.quizTitle || "Quiz",
    };
    setGeneratedQuiz(customizedSampleQuiz);
  };

  // Cancel quiz generation
  const cancelQuizGeneration = () => {
    // Cancel any ongoing API requests
    cancelRequests();
    setLoading(false);
    setError(null);
    // We don't reset the form data or files to keep them available for another attempt
  };

  // Save the current quiz to backend
  const saveQuizToBackend = async () => {
    if (!generatedQuiz) {
      setError("No quiz to save");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      // Copy the quiz and ensure it has a title
      const quizToSave = {
        ...generatedQuiz,
        title: generatedQuiz.title || "Quiz",
        timestamp: new Date().toISOString(),
      };

      // Call the API to save the quiz
      const result = await saveQuizApi(quizToSave);

      // Update the quiz with the returned ID if needed
      if (result.quizId && !generatedQuiz.id) {
        setGeneratedQuiz({
          ...generatedQuiz,
          id: result.quizId,
        });
      }

      setSaveSuccess(true);

      // Show success notification
      if (toast) {
        toast.success("Quiz saved successfully!");
      } else {
        alert("Quiz saved successfully!");
      }

      return result;
    } catch (err) {
      console.error("Error saving quiz:", err);
      setError("Failed to save quiz. Please try again.");

      // Show error notification
      if (toast) {
        toast.error("Failed to save quiz. Please try again.");
      }

      return null;
    } finally {
      setIsSaving(false);
    }
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
        updateCorrectAnswer,
        addQuestionManually,
        generateQuestion,
        deleteQuestion,
        saveQuiz,
        cancelEditing,
        generatingQuestion,
        error,
        setError,
        resetForm,
        loadSampleQuiz,
        cancelQuizGeneration,
        saveQuizToBackend,
        isSaving,
        saveSuccess,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export default QuizProvider;
