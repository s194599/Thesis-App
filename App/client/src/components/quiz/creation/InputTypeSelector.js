import React from "react";
import { useQuizContext } from "../../../context/QuizContext";
import { Form } from "react-bootstrap";
import {
  BsPencilSquare,
  BsFileText,
  BsGlobe,
  BsFileEarmarkPdf,
} from "react-icons/bs";

const InputTypeSelector = () => {
  const { formData, updateFormData } = useQuizContext();

  const handleInputTypeChange = (e) => {
    updateFormData("inputType", e.target.value);
  };

  return (
    <div className="mb-4">
      <Form.Group>
        <Form.Label className="fw-bold">Materialetype</Form.Label>
        <div className="d-flex flex-wrap gap-2">
          <div className="flex-grow-1">
            <div
              className={`p-3 rounded border ${
                formData.inputType === "document"
                  ? "border-primary bg-light"
                  : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => updateFormData("inputType", "document")}
            >
              <Form.Check
                type="radio"
                id="input-document"
                label={
                  <div className="d-flex align-items-center">
                    <BsFileEarmarkPdf className="me-2" />
                    <span>Dokumenter</span>
                  </div>
                }
                value="document"
                checked={formData.inputType === "document"}
                onChange={handleInputTypeChange}
                className="mb-0"
              />
            </div>
          </div>

          <div className="flex-grow-1">
            <div
              className={`p-3 rounded border ${
                formData.inputType === "topic" ? "border-primary bg-light" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => updateFormData("inputType", "topic")}
            >
              <Form.Check
                type="radio"
                id="input-topic"
                label={
                  <div className="d-flex align-items-center">
                    <BsPencilSquare className="me-2" />
                    <span>Emne</span>
                  </div>
                }
                value="topic"
                checked={formData.inputType === "topic"}
                onChange={handleInputTypeChange}
                className="mb-0"
              />
            </div>
          </div>

          <div className="flex-grow-1">
            <div
              className={`p-3 rounded border ${
                formData.inputType === "text" ? "border-primary bg-light" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => updateFormData("inputType", "text")}
            >
              <Form.Check
                type="radio"
                id="input-text"
                label={
                  <div className="d-flex align-items-center">
                    <BsFileText className="me-2" />
                    <span>Tekst</span>
                  </div>
                }
                value="text"
                checked={formData.inputType === "text"}
                onChange={handleInputTypeChange}
                className="mb-0"
              />
            </div>
          </div>

          <div className="flex-grow-1">
            <div
              className={`p-3 rounded border ${
                formData.inputType === "webpage"
                  ? "border-primary bg-light"
                  : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => updateFormData("inputType", "webpage")}
            >
              <Form.Check
                type="radio"
                id="input-webpage"
                label={
                  <div className="d-flex align-items-center">
                    <BsGlobe className="me-2" />
                    <span>Hjemmeside</span>
                  </div>
                }
                value="webpage"
                checked={formData.inputType === "webpage"}
                onChange={handleInputTypeChange}
                className="mb-0"
              />
            </div>
          </div>
        </div>
      </Form.Group>
    </div>
  );
};

export default InputTypeSelector;
