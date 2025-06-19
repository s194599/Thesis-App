// Service to handle homework feedback for lektie activities
const FEEDBACK_STORAGE_KEY = 'homeworkFeedback';

// Initialize feedback storage if it doesn't exist
const initializeFeedbackStorage = () => {
  if (!localStorage.getItem(FEEDBACK_STORAGE_KEY)) {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify({}));
  }
};

// Get all feedback data
export const getAllFeedback = () => {
  initializeFeedbackStorage();
  return JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY));
};

// Get feedback for a specific student and activity
export const getFeedback = (studentId, activityId) => {
  const allFeedback = getAllFeedback();
  return allFeedback[`${studentId}-${activityId}`] || null;
};

// Save feedback for a student and activity
export const saveFeedback = (studentId, activityId, feedback) => {
  const allFeedback = getAllFeedback();
  allFeedback[`${studentId}-${activityId}`] = {
    ...feedback,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(allFeedback));
  return true;
};

// Get all feedback for activities in a specific module
export const getModuleFeedback = (moduleId, studentId) => {
  const allFeedback = getAllFeedback();
  const studentFeedback = {};
  
  // Filter for feedback entries that match the student ID
  Object.entries(allFeedback).forEach(([key, value]) => {
    if (key.startsWith(`${studentId}-`) && value.moduleId === moduleId) {
      const activityId = key.split('-')[1];
      studentFeedback[activityId] = value;
    }
  });
  
  return studentFeedback;
};

export default {
  getAllFeedback,
  getFeedback,
  saveFeedback,
  getModuleFeedback
}; 