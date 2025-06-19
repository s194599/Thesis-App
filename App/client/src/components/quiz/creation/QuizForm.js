import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";
import { useNavigate } from "react-router-dom";
import {
  InputTypeSelector,
  QuizInputSection,
  QuestionTypeSelector,
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
import { BsArrowLeft, BsTrophyFill } from "react-icons/bs";

const QuizForm = () => {
  const navigate = useNavigate();
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
    saveQuizToBackend,
  } = useQuizContext();

  // Reset form state when component mounts
  useEffect(() => {
    // Reset all form fields to their initial values
    updateFormData("quizTitle", "");
    updateFormData("inputType", "topic");
    updateFormData("topic", "");
    updateFormData("text", "");
    updateFormData("url", "");
    updateFormData("files", null);
    updateFormData("questionType", "multipleChoice");
    updateFormData("numQuestions", 5);
    updateFormData("language", "danish");
    updateFormData("additionalInstructions", "");
    updateFormData("useSampleQuiz", false);

    // Reset other state
    setGeneratedQuiz(null);
    setLoading(false);
    setError(null);
  }, []);

  // Effect to load pre-attached documents from module
  useEffect(() => {
    const quizDocuments = localStorage.getItem("quizDocuments");
    if (quizDocuments) {
      try {
        const { moduleId, moduleName, documents } = JSON.parse(quizDocuments);
        
        // Set a default quiz title based on the module name
        if (moduleName) {
          const titlePrefix = formData.questionType === "flashcards" ? "Flashcards" : "Quiz";
          updateFormData("quizTitle", `${titlePrefix} om ${moduleName}`);
        }
        
        if (documents && documents.length > 0) {
          // Set input type to document
          updateFormData("inputType", "document");

          // Process YouTube links separately
          const youtubeVideos = documents.filter(doc => doc.type === "youtube").map(doc => ({
            name: `YouTube Video (${doc.title})`,
            size: 0,
            type: "youtube",
            youtubeUrl: doc.url,
            videoId: extractYoutubeVideoId(doc.url),
            isYoutubeVideo: true
          }));
          
          // Convert document URLs to File objects (only for non-YouTube content)
          Promise.all(
            documents
              .filter(doc => doc.type !== "youtube")
              .map(async (doc) => {
                const response = await fetch(doc.url);
                const blob = await response.blob();
                
                // Determine mime type based on the document type
                let mimeType;
                switch (doc.type) {
                  case "pdf":
                    mimeType = "application/pdf";
                    break;
                  case "word":
                  case "doc":
                    mimeType = "application/msword";
                    break;
                  case "video":
                    mimeType = "video/mp4"; // Default to mp4, most common format
                    if (doc.url.toLowerCase().endsWith('.webm')) mimeType = "video/webm";
                    if (doc.url.toLowerCase().endsWith('.mov')) mimeType = "video/quicktime";
                    if (doc.url.toLowerCase().endsWith('.avi')) mimeType = "video/x-msvideo";
                    break;
                  case "audio":
                    mimeType = "audio/mpeg"; // Default to mp3, most common format
                    if (doc.url.toLowerCase().endsWith('.wav')) mimeType = "audio/wav";
                    if (doc.url.toLowerCase().endsWith('.ogg')) mimeType = "audio/ogg";
                    if (doc.url.toLowerCase().endsWith('.m4a')) mimeType = "audio/mp4";
                    break;
                  default:
                    mimeType = "application/octet-stream"; // Generic binary
                    break;
                }
                
                return new File([blob], doc.title, { type: mimeType });
              })
          )
            .then((files) => {
              // Combine regular files with YouTube videos
              const allFiles = [...files, ...youtubeVideos];
              updateFormData("files", allFiles);
            })
            .catch((error) => {
              console.error("Error loading module documents:", error);
            });
        }
      } catch (error) {
        console.error("Error parsing quiz documents:", error);
      }
    }
  }, []);

  // Function to extract YouTube video ID
  const extractYoutubeVideoId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Effect to scroll to loading spinner when loading state changes to true
  useEffect(() => {
    if (loading) {
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
      setError("Udfyld venligst alle påkrævede felter.");
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
          "Der blev ikke udtrukket noget indhold til quizgenerering. Prøv venligst igen med andet input."
        );
      }

      // Prepare data for quiz generation
      const quizRequestData = {
        content: contentToProcess,
        inputType: formData.inputType,
        questionType: formData.questionType,
        additionalInstructions: formData.additionalInstructions,
        language: formData.language,
        numQuestions: formData.numQuestions,
        quizTitle: formData.quizTitle || "Quiz",
      };

      // Send to backend for quiz generation
      const generatedQuizData = await generateQuiz(quizRequestData);

      // Check if the request was canceled
      if (generatedQuizData && generatedQuizData.canceled) {
        return;
      }

      // Ensure the generated quiz has the title from the form data
      const finalQuizData = {
        ...generatedQuizData,
        title: formData.quizTitle || "Quiz",
      };

      // Update the state with the generated quiz
      setGeneratedQuiz(finalQuizData);
      
      // Instead of completely removing quizDocuments, preserve the moduleId for later use
      const quizDocuments = localStorage.getItem("quizDocuments");
      if (quizDocuments) {
        try {
          const { moduleId, moduleName } = JSON.parse(quizDocuments);
          // Keep only the moduleId and moduleName for later module association
          localStorage.setItem("quizDocuments", JSON.stringify({
            moduleId,
            moduleName
          }));
        } catch (error) {
          console.error("Error preserving module information:", error);
        }
      }
    } catch (err) {
      console.error("Error generating quiz:", err);
      setError(
        err.message || "Kunne ikke generere quiz. Prøv venligst igen senere."
      );
    } finally {
      setLoading(false);
    }
  };

  // Effect to update quiz title when question type changes
  useEffect(() => {
    // Only update if we have a title that follows the pattern
    if (formData.quizTitle) {
      const titleMatch = formData.quizTitle.match(/^(Quiz|Flashcards) om (.+)$/);
      if (titleMatch) {
        const moduleName = titleMatch[2];
        const titlePrefix = formData.questionType === "flashcards" ? "Flashcards" : "Quiz";
        updateFormData("quizTitle", `${titlePrefix} om ${moduleName}`);
      }
    }
  }, [formData.questionType]);

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                {/* <h1 className="h3 mb-0">Opret Quiz</h1> */}
                <Button
                  variant="outline-secondary"
                  size="sm"
                  as={Link}
                  to="/platform"
                  className="d-flex align-items-center"
                >
                  <BsArrowLeft className="me-1" /> Tilbage til modul
                </Button>
              </div>

              {/* Show quiz output if generated, otherwise show form */}
              {generatedQuiz ? (
                <QuizOutput />
              ) : (
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                  {/* Quiz Title */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Titel</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.quizTitle}
                      onChange={(e) =>
                        updateFormData("quizTitle", e.target.value)
                      }
                      placeholder="Indtast en titel til din quiz"
                      className="form-control-lg"
                    />
                  </Form.Group>

                  {/* Question type selection - moved up as it's very important */}
                  <QuestionTypeSelector />

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

                  <hr className="my-4" />

                  <div className="row gy-0 gx-3">
                    <div className="col-md-6">
                      {/* Number of questions selection */}
                      <NumQuestionsSelector />
                    </div>
                    <div className="col-md-6">
                      {/* Language selection */}
                      <LanguageSelector />
                    </div>
                  </div>

                  {/* Additional instructions */}
                  <div className="mb-4">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        Yderligere instruktioner (valgfrit)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Indtast eventuelle særlige instruktioner til quizgenerering (f.eks., 'Fokus på forståelse', 'Inkluder anvendelsesbaserede spørgsmål')"
                        value={formData.additionalInstructions}
                        onChange={(e) =>
                          updateFormData(
                            "additionalInstructions",
                            e.target.value
                          )
                        }
                      />
                    </Form.Group>
                  </div>

                  {/* Sample Quiz Toggle */}
                 {/*  <div className="mb-4">
                    <Form.Check
                      type="switch"
                      id="sample-quiz-toggle"
                      label="Brug eksempelquiz (spring AI-generering over)"
                      checked={formData.useSampleQuiz}
                      onChange={(e) =>
                        updateFormData("useSampleQuiz", e.target.checked)
                      }
                      className="mb-2"
                    />
                    <Form.Text className="text-muted">
                      Aktiver denne mulighed for hurtigt at teste med en
                      eksempelquiz i stedet for at bruge AI-modellen.
                    </Form.Text>
                  </div> */}

                  {/* Submit button */}
                  <div className="d-grid gap-2 mt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      type="submit"
                      //disabled={loading || !isFormValid()}
                      disabled={true}
                    >
                      {formData.useSampleQuiz
                        ? "Opret eksempelquiz"
                        : formData.questionType === "flashcards"
                        ? "Opret flashcards"
                        : "Opret quiz"}
                    </Button>
                  </div>

                  {/* Loading spinner */}
                  <LoadingSpinner loading={loading} />
                </Form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizForm;
