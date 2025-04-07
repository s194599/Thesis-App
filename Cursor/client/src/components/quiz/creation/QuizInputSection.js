import React from "react";
import { Form } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";
import FileUploader from "./FileUploader";

const QuizInputSection = () => {
  const { formData, updateFormData } = useQuizContext();

  // Render different input sections based on the selected input type
  const renderInputSection = () => {
    switch (formData.inputType) {
      case "topic":
        return (
          <Form.Group className="mb-3">
            <Form.Label>Indtast Emne</Form.Label>
            <Form.Control
              type="text"
              placeholder="F.eks., Fotosyntese, 2. Verdenskrig, Lineær Algebra..."
              value={formData.topic}
              onChange={(e) => updateFormData("topic", e.target.value)}
            />
            <Form.Text className="text-muted">
              Indtast et specifikt emne at generere quizspørgsmål om.
            </Form.Text>
          </Form.Group>
        );

      case "text":
        return (
          <Form.Group className="mb-3">
            <Form.Label>Indtast Tekst</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder="Indsæt eller skriv tekstindhold her..."
              value={formData.text}
              onChange={(e) => updateFormData("text", e.target.value)}
            />
            <Form.Text className="text-muted">
              Indtast tekstindhold, som quizspørgsmål skal genereres fra.
            </Form.Text>
          </Form.Group>
        );

      case "webpage":
        return (
          <Form.Group className="mb-3">
            <Form.Label>Indtast URL</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://eksempel.dk/artikel"
              value={formData.url}
              onChange={(e) => updateFormData("url", e.target.value)}
            />
            <Form.Text className="text-muted">
              Indtast en hjemmeside-URL for at udtrække indhold til
              quizgenerering.
            </Form.Text>
          </Form.Group>
        );

      case "document":
        return (
          <Form.Group className="mb-3">
            <Form.Label>Upload Dokument</Form.Label>
            <FileUploader />
            <Form.Text className="text-muted">
              Upload et dokument (PDF, DOC, DOCX, TXT) for at generere
              quizspørgsmål.
            </Form.Text>
          </Form.Group>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mb-4">
      <h5>Quiz Indtastning</h5>
      {renderInputSection()}
    </div>
  );
};

export default QuizInputSection;
