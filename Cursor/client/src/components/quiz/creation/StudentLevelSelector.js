import React from "react";
import { Form } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";

const StudentLevelSelector = () => {
  const { formData, updateFormData } = useQuizContext();

  const studentLevels = [
    { value: "elementary", label: "Folkeskole (1-5. klasse)" },
    { value: "middleSchool", label: "Folkeskole (6-9. klasse)" },
    { value: "highSchool", label: "Gymnasium" },
    { value: "university", label: "Universitet" },
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
