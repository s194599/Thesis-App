import React, { useState, useEffect } from 'react';
import { Container, Row, Col, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ModuleSidebar from './ModuleSidebar';
import ModuleContent from './ModuleContent';
import mockModules from '../data/mockModules';

const PlatformOverview = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  // Load data from localStorage or use mockData
  useEffect(() => {
    const savedModules = localStorage.getItem('learningModules');
    let initialModules = [];
    
    if (savedModules) {
      try {
        initialModules = JSON.parse(savedModules);
      } catch (error) {
        console.error("Error parsing saved modules:", error);
        initialModules = mockModules;
      }
    } else {
      initialModules = mockModules;
    }
    
    setModules(initialModules);
    
    // Fetch server-stored activities for each module
    initialModules.forEach(module => {
      if (module && module.id) {
        fetchServerStoredActivities(module.id, initialModules);
      }
    });
    
    // Set default selected module
    const savedSelectedModuleId = localStorage.getItem('selectedModuleId');
    if (savedSelectedModuleId) {
      setSelectedModuleId(savedSelectedModuleId);
    } else {
      setSelectedModuleId(initialModules[0]?.id || null);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (modules && modules.length > 0) {
      localStorage.setItem('learningModules', JSON.stringify(modules));
    }
    
    if (selectedModuleId) {
      localStorage.setItem('selectedModuleId', selectedModuleId);
    }
  }, [modules, selectedModuleId]);

  // Calculate overall progress with null checks
  const totalActivities = Array.isArray(modules) 
    ? modules.reduce((sum, module) => {
        if (module && Array.isArray(module.activities)) {
          return sum + module.activities.length;
        }
        return sum;
      }, 0)
    : 0;
    
  const completedActivities = Array.isArray(modules) 
    ? modules.reduce((sum, module) => {
        if (module && Array.isArray(module.activities)) {
          return sum + module.activities.filter(activity => activity && activity.completed).length;
        }
        return sum;
      }, 0)
    : 0;
  
  const overallProgress = totalActivities > 0 
    ? Math.round((completedActivities / totalActivities) * 100) 
    : 0;

  const handleModuleSelect = (moduleId) => {
    setSelectedModuleId(moduleId);
  };

  const handleActivityCompletion = (moduleId, activityId) => {
    if (!Array.isArray(modules)) return;
    
    // Find the activity to update
    const moduleIndex = modules.findIndex(module => module && module.id === moduleId);
    if (moduleIndex === -1) return;
    
    const module = modules[moduleIndex];
    const activityIndex = module.activities.findIndex(activity => activity && activity.id === activityId);
    if (activityIndex === -1) return;
    
    // Create a copy of the activity with completed status
    const updatedActivity = {
      ...module.activities[activityIndex],
      completed: true,
      moduleId: moduleId  // Ensure moduleId is included
    };
    
    // Update modules in state
    setModules(modules.map(module => {
      if (module && module.id === moduleId) {
        return {
          ...module,
          activities: Array.isArray(module.activities) 
            ? module.activities.map(activity => {
                if (activity && activity.id === activityId) {
                  return updatedActivity;
                }
                return activity;
              })
            : []
        };
      }
      return module;
    }));
    
    // Store the updated activity with completed status on the server
    fetch('/api/store-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedActivity),
    })
    .then(response => response.json())
    .then(serverData => {
      console.log('Activity completion status stored on server:', serverData);
    })
    .catch(error => {
      console.error('Error storing activity completion status:', error);
    });
  };

  const handleQuizAccess = () => {
    // Navigate to the saved quizzes page
    navigate('/saved-quizzes');
  };
  
  // Function to update module activities (add, edit, delete)
  const updateModuleActivities = (moduleId, updatedActivities) => {
    if (!Array.isArray(modules)) return;
    
    setModules(modules.map(module => {
      if (module && module.id === moduleId) {
        return {
          ...module,
          activities: updatedActivities
        };
      }
      return module;
    }));
  };
  
  // Make the function available globally for debugging and direct access
  useEffect(() => {
    window.updateModuleActivities = updateModuleActivities;
    
    return () => {
      // Clean up when component unmounts
      delete window.updateModuleActivities;
    };
  }, [modules]); // Re-create when modules change to maintain closure with current state

  // Function to fetch server-stored activities for a module
  const fetchServerStoredActivities = (moduleId, currentModules) => {
    fetch(`/api/module-activities/${moduleId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && Array.isArray(data.activities) && data.activities.length > 0) {
          console.log(`Fetched ${data.activities.length} server-stored activities for module ${moduleId}`);
          
          // Update the module with server-stored activities
          setModules(prevModules => {
            // Use the provided modules array or the current state
            const modulesToUpdate = currentModules || prevModules;
            
            return modulesToUpdate.map(module => {
              if (module.id === moduleId) {
                // Create a map of existing activities by ID for easier comparison
                const existingActivitiesMap = new Map();
                module.activities.forEach(activity => {
                  if (activity && activity.id) {
                    existingActivitiesMap.set(activity.id, activity);
                  }
                });
                
                // Process server activities
                const mergedActivities = [...module.activities]; // Start with existing activities
                
                data.activities.forEach(serverActivity => {
                  const existingActivity = existingActivitiesMap.get(serverActivity.id);
                  
                  if (!existingActivity) {
                    // If activity doesn't exist locally, add it
                    mergedActivities.push(serverActivity);
                  } else {
                    // If it exists, update it but preserve any local state not on server
                    // First, find the index in the merged activities array
                    const index = mergedActivities.findIndex(a => a.id === serverActivity.id);
                    if (index !== -1) {
                      // Update with server data, prioritizing completed status
                      mergedActivities[index] = {
                        ...existingActivity,
                        ...serverActivity,
                        // Ensure the most "complete" state wins
                        completed: serverActivity.completed || existingActivity.completed
                      };
                    }
                  }
                });
                
                // Return the updated module with merged activities
                return {
                  ...module,
                  activities: mergedActivities
                };
              }
              return module;
            });
          });
        }
      })
      .catch(error => {
        console.error(`Error fetching activities for module ${moduleId}:`, error);
      });
  };

  const selectedModule = Array.isArray(modules) 
    ? modules.find(module => module && module.id === selectedModuleId) || modules[0]
    : null;

  return (
    <Container fluid className="platform-overview p-0">
      <Row className="g-0 min-vh-100">
        <Col md={3} className="sidebar-col bg-light border-end">
          <ModuleSidebar 
            modules={modules || []} 
            selectedModuleId={selectedModuleId}
            onModuleSelect={handleModuleSelect}
          />
        </Col>
        <Col md={9} className="content-col">
          {selectedModule ? (
            <ModuleContent 
              module={selectedModule}
              onActivityCompletion={handleActivityCompletion}
              onQuizAccess={handleQuizAccess}
              onUpdateActivities={updateModuleActivities} // Pass the function down
            />
          ) : (
            <div className="p-4 text-center">
              <p>No module selected or available. Please select a module from the sidebar.</p>
            </div>
          )}
          
          {/* Overall Progress */}
          <div className="fixed-bottom bg-white border-top py-2 px-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted">{overallProgress}% - {completedActivities} ud af {totalActivities} moduler gennemført</small>
              <small className="text-muted">Total Fremgang</small>
            </div>
            <ProgressBar now={overallProgress} variant="primary" style={{ height: '8px' }} />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default PlatformOverview; 