import axios from 'axios';

// API base URL - update with your actual backend URL
const API_BASE_URL = 'http://localhost:5001';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2-minute timeout for LLM processing
});

// Function to check API and Ollama status
export const checkStatus = async () => {
  try {
    const response = await api.get('/api/status');
    return response.data;
  } catch (error) {
    console.error('Error checking API status:', error);
    return {
      status: 'offline',
      ollama_available: false,
      message: 'Could not connect to the API server'
    };
  }
};

// Function to generate quiz based on inputs
export const generateQuiz = async (quizData) => {
  try {
    // First check if the API and Ollama are available
    const status = await checkStatus();
    if (!status.ollama_available) {
      throw new Error(status.message || 'Ollama LLM is not available. Please start it with "ollama serve".');
    }
    
    const response = await api.post('/api/generate-quiz', quizData);
    
    if (!response.data || response.status !== 200) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error generating quiz:', error);
    // Include more detailed error information
    const errorMessage = error.response ? 
      `Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}` : 
      error.message;
    
    throw new Error(errorMessage);
  }
};

// Function to upload files for processing
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE_URL}/api/upload-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 1-minute timeout for file uploads
    });
    
    if (!response.data || response.status !== 200) {
      throw new Error(`File upload failed: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error.response ? 
      `Upload error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}` : 
      error.message;
    
    throw new Error(errorMessage);
  }
};

// Function to fetch quiz content from a URL
export const fetchUrlContent = async (url) => {
  try {
    const response = await api.post('/api/fetch-url', { url });
    
    if (!response.data || response.status !== 200) {
      throw new Error(`URL fetching failed: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching URL content:', error);
    const errorMessage = error.response ? 
      `URL error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}` : 
      error.message;
    
    throw new Error(errorMessage);
  }
};
