import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Form, Spinner, Modal } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";
import {
  BsPencilSquare,
  BsCheckCircle,
  BsTypeH1,
  BsPlus,
  BsArrowLeft,
  BsFilePdf,
  BsDownload,
} from "react-icons/bs";
import { QuizEditor } from "../management";
import { useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../../../styles/QuizOutput.css';

// Import styles specific to PDF generation
const pdfStyles = `
.pdf-content {
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #f8f9fa;
  overflow: visible !important;
}
.pdf-content .question-item {
  margin-bottom: 16px;
  page-break-inside: avoid;
}
.pdf-content .options-list {
  list-style-type: none;
  padding-left: 0;
}
.pdf-content .option-item {
  padding: 8px;
  margin-bottom: 4px;
}
`;

const QuizOutput = () => {
  const navigate = useNavigate();
  const quizContentRef = useRef(null);
  const {
    generatedQuiz,
    resetForm,
    isEditing,
    startEditing,
    saveQuizToBackend,
    isSaving,
    saveSuccess,
    setGeneratedQuiz,
  } = useQuizContext();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isAddingToModule, setIsAddingToModule] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  
  // Initialize editedTitle when generatedQuiz changes
  useEffect(() => {
    if (generatedQuiz && generatedQuiz.title) {
      setEditedTitle(generatedQuiz.title);
    }
  }, [generatedQuiz]);

  // If in editing mode, show the QuizEditor component
  if (isEditing) {
    return <QuizEditor />;
  }

  if (!generatedQuiz) return null;

  const handleTitleClick = () => {
    setEditedTitle(generatedQuiz.title || "");
    setIsEditingTitle(true);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (editedTitle.trim()) {
      setGeneratedQuiz({
        ...generatedQuiz,
        title: editedTitle.trim(),
      });
    }
  };

  const handleTitleChange = (e) => {
    setEditedTitle(e.target.value);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
      if (editedTitle.trim()) {
        setGeneratedQuiz({
          ...generatedQuiz,
          title: editedTitle.trim(),
        });
      }
    }
  };

  const renderQuizQuestions = () => {
    return generatedQuiz.questions.map((question, questionIndex) => {
      // Handle flashcard type questions differently
      if (question.type === "flashcard" || question.type === "flashcards") {
        return (
          <div
            className="bg-white rounded shadow-sm mb-4 overflow-hidden question-item"
            key={question.id || questionIndex}
          >
            {/* Question header with number */}
            <div className="d-flex align-items-center py-2 px-3 bg-light border-bottom">
              <div
                className="bg-secondary rounded-circle d-flex justify-content-center align-items-center me-3"
                style={{ width: "32px", height: "32px", minWidth: "32px" }}
              >
                <span className="text-white fw-bold">{questionIndex + 1}</span>
              </div>
              <div className="fw-normal">Flashcard</div>
            </div>

            {/* Flashcard front and back */}
            <div className="p-3">
              <div className="mb-3">
                <strong>Forside (Spørgsmål):</strong>
                <div className="p-3 bg-light rounded mt-1">{question.question}</div>
              </div>
              <div>
                <strong>Bagside (Svar):</strong>
                <div className="p-3 bg-light rounded mt-1">{question.correctAnswer}</div>
              </div>
            </div>
          </div>
        );
      }

      // Original rendering for multiple choice questions
      return (
        <div
          className="bg-white rounded shadow-sm mb-4 overflow-hidden question-item"
          key={question.id || questionIndex}
        >
          {/* Question header with number */}
          <div className="d-flex align-items-center py-2 px-3 bg-light border-bottom">
            <div
              className="bg-secondary rounded-circle d-flex justify-content-center align-items-center me-3"
              style={{ width: "32px", height: "32px", minWidth: "32px" }}
            >
              <span className="text-white fw-bold">{questionIndex + 1}</span>
            </div>
            <div className="fw-normal">{question.question}</div>
          </div>

          {/* Options with letters */}
          <div className="p-3 options-list">
            {question.options && question.options.map((option, optionIndex) => {
              const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
              const letter =
                optionIndex < letters.length
                  ? letters[optionIndex]
                  : `Option ${optionIndex + 1}`;
              const isCorrect = option === question.correctAnswer;

              return (
                <div
                  key={optionIndex}
                  className={`d-flex align-items-center mb-2 py-2 px-3 rounded option-item ${
                    showAnswers && isCorrect ? "bg-light" : ""
                  }`}
                >
                  <div
                    className={`rounded-circle d-flex justify-content-center align-items-center me-3 ${
                      showAnswers && isCorrect ? "bg-success" : "bg-light border"
                    }`}
                    style={{ width: "28px", height: "28px", minWidth: "28px" }}
                  >
                    <span
                      className={showAnswers && isCorrect ? "text-white" : "text-secondary"}
                      style={{ fontSize: "14px" }}
                    >
                      {letter}
                    </span>
                  </div>
                  <div>{option}</div>
                </div>
              );
            })}
          </div>

          {/* Explanation section - only show when answers are visible */}
          {showAnswers && question.explanation && (
            <div className="bg-light p-3 border-top">
              <p className="mb-0">
                <strong>Forklaring</strong>
              </p>
              <p className="mb-0 text-secondary">{question.explanation}</p>
            </div>
          )}
        </div>
      );
    });
  };

  // Handle PDF generation
  const generatePDF = async () => {
    setIsPdfGenerating(true);
    try {
      console.log('Starting PDF generation...');
      
      // Get the content element
      const content = quizContentRef.current;
      if (!content) {
        console.error('Content reference is null');
        throw new Error('Cannot generate PDF: Content element not found');
      }
      
      // Initialize PDF document with A4 dimensions (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set up dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; // margin in mm
      const contentWidth = pageWidth - (2 * margin);
      
      // Add title
      const title = generatedQuiz.title || 'Quiz';
      pdf.setFontSize(16);
      pdf.text(title, pageWidth / 2, margin, { align: 'center' });
      
      // Format each question individually
      let yPosition = margin + 10; // Start position after title
      
      // Track if we need a new page
      let pageNum = 1;
      
      // Process each question
      for (let i = 0; i < generatedQuiz.questions.length; i++) {
        const question = generatedQuiz.questions[i];
        
        // Calculate if we need a new page
        if (yPosition > pageHeight - 60) { // Leave space for footer
          pdf.addPage();
          pageNum++;
          yPosition = margin; // Reset y position on new page
          
          // Add header on new page
          pdf.setFontSize(10);
          pdf.text(`${title} - fortsat`, pageWidth / 2, margin, { align: 'center' });
          yPosition += 7;
        }
        
        // Question number and text
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        
        // Handle flashcards differently
        if (question.type === "flashcard" || question.type === "flashcards") {
          pdf.text(`Flashcard ${i + 1}`, margin, yPosition);
          yPosition += 7;
          
          pdf.setFont(undefined, 'normal');
          
          // Front side
          pdf.text("Forside (Spørgsmål):", margin, yPosition);
          yPosition += 5;
          
          // Question text with wrap
          const frontLines = pdf.splitTextToSize(question.question, contentWidth - 10);
          pdf.text(frontLines, margin + 5, yPosition);
          yPosition += 6 * frontLines.length + 5;
          
          // Back side
          pdf.text("Bagside (Svar):", margin, yPosition);
          yPosition += 5;
          
          // Answer text with wrap
          const backLines = pdf.splitTextToSize(question.correctAnswer, contentWidth - 10);
          pdf.text(backLines, margin + 5, yPosition);
          yPosition += 6 * backLines.length + 10; // Extra spacing after the flashcard
        } else {
          // Regular multiple choice question
          pdf.text(`Spørgsmål ${i + 1}`, margin, yPosition);
          yPosition += 7;
          
          // Question text with wrap
          pdf.setFont(undefined, 'normal');
          const questionLines = pdf.splitTextToSize(question.question, contentWidth);
          pdf.text(questionLines, margin, yPosition);
          yPosition += 6 * questionLines.length;
          
          // Loop through options
          const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
          
          // Only process options if they exist
          if (question.options && question.options.length > 0) {
            for (let j = 0; j < question.options.length; j++) {
              // Check if we need a new page
              if (yPosition > pageHeight - 60) {
                pdf.addPage();
                pageNum++;
                yPosition = margin;
                
                // Add header on new page
                pdf.setFontSize(10);
                pdf.text(`${title} - fortsat`, pageWidth / 2, margin, { align: 'center' });
                yPosition += 7;
                
                // Remind the question number
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'italic');
                pdf.text(`(Spørgsmål ${i + 1} fortsat)`, margin, yPosition);
                pdf.setFont(undefined, 'normal');
                yPosition += 7;
              }
              
              // Get the current option
              const option = question.options[j];
              const letter = j < letters.length ? letters[j] : `Option ${j + 1}`;
              const isCorrect = option === question.correctAnswer;
              
              // Highlight correct answer if showing answers
              if (showAnswers && isCorrect) {
                // Draw a light green background for correct answer
                pdf.setFillColor(230, 248, 230); // Light green
                pdf.rect(margin - 2, yPosition - 5, contentWidth + 4, 10, 'F');
              }
              
              // Draw the option letter in a circle
              pdf.setDrawColor(100, 100, 100);
              pdf.setFillColor(isCorrect && showAnswers ? 40 : 255, isCorrect && showAnswers ? 167 : 255, isCorrect && showAnswers ? 69 : 255); // Green for correct, white for others
              pdf.circle(margin + 4, yPosition - 1, 3, isCorrect && showAnswers ? 'F' : 'FD');
              
              // Add letter
              pdf.setTextColor(isCorrect && showAnswers ? 255 : 0, 0, 0); // White for correct, black for others
              pdf.setFontSize(8);
              pdf.text(letter, margin + 4, yPosition, { align: 'center' });
              
              // Reset text color
              pdf.setTextColor(0, 0, 0);
              
              // Add option text with wrap
              pdf.setFontSize(10);
              const optionLines = pdf.splitTextToSize(option, contentWidth - 12);
              pdf.text(optionLines, margin + 10, yPosition);
              
              yPosition += 6 * optionLines.length + 3; // Add extra space between options
            }
            
            // Add explanation if showing answers
            if (showAnswers && question.explanation) {
              // Check if we need a new page for explanation
              if (yPosition > pageHeight - 80) {
                pdf.addPage();
                pageNum++;
                yPosition = margin;
                
                // Add header on new page
                pdf.setFontSize(10);
                pdf.text(`${title} - fortsat`, pageWidth / 2, margin, { align: 'center' });
                yPosition += 7;
              }
              
              // Explanation header
              pdf.setFontSize(10);
              pdf.setFont(undefined, 'bold');
              pdf.text('Forklaring:', margin, yPosition);
              yPosition += 5;
              
              // Explanation text with wrap
              pdf.setFont(undefined, 'normal');
              const explanationLines = pdf.splitTextToSize(question.explanation, contentWidth);
              pdf.text(explanationLines, margin, yPosition);
              yPosition += 6 * explanationLines.length;
            }
          }
        }
        
        // Extra space after the question
        yPosition += 10;
      }
      
      // Add footer on each page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Page number
        pdf.setFontSize(8);
        pdf.text(`Side ${i} af ${totalPages}`, pageWidth - margin, pageHeight - margin);
        
        // Date
        const now = new Date();
        const dateStr = now.toLocaleDateString('da-DK');
        pdf.text(`Genereret: ${dateStr}`, margin, pageHeight - margin);
      }
      
      // Save the PDF
      console.log(`Saving PDF with ${totalPages} pages`);
      pdf.save(`${title.replace(/[^\w\s-]/gi, '')}.pdf`);
      
      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Der opstod en fejl ved generering af PDF: ${error.message}`);
    } finally {
      setIsPdfGenerating(false);
      setShowPdfOptions(false);
    }
  };

  // Handle the PDF options modal
  const handlePdfOptionsConfirm = () => {
    generatePDF();
  };

  // Handle the save quiz action
  const handleSaveQuiz = async () => {
    console.log("Saving quiz with data:", generatedQuiz);
    
    // Ensure all flashcards have the proper type set
    const updatedQuiz = {
      ...generatedQuiz,
      questions: generatedQuiz.questions.map(question => {
        if (question.type === "flashcard") {
          return {
            ...question,
            type: "flashcard",
            options: [] // Ensure options is an empty array for flashcards
          };
        }
        return question;
      })
    };
    
    // Update the generatedQuiz in context
    setGeneratedQuiz(updatedQuiz);
    
    // Save to backend
    await saveQuizToBackend();
  };

  // Handle the save and add to module action
  const handleSaveAndAddToModule = async () => {
    setIsAddingToModule(true);
    try {
      // Check if the quiz is already saved
      const isSavedQuiz = !!generatedQuiz.quizId || !!generatedQuiz.id;
      let savedQuiz = null;

      console.log("Adding quiz to module. Quiz already saved:", isSavedQuiz);

      if (!isSavedQuiz) {
        // Save the quiz first if not already saved
        console.log("Saving quiz before adding to module...");
        savedQuiz = await saveQuizToBackend();
        if (!savedQuiz) {
          throw new Error("Failed to save quiz");
        }
        console.log("Quiz saved successfully with ID:", savedQuiz.quizId);
      } else {
        // Quiz is already saved
        savedQuiz = {
          quizId: generatedQuiz.quizId || generatedQuiz.id,
        };
        console.log("Using existing quiz ID:", savedQuiz.quizId);
      }

      const quizDocuments = localStorage.getItem("quizDocuments");
      console.log("quizDocuments from localStorage:", quizDocuments);
      
      if (quizDocuments) {
        try {
          const parsedData = JSON.parse(quizDocuments);
          console.log("Parsed quiz documents:", parsedData);
          const { moduleId } = parsedData;

          if (!moduleId) {
            console.error("No moduleId found in quizDocuments");
            throw new Error("No module ID found");
          }

          // Generate a unique ID for this activity instance
          const activityId = `activity_quiz_${
            savedQuiz.quizId
          }_${moduleId}_${Date.now()}`;

          console.log(`Adding quiz ${savedQuiz.quizId} to module ${moduleId}`);

          // Create a new activity for the module
          const response = await fetch("/api/store-activity", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              moduleId: moduleId,
              id: activityId, // Use our generated unique ID
              title: generatedQuiz.title,
              type: "quiz",
              quizId: savedQuiz.quizId,
              completed: false,
              // Mark this activity as belonging specifically to this module
              // to prevent showing in other modules
              moduleSpecific: true,
            }),
          });

          if (response.ok) {
            console.log(
              `Added quiz ${savedQuiz.quizId} to module ${moduleId} with activity ID ${activityId}`
            );
            // Clear the stored documents
            localStorage.removeItem("quizDocuments");
            // Navigate back to the module
            navigate("/platform");
          } else {
            const errorText = await response.text();
            console.error("API error adding quiz to module:", errorText);
            throw new Error(`Failed to add quiz to module: ${errorText}`);
          }
        } catch (error) {
          console.error("Error parsing quizDocuments:", error);
          throw error;
        }
      } else {
        console.warn("No quizDocuments found in localStorage");
        // If no module ID found, just redirect to platform
        navigate("/platform");
      }
    } catch (error) {
      console.error("Error adding quiz to module:", error);
      // You may want to show an error message to the user here
      alert(`Der opstod en fejl: ${error.message}`);
    } finally {
      setIsAddingToModule(false);
    }
  };

  // Handle deleting a quiz
  const handleDeleteQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${generatedQuiz.quizId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Navigate back to platform after successful deletion
        navigate("/platform");
      } else {
        console.error("Error deleting quiz:", await response.text());
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
    }
  };

  // Update buttons based on quiz already being saved
  const isSavedQuiz = !!generatedQuiz.quizId || !!generatedQuiz.id;

  // Check if we're coming from a module (for adding to module)
  const isFromModule = !!localStorage.getItem("quizDocuments");

  const openPdfOptions = () => {
    // Make sure the content is visible
    if (quizContentRef.current) {
      // Scroll to the content to ensure it's in view
      quizContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // A small delay to ensure scrolling completes before opening modal
      setTimeout(() => {
        setShowPdfOptions(true);
      }, 300);
    } else {
      // If the ref isn't available, still show the modal
      console.warn('Quiz content reference not found');
      setShowPdfOptions(true);
    }
  };

  return (
    <div className="mt-4 p-4 bg-light">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="flex-grow-1 me-3">
          {isEditingTitle ? (
            <input
              type="text"
              className="form-control form-control-lg"
              value={editedTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              placeholder="Indtast quiz titel"
              style={{ width: "100%" }}
            />
          ) : (
            <h2
              className="mb-0 editable-title quiz-output-title"
              onClick={handleTitleClick}
            >
              {generatedQuiz.title || "Klik for at tilføje titel"}
              <span className="editable-title-hint">Klik for at redigere</span>
            </h2>
          )}
        </div>

        <div className="d-flex flex-column flex-md-row">
          <Button
            variant="outline-primary"
            size="sm"
            className="me-md-2 mb-2 mb-md-0"
            onClick={startEditing}
          >
            <BsPencilSquare className="me-1" /> Rediger Quiz
          </Button>
        {/*   <Button variant="outline-secondary" size="sm" onClick={resetForm}>
            Opret Ny Quiz
          </Button> */}
        </div>
      </div>

      <div className="quiz-questions" ref={quizContentRef}>
        {renderQuizQuestions()}
      </div>

      <div className="mt-4 d-flex justify-content-end gap-2">
        {/* Check if quiz is being viewed from a saved state (has quizId) */}
        {isSavedQuiz && (
          <Button
            variant="outline-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Slet Quiz
          </Button>
        )}

        <Button 
          variant="outline-secondary"
          onClick={openPdfOptions}
          disabled={isPdfGenerating}
        >
          {isPdfGenerating ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Genererer PDF...
            </>
          ) : (
            <>
              <BsFilePdf className="me-2" /> Download som PDF
            </>
          )}
        </Button>

        {/* Streamlined save buttons logic */}
        {isFromModule ? (
          // When coming from a module, just show a single button
          <Button
            variant="primary"
            onClick={isSavedQuiz ? handleSaveAndAddToModule : handleSaveQuiz}
            disabled={isSaving || isAddingToModule}
          >
            {isSaving ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Gemmer...
              </>
            ) : isAddingToModule ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Tilføjer til Modul...
              </>
            ) : saveSuccess && !isSavedQuiz ? (
              // Show Add to Module after saving
              <>
                <BsPlus className="me-2" />
                Tilføj til Modul
              </>
            ) : (
              // Initial state or when adding a new quiz
              <>
                {isSavedQuiz ? (
                  <>
                    <BsPlus className="me-2" />
                    Tilføj til Modul
                  </>
                ) : (
                  "Gem Quiz"
                )}
              </>
            )}
          </Button>
        ) : (
          // When not coming from a module, just show Save Quiz
          <Button
            variant="primary"
            onClick={handleSaveQuiz}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <BsCheckCircle className="me-2" />
                Saved
              </>
            ) : (
              "Save Quiz"
            )}
          </Button>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this quiz? This action cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteQuiz}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PDF Options Modal */}
      <Modal 
        show={showPdfOptions} 
        onHide={() => setShowPdfOptions(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>PDF Indstillinger</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="showAnswersCheck"
                label="Vis korrekte svar i PDF"
                checked={showAnswers}
                onChange={() => setShowAnswers(!showAnswers)}
              />
              <Form.Text className="text-muted">
                Fravælg denne indstilling hvis du vil udskrive en version uden markerede svar til eleverne.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowPdfOptions(false)}
          >
            Annuller
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePdfOptionsConfirm}
            disabled={isPdfGenerating}
          >
            {isPdfGenerating ? (
              <>
                <Spinner size="sm" className="me-2" /> Genererer...
              </>
            ) : (
              <>
                <BsDownload className="me-2" /> Download PDF
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuizOutput;
