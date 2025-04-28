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
        <Form.Label className="fw-bold">Output Sprog</Form.Label>
        <div className="d-flex gap-3">
          {languages.map((lang) => (
            <Form.Check
              key={lang.value}
              type="radio"
              id={`lang-${lang.value}`}
              label={lang.label}
              value={lang.value}
              checked={formData.language === lang.value}
              onChange={(e) => updateFormData("language", e.target.value)}
              className="mb-0"
            />
          ))}
        </div>
        <Form.Text className="text-muted">
          Vælg det sprog, som quizspørgsmålene skal genereres på.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default LanguageSelector;
