import React from "react";
import { Form } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";

const LanguageSelector = () => {
  const { formData, updateFormData } = useQuizContext();

  const languages = [
    { value: "danish", label: "Dansk" },
    { value: "english", label: "Engelsk" },
  ];

  return (
    <div className="mb-4">
      <Form.Group>
        <Form.Label className="fw-bold">Output sprog</Form.Label>
        <Form.Select
          value={formData.language}
          onChange={(e) => updateFormData("language", e.target.value)}
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </Form.Select>
       {/*  <Form.Text className="text-muted">
          Vælg det sprog, som quizspørgsmålene skal genereres på.
        </Form.Text> */}
      </Form.Group>
    </div>
  );
};

export default LanguageSelector;
