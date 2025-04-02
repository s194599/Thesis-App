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
        <Form.Label className="fw-bold">Number of Questions</Form.Label>
        <Form.Select
          value={formData.numQuestions}
          onChange={(e) =>
            updateFormData("numQuestions", parseInt(e.target.value, 10))
          }
        >
          {questionOptions.map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? "question" : "questions"}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="text-muted">
          Select how many quiz questions to generate.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default NumQuestionsSelector;
