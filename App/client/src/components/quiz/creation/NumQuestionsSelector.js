import React from "react";
import { Form } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";

const NumQuestionsSelector = () => {
  const { formData, updateFormData } = useQuizContext();

  // Create array of options from 1 to 10
  const questionOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="mb-4">
      <Form.Group>
        <Form.Label className="fw-bold">Antal spørgsmål</Form.Label>
        <Form.Select
          value={formData.numQuestions}
          onChange={(e) =>
            updateFormData("numQuestions", parseInt(e.target.value, 10))
          }
        >
          {questionOptions.map((num) => (
            <option key={num} value={num}>
              {num} spørgsmål
            </option>
          ))}
        </Form.Select>
        {/* <Form.Text className="text-muted">
          Vælg hvor mange quizspørgsmål der skal genereres.
        </Form.Text> */}
      </Form.Group>
    </div>
  );
};

export default NumQuestionsSelector;
