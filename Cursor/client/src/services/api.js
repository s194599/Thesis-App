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
        timeout: 300000, // 5-minute timeout for LLM processing
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Don't reject if status is less than 500
        },
      }
    );

    if (response.status >= 400) {
      throw new Error(response.data.message || "Failed to generate quiz");
    }
    console.log("Quiz generated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error generating quiz:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
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
      timeout: 300000, // 5-minute timeout
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Don't reject if status is less than 500
      },
    });

    if (response.status >= 400) {
      throw new Error(response.data.message || "Failed to upload file");
    }

    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    throw error;
  }
};

// Function to fetch quiz content from a URL
export const fetchUrlContent = async (url) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/fetch-url`,
      { url },
      {
        timeout: 300000, // 5-minute timeout
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Don't reject if status is less than 500
        },
      }
    );

    if (response.status >= 400) {
      throw new Error(response.data.message || "Failed to fetch URL content");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching URL content:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    throw error;
  }
};
