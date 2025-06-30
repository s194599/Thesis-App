import React, { useState, useEffect } from "react";
import { Form, Badge, Spinner, Alert } from "react-bootstrap";
import { getAvailableModels, switchModel } from "../../../services/api";

const ModelSelector = () => {
  const [models, setModels] = useState({});
  const [currentModel, setCurrentModel] = useState("");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAvailableModels();

        // Add defensive checks for the response structure
        if (response && response.available_models && response.current_model) {
          setModels(response.available_models);
          setCurrentModel(response.current_model);
        } else {
          console.error("Invalid response structure:", response);
          setError("Invalid response from server");
        }
      } catch (err) {
        console.error("Error fetching models:", err);
        setError(
          "Failed to load available models. Please make sure the server is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Handle model change
  const handleModelChange = async (selectedModel) => {
    if (selectedModel === currentModel) return;

    try {
      setSwitching(true);
      setError(null);
      const response = await switchModel(selectedModel);

      if (response && response.success) {
        setCurrentModel(selectedModel);
        console.log(`Switched to model: ${selectedModel}`);
      } else {
        throw new Error(response?.message || "Failed to switch model");
      }
    } catch (err) {
      console.error("Error switching model:", err);
      setError(`Failed to switch to ${selectedModel}: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">
          <Spinner size="sm" className="me-2" />
          AI Model
        </Form.Label>
        <Form.Text className="text-muted">
          Loading available models...
        </Form.Text>
      </Form.Group>
    );
  }

  // If there's an error or no models, show a simplified interface
  if (error || !models || Object.keys(models).length === 0) {
    return (
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">AI Model</Form.Label>
        {error && (
          <Alert variant="warning" className="py-2 mb-2">
            <small>{error}</small>
          </Alert>
        )}
        <Form.Control
          type="text"
          value={currentModel || "Unknown"}
          disabled
          placeholder="Unable to load models"
        />
        <Form.Text className="text-muted">
          Using default model. Check server connection to switch models.
        </Form.Text>
      </Form.Group>
    );
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label className="fw-bold">
        AI Model
        {switching && <Spinner size="sm" className="ms-2" />}
      </Form.Label>

      {error && (
        <Alert variant="warning" className="py-2 mb-2">
          <small>{error}</small>
        </Alert>
      )}

      <Form.Select
        value={currentModel}
        onChange={(e) => handleModelChange(e.target.value)}
        disabled={switching}
      >
        {Object.entries(models).map(([modelId, modelConfig]) => {
          // Add defensive checks for modelConfig
          const config = modelConfig || {};
          const name = config.name || modelId;
          const isDefault = config.default || false;

          return (
            <option key={modelId} value={modelId}>
              {name} {isDefault ? "(Default)" : ""}
            </option>
          );
        })}
      </Form.Select>

      <Form.Text className="text-muted">
        {models[currentModel] && models[currentModel].description
          ? models[currentModel].description
          : "Select an AI model for quiz generation"}
        {currentModel && (
          <Badge bg="success" className="ms-2">
            Active
          </Badge>
        )}
      </Form.Text>
    </Form.Group>
  );
};

export default ModelSelector;
