const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const COMPLETIONS_FILE_PATH = path.join(__dirname, '../database/activity_completions.json');

// Helper function to read the completions file
function readCompletionsFile() {
  try {
    const fileContent = fs.readFileSync(COMPLETIONS_FILE_PATH, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading completions file:', error);
    return { completions: [] };
  }
}

// Helper function to write to the completions file
function writeCompletionsFile(data) {
  try {
    fs.writeFileSync(COMPLETIONS_FILE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to completions file:', error);
    return false;
  }
}

// Get all completions
router.get('/', (req, res) => {
  const data = readCompletionsFile();
  res.json(data.completions);
});

// Get completions by student ID
router.get('/student/:studentId', (req, res) => {
  const { studentId } = req.params;
  const data = readCompletionsFile();
  
  const studentCompletions = data.completions.filter(
    completion => completion.student_id === studentId
  );
  
  res.json(studentCompletions);
});

// Get completions by activity ID
router.get('/activity/:activityId', (req, res) => {
  const { activityId } = req.params;
  const data = readCompletionsFile();
  
  const activityCompletions = data.completions.filter(
    completion => completion.activity_id === activityId
  );
  
  res.json(activityCompletions);
});

// Get completions by module ID
router.get('/module/:moduleId', (req, res) => {
  const { moduleId } = req.params;
  const data = readCompletionsFile();
  
  const moduleCompletions = data.completions.filter(
    completion => completion.module_id === moduleId
  );
  
  res.json(moduleCompletions);
});

// Get completions by student ID and module ID
router.get('/student/:studentId/module/:moduleId', (req, res) => {
  const { studentId, moduleId } = req.params;
  const data = readCompletionsFile();
  
  const filteredCompletions = data.completions.filter(
    completion => completion.student_id === studentId && completion.module_id === moduleId
  );
  
  res.json(filteredCompletions);
});

// Add a new completion
router.post('/', (req, res) => {
  const { activity_id, module_id, student_id, student_name } = req.body;
  
  // Validate required fields
  if (!activity_id || !module_id || !student_id || !student_name) {
    return res.status(400).json({ 
      error: 'Missing required fields. Please provide activity_id, module_id, student_id, and student_name.'
    });
  }
  
  const data = readCompletionsFile();
  
  // Check if this activity is already completed by this student
  const existingCompletion = data.completions.find(
    completion => completion.activity_id === activity_id && completion.student_id === student_id
  );
  
  if (existingCompletion) {
    return res.status(409).json({ 
      error: 'This activity has already been completed by this student.',
      completion: existingCompletion
    });
  }
  
  // Create new completion record
  const newCompletion = {
    activity_id,
    module_id,
    student_id,
    student_name,
    timestamp: new Date().toISOString()
  };
  
  // Add to data and save
  data.completions.push(newCompletion);
  
  if (writeCompletionsFile(data)) {
    res.status(201).json(newCompletion);
  } else {
    res.status(500).json({ error: 'Failed to save completion data.' });
  }
});

module.exports = router; 