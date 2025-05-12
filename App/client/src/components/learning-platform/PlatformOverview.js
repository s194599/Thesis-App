import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  ProgressBar,
  Spinner,
  ButtonGroup,
  ToggleButton,
  Button,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ModuleSidebar from "./ModuleSidebar";
import ModuleContent from "./ModuleContent";
import {
  fetchModulesWithActivities,
  fetchModuleActivities,
  updateModule,
} from "../../services/moduleService";

const PlatformOverview = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedModulesCount, setLoadedModulesCount] = useState(0);
  const [totalModulesToLoad, setTotalModulesToLoad] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [userRole, setUserRole] = useState(() => {
    const savedRole = localStorage.getItem("userRole");
    return savedRole || "teacher"; // Default to teacher if no saved role
  });
  const resetTabRef = useRef(null);

  // Load data from server or localStorage
  useEffect(() => {
    const loadModules = async () => {
      setLoading(true);

      try {
        // Load user role from localStorage first
        const savedUserRole = localStorage.getItem("userRole");
        if (savedUserRole) {
          console.log(`Loaded user role from localStorage: ${savedUserRole}`);
          setUserRole(savedUserRole);
        }
        
        // Get the saved selected module ID
        const savedSelectedModuleId = localStorage.getItem("selectedModuleId");
        console.log(`Loaded selectedModuleId from localStorage: ${savedSelectedModuleId || 'none'}`);

        // Try to load from localStorage first for immediate display while server data is loading
    const savedModules = localStorage.getItem("learningModules");
        let localModules = [];
    
    if (savedModules) {
      try {
            localModules = JSON.parse(savedModules);
            // Use localStorage data for initial render
            if (localModules.length > 0) {
              // Count activities for debugging
              let quizCount = 0;
              localModules.forEach((module) => {
                if (module && Array.isArray(module.activities)) {
                  module.activities.forEach((activity) => {
                    if (activity && activity.type === "quiz") {
                      quizCount++;
                    }
                  });
                }
              });
              console.log(
                `Loaded ${localModules.length} modules from localStorage with ${quizCount} quizzes`
              );

              setModules(localModules);

              // Set default selected module based on localStorage or first available
              if (savedSelectedModuleId) {
                // Check if the saved module exists in the loaded modules
                const moduleExists = localModules.some(m => m && m.id === savedSelectedModuleId);
                if (moduleExists) {
                setSelectedModuleId(savedSelectedModuleId);
                } else if (localModules.length > 0) {
                  // If saved module doesn't exist anymore, select the first one
                  setSelectedModuleId(localModules[0]?.id || null);
                  // Update localStorage with the new selection
                  localStorage.setItem("selectedModuleId", localModules[0]?.id || '');
                }
              } else if (localModules.length > 0) {
                setSelectedModuleId(localModules[0]?.id || null);
                // Update localStorage with the new selection
                localStorage.setItem("selectedModuleId", localModules[0]?.id || '');
              }
            }
      } catch (error) {
        console.error("Error parsing saved modules:", error);
          }
        }

        // Then fetch from server (this will update the UI once complete)
        console.log("Fetching modules from server...");
        const serverModules = await fetchModulesWithActivities();

        if (serverModules && serverModules.length > 0) {
          console.log(`Loaded ${serverModules.length} modules from server`);
          
          // Sync quiz data if needed
          if (localModules.length > 0) {
          // Create a map of all local quizzes for quick lookup
          const localQuizMap = new Map();

            localModules.forEach((module) => {
              if (module && Array.isArray(module.activities)) {
                module.activities.forEach((activity) => {
                  if (activity && activity.type === "quiz") {
                    // Create a key combining moduleId and activityId for unique identification
                    const key = `${module.id}:${activity.id}`;
                    localQuizMap.set(key, activity);
                  }
                });
              }
            });

          serverModules.forEach((module) => {
            if (module && Array.isArray(module.activities)) {
              module.activities.forEach((activity) => {
                if (activity && activity.type === "quiz") {
                    // Check if this quiz exists in localStorage
                    const localActivity = localQuizMap.get(`${module.id}:${activity.id}`);
                    if (!localActivity) {
                      console.log(`Quiz ${activity.id} in module ${module.id} not found in localStorage, adding to server data`);
                      updateModule(module.id, {
                        activities: [...module.activities, activity],
                      });
                    }
                  }
                });
              }
            });
          }

          // Update modules state with server data
          setModules(serverModules);
          
          // Preserve the selected module if it exists in the new data
          if (savedSelectedModuleId) {
            const moduleExists = serverModules.some(m => m && m.id === savedSelectedModuleId);
            if (moduleExists) {
              // If saved module exists, keep it selected and refresh its activities
              console.log(`Preserving selected module from localStorage: ${savedSelectedModuleId}`);
              setSelectedModuleId(savedSelectedModuleId);
              refreshModuleActivities(savedSelectedModuleId);
            } else if (serverModules.length > 0) {
              // If saved module doesn't exist anymore, select the first one
              console.log(`Saved module not found, selecting first module`);
              setSelectedModuleId(serverModules[0]?.id || null);
              // Update localStorage with the new selection
              localStorage.setItem("selectedModuleId", serverModules[0]?.id || '');
              refreshModuleActivities(serverModules[0]?.id || null);
            }
          } else if (!selectedModuleId && serverModules.length > 0) {
            // If no module is selected yet, select the first one
            console.log(`No selected module, selecting first module`);
            setSelectedModuleId(serverModules[0]?.id || null);
            // Update localStorage with the new selection
            localStorage.setItem("selectedModuleId", serverModules[0]?.id || '');
            refreshModuleActivities(serverModules[0]?.id || null);
          }
          
          // If we're in student view, make sure to fetch completion status
          if (savedUserRole === 'student') {
            // Fetch completion status for activities if needed
            fetchCompletionStatus();
          }
        }
      } catch (error) {
        console.error("Error loading modules:", error);
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    loadModules();
  }, []);

  // Function to fetch completion status for activities in student view
  const fetchCompletionStatus = async () => {
    try {
      console.log('Fetching completion status...');
      const response = await fetch("/api/student-activity-completions?studentId=1");
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.completed_activities)) {
          console.log(`Loaded ${data.completed_activities.length} completed activities`);
          
          // Update the modules with completion status
          setModules(prevModules => {
            // Make sure we're working with a valid array
            if (!Array.isArray(prevModules)) return prevModules;
            
            const updatedModules = prevModules.map(module => {
              if (!module || !Array.isArray(module.activities)) return module;
              
              // Update activities with completion status
              const updatedActivities = module.activities.map(activity => {
                if (!activity) return activity;
                const isCompleted = data.completed_activities.includes(activity.id);
                
                // Only update if there's a change to prevent unnecessary re-renders
                if (activity.completed !== isCompleted) {
                  return {
                    ...activity,
                    completed: isCompleted
                  };
                }
                return activity;
              });
              
              // Only create a new module object if activities have changed
              const hasChanges = updatedActivities.some((activity, index) => 
                activity !== module.activities[index]
              );
              
              if (hasChanges) {
                return {
                  ...module,
                  activities: updatedActivities
                };
              }
              
              return module;
            });
            
            // Force re-render by returning a new array even if contents didn't change
            // This ensures the UI updates the completion status indicators
            return [...updatedModules];
          });
          return true; // Successfully updated
        }
      }
      return false; // Failed to update
    } catch (error) {
      console.error("Error fetching completion status:", error);
      return false;
    }
  };

  const handleModuleSelect = (moduleId) => {
    if (moduleId === selectedModuleId) return; // Do nothing if selecting the same module

    console.log(`Selecting module: ${moduleId}`);
    
    // Save the selected module ID to localStorage
    localStorage.setItem("selectedModuleId", moduleId);
    
    // Update state with the new selected module ID
    setSelectedModuleId(moduleId);
    
    // Reset the active tab to "indhold" when selecting a new module
    if (resetTabRef.current) {
      resetTabRef.current("indhold");
    }

    // Refresh the module's activities to ensure we have the latest data
    refreshModuleActivities(moduleId);
    
    // If in student mode, make sure to update completion status
    if (userRole === 'student') {
      fetchCompletionStatusForModule(moduleId);
    }
  };

  const refreshModuleActivities = async (moduleId) => {
    if (!moduleId) return;

    try {
      console.log(`Refreshing activities for module ${moduleId}`);
      const activities = await fetchModuleActivities(moduleId);
      
      if (Array.isArray(activities)) {
        console.log(`Received ${activities.length} activities for module ${moduleId}`);
        
        setModules((prevModules) => {
          // Check if we have the module in our state
          const moduleExists = prevModules.some(m => m && m.id === moduleId);
          
          if (moduleExists) {
            // Update existing module
            return prevModules.map((module) =>
              module && module.id === moduleId 
                ? { ...module, activities } 
                : module
            );
          } else {
            // If module doesn't exist (rare case), fetch it specifically
            console.log(`Module ${moduleId} not found in state, will need to fetch it`);
            // Return unchanged for now, the app will re-fetch all modules if needed
            return prevModules;
          }
        });
      }
    } catch (error) {
      console.error(`Error refreshing activities for module ${moduleId}:`, error);
    }
  };
  
  // Function to fetch completion status for a specific module
  const fetchCompletionStatusForModule = async (moduleId) => {
    try {
      const response = await fetch("/api/student-activity-completions?studentId=1");
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.completed_activities)) {
          // Update only the selected module with completion status
          setModules(prevModules => {
            return prevModules.map(module => {
              if (!module || module.id !== moduleId || !Array.isArray(module.activities)) 
                return module;
              
              // Update activities with completion status
              const updatedActivities = module.activities.map(activity => {
                if (!activity) return activity;
                return {
                  ...activity,
                  completed: data.completed_activities.includes(activity.id)
                };
              });
              
              return {
                ...module,
                activities: updatedActivities
              };
            });
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching completion status for module ${moduleId}:`, error);
    }
  };
  
  // Find the selected module based on selectedModuleId
  const selectedModule = Array.isArray(modules) 
    ? modules.find(module => module && module.id === selectedModuleId)
    : null;
    
  // Handlers for activity completion and quiz access
  const handleActivityCompletion = (moduleId, activityId) => {
    // Implementation for activity completion
    console.log(`Activity ${activityId} in module ${moduleId} completed`);
  };

  const handleQuizAccess = () => {
    // Implementation for quiz access
    console.log("Quiz access requested");
  };
  
  // Function to update module activities (add, edit, delete)
  const updateModuleActivities = (moduleId, updatedActivities, updatedModule = null) => {
    setModules(prevModules => 
      prevModules.map(module => {
      if (module && module.id === moduleId) {
          if (updatedModule) {
            return {
              ...updatedModule,
              activities: updatedActivities
            };
          }
        return {
          ...module,
            activities: updatedActivities
        };
      }
      return module;
      })
    );
  };
  
  // Function to handle module updates (title, description, etc.)
  const handleModuleUpdate = async (moduleId, updatedData) => {
    try {
      await updateModule(moduleId, updatedData);
      setModules(prevModules => 
        prevModules.map(module => 
          module.id === moduleId 
            ? { ...module, ...updatedData } 
            : module
        )
      );
    } catch (error) {
      console.error("Error updating module:", error);
    }
  };

  // Function to handle role toggling between student and teacher
  const handleRoleToggle = (role) => {
    if (role === userRole) return;
    
    console.log(`Switching role from ${userRole} to ${role}`);
    setUserRole(role);
    localStorage.setItem("userRole", role);
    
    // Reload modules to update completion status when switching to student view
    if (role === 'student') {
      reloadModulesWithCompletionStatus();
    }
  };

  // Function to reload modules with updated completion status
  const reloadModulesWithCompletionStatus = async () => {
    try {
      // Get existing selected module ID to preserve selection
      const currentSelectedModuleId = selectedModuleId;
      
      console.log('Reloading modules with completion status...');
      const serverModules = await fetchModulesWithActivities();
      
      if (serverModules && serverModules.length > 0) {
        // Set the modules first
        setModules(serverModules);
        
        // Then explicitly fetch completion status
        await fetchCompletionStatus().then(() => {
          console.log('Completion status updated after role switch to student');
        });
        
        // Preserve the selected module
        if (currentSelectedModuleId) {
          // Make sure the module still exists
          const moduleExists = serverModules.some(m => m && m.id === currentSelectedModuleId);
          if (moduleExists) {
            console.log(`Preserving selected module: ${currentSelectedModuleId}`);
            // The setSelectedModuleId is already set, but refresh the activities
            refreshModuleActivities(currentSelectedModuleId);
          } else if (serverModules.length > 0) {
            // If the module doesn't exist anymore, select the first one
            console.log(`Previous module ${currentSelectedModuleId} not found, selecting first module`);
            setSelectedModuleId(serverModules[0].id);
            refreshModuleActivities(serverModules[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error reloading modules with completion status:', error);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Indlæser moduler...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="platform-overview p-0">
      {/* Floating User Role Toggle */}
      <div 
        className="position-fixed d-flex" 
        style={{ 
          bottom: "20px", 
          right: "20px", 
          zIndex: 1030,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          borderRadius: "4px"
        }}
      >
          <ButtonGroup>
            <ToggleButton
            id="role-student"
              type="radio"
              variant={userRole === "student" ? "primary" : "outline-primary"}
            name="role"
              value="student"
              checked={userRole === "student"}
            onChange={() => handleRoleToggle("student")}
            >
              Elev
            </ToggleButton>
            <ToggleButton
            id="role-teacher"
              type="radio"
              variant={userRole === "teacher" ? "primary" : "outline-primary"}
            name="role"
              value="teacher"
              checked={userRole === "teacher"}
            onChange={() => handleRoleToggle("teacher")}
            >
              Lærer
            </ToggleButton>
          </ButtonGroup>
      </div>

      <Row className="g-0">
        <Col md={3} className="sidebar-col bg-light border-end">
          <ModuleSidebar 
            modules={modules || []} 
            selectedModuleId={selectedModuleId}
            onModuleSelect={handleModuleSelect}
            userRole={userRole}
            onModuleUpdate={handleModuleUpdate}
          />
        </Col>
        <Col md={9} className="content-col">
          {selectedModule ? (
            <ModuleContent 
              module={selectedModule}
              onActivityCompletion={handleActivityCompletion}
              onQuizAccess={handleQuizAccess}
              onUpdateActivities={updateModuleActivities}
              onModuleUpdate={handleModuleUpdate}
              userRole={userRole}
              resetTabFn={fn => resetTabRef.current = fn}
            />
          ) : (
            <div className="p-4 text-center">
              <p>
                No module selected or available. Please select a module from the
                sidebar.
              </p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default PlatformOverview; 