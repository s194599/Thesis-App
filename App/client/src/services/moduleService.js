/**
 * Service for handling module and activity data operations
 */

/**
 * Fetches all modules with their activities
 * @returns {Promise<Array>} Array of modules with activities
 */
export const fetchModulesWithActivities = async () => {
  try {
    const response = await fetch('/api/modules-with-activities');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.success && Array.isArray(data.modules)) {
      return data.modules;
    } else {
      console.warn('Failed to fetch modules:', data.message || 'Unknown error');
      return [];
    }
  } catch (error) {
    console.error('Error fetching modules with activities:', error.message);
    return [];
  }
};

/**
 * Fetches activities for a specific module
 * @param {string} moduleId - The ID of the module
 * @returns {Promise<Array>} Array of activities for the module
 */
export const fetchModuleActivities = async (moduleId) => {
  if (!moduleId) return [];
  
  try {
    const response = await fetch(`/api/module-activities/${moduleId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.success && Array.isArray(data.activities)) {
      return data.activities;
    } else {
      console.warn(`Failed to fetch activities for module ${moduleId}:`, data.message || 'Unknown error');
      return [];
    }
  } catch (error) {
    console.error(`Error fetching activities for module ${moduleId}:`, error.message);
    return [];
  }
};

/**
 * Updates module information (title, date, description)
 * @param {string} moduleId - The ID of the module to update
 * @param {Object} moduleData - The module data to update
 * @returns {Promise<Object>} The updated module object
 */
export const updateModule = async (moduleId, moduleData) => {
  if (!moduleId) {
    throw new Error('Module ID is required');
  }
  
  try {
    const response = await fetch('/api/update-module', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: moduleId,
        ...moduleData
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.module;
    } else {
      throw new Error(data.message || 'Failed to update module');
    }
  } catch (error) {
    console.error('Error updating module:', error.message);
    throw error;
  }
};

/**
 * Creates a new module
 * @param {Object} moduleData - The module data (title, date, description, etc.)
 * @returns {Promise<Object>} The created module object
 */
export const createModule = async (moduleData) => {
  if (!moduleData.title) {
    throw new Error('Module title is required');
  }
  
  try {
    const response = await fetch('/api/create-module', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(moduleData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.module;
    } else {
      throw new Error(data.message || 'Failed to create module');
    }
  } catch (error) {
    console.error('Error creating module:', error.message);
    throw error;
  }
};

/**
 * Deletes a module by ID
 * @param {string} moduleId - The ID of the module to delete
 * @returns {Promise<Object>} Result of the deletion operation
 */
export const deleteModule = async (moduleId) => {
  if (!moduleId) {
    throw new Error('Module ID is required');
  }
  
  try {
    const response = await fetch(`/api/delete-module/${moduleId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to delete module');
    }
  } catch (error) {
    console.error('Error deleting module:', error.message);
    throw error;
  }
}; 