import axios from 'axios';

// API base URL (update with your actual backend URL)
const API_BASE_URL = 'http://localhost:5001/api';

// Check if the backend server and Ollama are available
export const checkApiStatus = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/status`);
        return response.data;
    } catch (error) {
        console.error('Error checking API status:', error);
        throw error;
    }
};

// Generate a quiz based on the provided PDF files
export const generateQuiz = async (formData) => {
    try {
        // Create a FormData object to send files
        const data = new FormData();
        
        // Add files if present
        if (formData.files && formData.files.length > 0) {
            formData.files.forEach(file => {
                data.append('files', file);
            });
        }
        
        const response = await axios.post(`${API_BASE_URL}/generate-quiz`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        return response.data;
    } catch (error) {
        console.error('Error generating quiz:', error);
        throw error;
    }
};

// Upload a single file and get its content
export const uploadFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        return response.data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

// Fetch content from a URL
export const fetchUrlContent = async (url) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/fetch-url`, { url });
        return response.data;
    } catch (error) {
        console.error('Error fetching URL content:', error);
        throw error;
    }
};
