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

// Function to upload files to the server
export const uploadFiles = async (files) => {
  try {
    // Check if we have files to upload
    if (!files || files.length === 0) {
      return { error: "No files to upload" };
    }

    // Filter YouTube videos from regular files
    const regularFiles = files.filter((file) => !file.isYoutubeVideo);
    const youtubeVideos = files.filter((file) => file.isYoutubeVideo);

    // Extract YouTube URLs
    const youtubeUrls = youtubeVideos.map((file) => file.youtubeUrl).join(",");

    // Create FormData for regular files
    const formData = new FormData();

    // Add all regular files to the form data
    regularFiles.forEach((file) => {
      formData.append("files", file);
    });

    // Add YouTube URLs to the form data if any exist
    if (youtubeUrls) {
      formData.append("youtubeUrls", youtubeUrls);
    }

    // Upload to the server
    const response = await fetch("/api/upload-files", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload files");
    }

    return {
      success: true,
      files: data.files,
      combinedContent: data.combinedContent,
    };
  } catch (error) {
    console.error("Error uploading files:", error);
    return {
      error: error.message || "Failed to upload files",
      files: [],
      combinedContent: "",
    };
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
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching forum posts:", error);
    throw error;
  }
};

// Create a new forum post
export const createForumPost = async (moduleId, postData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/forum/${moduleId}/post`,
      postData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // Increased timeout for potential image uploads
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating forum post:", error);
    throw error;
  }
};

// Add a comment to a forum post
export const addForumComment = async (moduleId, postId, commentData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/forum/${moduleId}/post/${postId}/comment`,
      commentData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // Increased timeout for potential image uploads
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding forum comment:", error);
    throw error;
  }
};

// Delete a forum post (teacher only)
export const deleteForumPost = async (moduleId, postId) => {
  try {
    await axios.delete(`${API_BASE_URL}/forum/${moduleId}/post/${postId}`, {
      timeout: 10000,
    });
    return true;
  } catch (error) {
    console.error("Error deleting forum post:", error);
    throw error;
  }
};

// Toggle forum status (enable/disable) globally (teacher only)
export const toggleForumStatus = async (moduleId, status) => {
  try {
    // Use the global-specific endpoint when moduleId is 'global'
    const endpoint =
      moduleId === "global"
        ? `${API_BASE_URL}/forum/global/status`
        : `${API_BASE_URL}/forum/${moduleId}/status`;

    const response = await axios.put(endpoint, { status }, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error("Error toggling forum status:", error);
    throw error;
  }
};

// Function to get available LLM models
export const getAvailableModels = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/models`, {
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    });

    if (response.status >= 400) {
      throw new Error(
        response.data.message || "Failed to get available models"
      );
    }

    return response.data;
  } catch (error) {
    console.error("Error getting available models:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    throw error;
  }
};

// Function to switch the current LLM model
export const switchModel = async (modelName) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/models/switch`,
      { model: modelName },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        },
      }
    );

    if (response.status >= 400) {
      throw new Error(response.data.message || "Failed to switch model");
    }

    return response.data;
  } catch (error) {
    console.error("Error switching model:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    throw error;
  }
};
