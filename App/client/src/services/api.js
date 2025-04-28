import axios from "axios";

// API base URL - using the proxy configured in package.json
const API_BASE_URL = "/api";

// Create a source for cancellation tokens
let cancelTokenSource = null;

// Function to create a new cancel token source
export const createCancelToken = () => {
  // Cancel any existing requests
  if (cancelTokenSource) {
    cancelTokenSource.cancel("Operation canceled by the user.");
  }
  // Create a new token
  cancelTokenSource = axios.CancelToken.source();
  return cancelTokenSource;
};

// Function to cancel ongoing requests
export const cancelRequests = () => {
  if (cancelTokenSource) {
    cancelTokenSource.cancel("Operation canceled by the user.");
    cancelTokenSource = null;
  }
};

// Function to generate quiz based on inputs
export const generateQuiz = async (quizData) => {
  try {
    // Create a new cancel token for this request
    const source = createCancelToken();

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
        cancelToken: source.token,
      }
    );

    if (response.status >= 400) {
      throw new Error(response.data.message || "Failed to generate quiz");
    }
    console.log("Quiz generated successfully:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
      // Return a specific object to indicate cancellation
      return { canceled: true };
    }

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
    files.forEach((file) => {
      formData.append(`files`, file);
    });

    const response = await axios.post(
      `${API_BASE_URL}/upload-files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 1-minute timeout
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Don't reject if status is less than 500
        },
      }
    );

    if (response.status >= 400) {
      // Check if this is a video transcription error
      if (response.data.error === "Video transcription failed") {
        throw new Error(`Video transcription failed: ${response.data.message}`);
      }
      throw new Error(
        response.data.error || response.data.message || "Failed to upload files"
      );
    }

    // Process the response - convert to a format expected by the QuizForm
    let combinedContent = "";
    if (response.data.files && response.data.files.length > 0) {
      // Extract full content from each file and combine
      combinedContent = response.data.files
        .map((file) => file.content)
        .join("\n\n");
    }

    return {
      ...response.data,
      combinedContent,
    };
  } catch (error) {
    console.error("Error uploading files:", error);
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

// Function to save a quiz to the backend
export const saveQuiz = async (quizData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/save-quiz`, quizData, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10-second timeout
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    });

    if (response.status >= 400) {
      throw new Error(response.data.message || "Failed to save quiz");
    }

    return response.data;
  } catch (error) {
    console.error("Error saving quiz:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    throw error;
  }
};

// Function to get all saved quizzes
export const getQuizzes = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/quizzes`, {
      timeout: 10000, // 10-second timeout
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    });

    if (response.status >= 400) {
      throw new Error(response.data.message || "Failed to get quizzes");
    }

    return response.data;
  } catch (error) {
    console.error("Error getting quizzes:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    throw error;
  }
};

// Function to get a specific quiz
export const getQuiz = async (quizId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}`, {
      timeout: 10000, // 10-second timeout
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    });

    if (response.status >= 400) {
      throw new Error(response.data.message || "Failed to get quiz");
    }

    return response.data;
  } catch (error) {
    console.error("Error getting quiz:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    throw error;
  }
};

// Get forum posts for a module
export const getForumPosts = async (moduleId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/forum/${moduleId}`, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    throw error;
  }
};

// Create a new forum post
export const createForumPost = async (moduleId, postData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forum/${moduleId}/post`, postData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // Increased timeout for potential image uploads
    });
    return response.data;
  } catch (error) {
    console.error('Error creating forum post:', error);
    throw error;
  }
};

// Add a comment to a forum post
export const addForumComment = async (moduleId, postId, commentData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forum/${moduleId}/post/${postId}/comment`, commentData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // Increased timeout for potential image uploads
    });
    return response.data;
  } catch (error) {
    console.error('Error adding forum comment:', error);
    throw error;
  }
};

// Delete a forum post
export const deleteForumPost = async (moduleId, postId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/forum/${moduleId}/post/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete forum post');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting forum post:', error);
    throw error;
  }
};
