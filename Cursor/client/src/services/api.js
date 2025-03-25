import axios from "axios";

// API base URL - using the proxy configured in package.json
const API_BASE_URL = "/api";

// Function to generate quiz based on inputs
export const generateQuiz = async (quizData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/generate-quiz`,
      quizData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000, // 1-minute timeout for LLM processing
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

// Function to upload multiple files to the backend
export const uploadFiles = async (files) => {
  try {
    const formData = new FormData();

    // Append each file to the form data
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    const response = await axios.post(
      `${API_BASE_URL}/upload-files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

// For backward compatibility - single file upload
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_BASE_URL}/upload-file`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Function to fetch quiz content from a URL
export const fetchUrlContent = async (url) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/fetch-url`, { url });
    return response.data;
  } catch (error) {
    console.error("Error fetching URL content:", error);
    throw error;
  }
};
