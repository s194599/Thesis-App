import React from "react";
import { Form } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";
import { BsListCheck, BsCardText } from "react-icons/bs";

const QuestionTypeSelector = () => {
  const { formData, updateFormData } = useQuizContext();

  const questionTypes = [
    {
      value: "multipleChoice",
      label: "Multiple choice",
      icon: <BsListCheck />,
      description: "Spørgsmål med flere muligheder og ét korrekt svar",
    },
    {
      value: "flashcards",
      label: "Flashcards",
      icon: <BsCardText />,
      description: "Spørgsmål og svar præsenteret som interaktive kort",
    }
  ];

  return (
    <div className="mb-4">
      <Form.Group>
        <Form.Label className="fw-bold">Spørgsmålstype</Form.Label>
        <div className="d-flex flex-wrap gap-2">
          {questionTypes.map((type) => (
            <div key={type.value} className="flex-grow-1">
              <div
                className={`p-3 rounded border ${
                  formData.questionType === type.value
                    ? "border-primary bg-light"
                    : ""
                }`}
                style={{
                  cursor: "pointer",
                  height: "100%",
                }}
                onClick={() => updateFormData("questionType", type.value)}
              >
                <Form.Check
                  type="radio"
                  id={`qtype-${type.value}`}
                  name="questionType"
                  label={
                    <div>
                      <div className="d-flex align-items-center">
                        <span className="me-2">{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        {type.description}
                      </small>
                    </div>
                  }
                  value={type.value}
                  checked={formData.questionType === type.value}
                  onChange={(e) =>
                    updateFormData("questionType", e.target.value)
                  }
                  className="mb-0"
                />
              </div>
            </div>
          ))}
        </div>
        {/* <Form.Text className="text-muted">
          Bemærk: I MVP'en er kun multiple choice og flashcards tilgængelige.
        </Form.Text> */}
      </Form.Group>
    </div>
  );
};

export default QuestionTypeSelector;
