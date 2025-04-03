import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";
import {
  InputTypeSelector,
  QuizInputSection,
  QuestionTypeSelector,
  StudentLevelSelector,
  LanguageSelector,
  NumQuestionsSelector,
} from "./";
import { LoadingSpinner } from "../../common";
import { QuizOutput } from "../../quiz/display";
import {
  generateQuiz,
  uploadFiles,
  fetchUrlContent,
} from "../../../services/api";
import { Link } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";

const QuizForm = () => {
  const {
    formData,
    loading,
    setLoading,
    setGeneratedQuiz,
    error,
    setError,
    generatedQuiz,
    updateFormData,
    loadSampleQuiz,
  } = useQuizContext();

  // Effect to scroll to loading spinner when loading state changes to true
  useEffect(() => {
    if (loading) {
      // Small delay to ensure the loading spinner is rendered
      setTimeout(() => {
        const loadingElement = document.getElementById(
          "loading-spinner-section"
        );
        if (loadingElement) {
          loadingElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
  }, [loading]);

  // Local state for form validation
  const [validated, setValidated] = useState(false);

  // Check if form is valid for submission
  const isFormValid = () => {
    switch (formData.inputType) {
      case "topic":
        return formData.topic.trim() !== "";
      case "text":
        return formData.text.trim() !== "";
      case "webpage":
        return formData.url.trim() !== "";
      case "document":
        return formData.files && formData.files.length > 0;
      default:
        return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark form as validated to show validation errors
    setValidated(true);

    if (!isFormValid()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If using sample quiz, load it directly
      if (formData.useSampleQuiz) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for UX
        loadSampleQuiz();
        return;
      }

      // Otherwise, use the backend API
      let contentToProcess = "";

      // Process different input types
      switch (formData.inputType) {
        case "topic":
          contentToProcess = formData.topic;
          break;

        case "text":
          contentToProcess = formData.text;
          break;

        case "webpage":
          // Fetch webpage content from the backend
          try {
            const urlData = await fetchUrlContent(formData.url);
            contentToProcess = urlData.content;
            console.log("contentToProcess", contentToProcess);
          } catch (urlError) {
            throw new Error(
              `Failed to fetch webpage content: ${urlError.message}`
            );
          }
          break;

        case "document":
          // Upload files to the backend
          if (formData.files && formData.files.length > 0) {
            try {
              const filesData = await uploadFiles(formData.files);
              contentToProcess = filesData.combinedContent || "";
              if (!contentToProcess) {
                throw new Error(
                  "No content was extracted from the uploaded files."
                );
              }
            } catch (fileError) {
              // Check if this is a transcription error
              if (fileError.message.includes("Video transcription failed")) {
                throw new Error(
                  `${fileError.message}. Please check that your video file is valid and try again.`
                );
              }
              throw new Error(
                `Failed to process uploaded files: ${fileError.message}`
              );
            }
          }
          break;

        default:
          throw new Error("Invalid input type");
      }

      // Check if we have content to process
      if (!contentToProcess || contentToProcess.trim() === "") {
        throw new Error(
          "No content was extracted for quiz generation. Please try again with different input."
        );
      }

      // Prepare data for quiz generation
      const quizRequestData = {
        content: contentToProcess,
        inputType: formData.inputType,
        questionType: formData.questionType,
        studentLevel: formData.studentLevel,
        additionalInstructions: formData.additionalInstructions,
        language: formData.language,
        numQuestions: formData.numQuestions,
        quizTitle: formData.quizTitle || "Quiz",
      };

      // Send to backend for quiz generation
      const generatedQuizData = await generateQuiz(quizRequestData);

      // Check if the request was canceled
      if (generatedQuizData && generatedQuizData.canceled) {
        // Request was canceled, do nothing further
        return;
      }

      // Ensure the generated quiz has the title from the form data
      const finalQuizData = {
        ...generatedQuizData,
        title: formData.quizTitle || "Quiz",
      };

      // Update the state with the generated quiz
      setGeneratedQuiz(finalQuizData);
    } catch (err) {
      console.error("Error generating quiz:", err);
      setError(
        err.message || "Failed to generate quiz. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Show quiz output if generated, otherwise show form */}
      {generatedQuiz ? (
        <QuizOutput />
      ) : (
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          {/* Display error message if any */}
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Input type selection */}
          <InputTypeSelector />

          {/* Quiz input section (changes based on selected input type) */}
          <QuizInputSection />

          {/* Question type selection */}
          <QuestionTypeSelector />

          <hr className="my-4" />

          <div className="row">
            <div className="col-md-4">
              {/* Student level selection */}
              <StudentLevelSelector />
            </div>
            <div className="col-md-4">
              {/* Number of questions selection */}
              <NumQuestionsSelector />
            </div>
            <div className="col-md-4">
              {/* Language selection */}
              <LanguageSelector />
            </div>
          </div>

          {/* Additional instructions */}
          <div className="mb-4">
            <Form.Group>
              <Form.Label className="fw-bold">
                Additional Instructions (Optional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter any special instructions for quiz generation (e.g., 'Focus on comprehension', 'Include application-based questions')"
                value={formData.additionalInstructions}
                onChange={(e) =>
                  updateFormData("additionalInstructions", e.target.value)
                }
              />
            </Form.Group>
          </div>

          {/* Sample Quiz Toggle */}
          <div className="mb-4">
            <Form.Check
              type="switch"
              id="sample-quiz-toggle"
              label="Use sample quiz (bypass AI generation)"
              checked={formData.useSampleQuiz}
              onChange={(e) =>
                updateFormData("useSampleQuiz", e.target.checked)
              }
              className="mb-2"
            />
            <Form.Text className="text-muted">
              Toggle this option to quickly test with a sample quiz instead of
              using the AI model.
            </Form.Text>
          </div>

          {/* Submit button */}
          <div className="d-grid gap-2 mt-4">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading || !isFormValid()}
            >
              {formData.useSampleQuiz
                ? "Generate Sample Quiz"
                : "Generate Quiz"}
            </Button>
          </div>

          {/* Loading spinner */}
          <LoadingSpinner loading={loading} />
        </Form>
      )}
    </div>
  );
};

export default QuizForm;
