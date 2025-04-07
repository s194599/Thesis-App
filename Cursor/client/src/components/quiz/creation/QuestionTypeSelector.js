import React from "react";
import { Form } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";
import { BsListCheck, BsToggleOn, BsTextLeft } from "react-icons/bs";

const QuestionTypeSelector = () => {
  const { formData, updateFormData } = useQuizContext();

  const questionTypes = [
    {
      value: "multipleChoice",
      label: "Multiple Choice",
      icon: <BsListCheck />,
      description: "Spørgsmål med flere muligheder og ét korrekt svar",
    },
    {
      value: "trueFalse",
      label: "Sand/Falsk",
      icon: <BsToggleOn />,
      description: "Spørgsmål med sand eller falsk svar",
      disabled: true,
    },
    {
      value: "shortAnswer",
      label: "Kort Svar",
      icon: <BsTextLeft />,
      description: "Spørgsmål der kræver korte tekstsvar",
      disabled: true,
    },
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
                    : type.disabled
                    ? "text-muted opacity-50"
                    : ""
                }`}
                style={{
                  cursor: type.disabled ? "not-allowed" : "pointer",
                  height: "100%",
                }}
                onClick={() =>
                  !type.disabled && updateFormData("questionType", type.value)
                }
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
                  disabled={type.disabled}
                  className="mb-0"
                />
              </div>
            </div>
          ))}
        </div>
        <Form.Text className="text-muted">
          Bemærk: I MVP'en er kun multiple choice tilgængelige.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default QuestionTypeSelector;
