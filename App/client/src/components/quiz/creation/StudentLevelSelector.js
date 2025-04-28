import React from "react";
import { Form } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";

const StudentLevelSelector = () => {
  const { formData, updateFormData } = useQuizContext();

  const studentLevels = [
    { value: "1", label: "1.g" },
    { value: "2", label: "2.g" },
    { value: "3", label: "3.g" },
  ];

  return (
    <div className="mb-4">
      <Form.Group>
        <Form.Label className="fw-bold">Niveau (Valgfrit)</Form.Label>
        <Form.Select
          value={formData.studentLevel}
          onChange={(e) => updateFormData("studentLevel", e.target.value)}
        >
          {studentLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="text-muted">
          Vælg det uddannelsesniveau, som quizzen er beregnet til.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default StudentLevelSelector;
