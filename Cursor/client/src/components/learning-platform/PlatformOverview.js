import React, { useState, useEffect } from "react";
import { Container, Row, Col, ProgressBar, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ModuleSidebar from "./ModuleSidebar";
import ModuleContent from "./ModuleContent";
import { fetchModulesWithActivities, fetchModuleActivities, updateModule } from "../../services/moduleService";

const PlatformOverview = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedModulesCount, setLoadedModulesCount] = useState(0);
  const [totalModulesToLoad, setTotalModulesToLoad] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load data from server or localStorage
  useEffect(() => {
    const loadModules = async () => {
      setLoading(true);
      
      try {
        // Try to load from localStorage first for immediate display
        const savedModules = localStorage.getItem("learningModules");
        let localModules = [];
        
        if (savedModules) {
          try {
            localModules = JSON.parse(savedModules);
            // Use localStorage data for initial render
            if (localModules.length > 0) {
              setModules(localModules);
              
              // Set default selected module
              const savedSelectedModuleId = localStorage.getItem("selectedModuleId");
              if (savedSelectedModuleId) {
                setSelectedModuleId(savedSelectedModuleId);
              } else if (localModules.length > 0) {
                setSelectedModuleId(localModules[0]?.id || null);
              }
            }
          } catch (error) {
            console.error("Error parsing saved modules:", error);
          }
        }
        
        // Then fetch from server (this will update the UI once complete)
        const serverModules = await fetchModulesWithActivities();
        
        if (serverModules.length > 0) {
          console.log(`Loaded ${serverModules.length} modules from server`);
          setModules(serverModules);
          setInitialLoadComplete(true);
          
          // Set selected module if not already set
          if (!selectedModuleId && serverModules.length > 0) {
            const savedSelectedModuleId = localStorage.getItem("selectedModuleId");
            if (savedSelectedModuleId) {
              setSelectedModuleId(savedSelectedModuleId);
            } else {
              setSelectedModuleId(serverModules[0]?.id || null);
            }
          }
          
          // No need to individually load activities, as they're included in the response
          setLoading(false);
        } else {
          console.warn("No modules loaded from server");
          setLoading(false);
          setInitialLoadComplete(true);
        }
      } catch (error) {
        console.error("Error loading modules:", error);
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };
    
    loadModules();
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (initialLoadComplete && modules && modules.length > 0) {
      localStorage.setItem("learningModules", JSON.stringify(modules));
    }

    if (selectedModuleId) {
      localStorage.setItem("selectedModuleId", selectedModuleId);
    }
  }, [modules, selectedModuleId, initialLoadComplete]);

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
          return (
            sum +
            module.activities.filter(
              (activity) => activity && activity.completed
            ).length
          );
        }
        return sum;
      }, 0)
    : 0;

  const overallProgress =
    totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

  const handleModuleSelect = (moduleId) => {
    if (moduleId === selectedModuleId) return; // Do nothing if selecting the same module
    
    setSelectedModuleId(moduleId);
    
    // Refresh the module's activities to ensure we have the latest data
    refreshModuleActivities(moduleId);
  };

  // Function to refresh a module's activities from the server
  const refreshModuleActivities = async (moduleId) => {
    if (!moduleId) return;
    
    try {
      const moduleActivities = await fetchModuleActivities(moduleId);
      
      if (Array.isArray(moduleActivities)) {
        console.log(`Refreshed ${moduleActivities.length} activities for module ${moduleId}`);
        
        // Update the module with the refreshed activities
        setModules(prevModules => 
          prevModules.map(module => {
            if (module && module.id === moduleId) {
              // Merge activities, preserving local state not on server
              const existingActivitiesMap = new Map();
              if (Array.isArray(module.activities)) {
                module.activities.forEach(activity => {
                  if (activity && activity.id) {
                    existingActivitiesMap.set(activity.id, activity);
                  }
                });
              }
              
              // Process server activities
              const mergedActivities = [];
              moduleActivities.forEach(serverActivity => {
                if (!serverActivity || !serverActivity.id) return;
                
                const existingActivity = existingActivitiesMap.get(serverActivity.id);
                
                if (existingActivity) {
                  // Update with server data, prioritizing completed status
                  mergedActivities.push({
                    ...existingActivity,
                    ...serverActivity,
                    completed: serverActivity.completed || existingActivity.completed,
                  });
                  
                  // Remove from map to track what's been processed
                  existingActivitiesMap.delete(serverActivity.id);
                } else {
                  // Add new activity from server
                  mergedActivities.push(serverActivity);
                }
              });
              
              // Add any remaining local activities not on server
              existingActivitiesMap.forEach(activity => {
                mergedActivities.push(activity);
              });
              
              return {
                ...module,
                activities: mergedActivities,
              };
            }
            return module;
          })
        );
      }
    } catch (error) {
      console.error(`Error refreshing activities for module ${moduleId}:`, error);
    }
  };

  // Function to handle module updates (title, date)
  const handleModuleUpdate = async (moduleId, updatedModuleData) => {
    if (!moduleId || !updatedModuleData) return;
    
    try {
      // Update the module on the server
      const updatedModule = await updateModule(moduleId, updatedModuleData);
      
      // Update the local state
      setModules(prevModules => 
        prevModules.map(module => 
          module.id === moduleId 
            ? { ...module, ...updatedModule, activities: module.activities } 
            : module
        )
      );
    } catch (error) {
      console.error("Error updating module:", error);
      // Show an error notification or handle the error as needed
    }
  };

  const handleActivityCompletion = (moduleId, activityId) => {
    setModules((prevModules) =>
      prevModules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            activities: module.activities.map((activity) => {
              if (activity.id === activityId) {
                const updatedActivity = {
                  ...activity,
                  completed: true,
                  moduleId: moduleId, // Ensure moduleId is included
                };
                
                // Store the updated activity with completed status on the server
                fetch("/api/store-activity", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(updatedActivity),
                })
                  .then((response) => response.json())
                  .then((serverData) => {
                    console.log("Activity completion status stored on server:", serverData);
                  })
                  .catch((error) => {
                    console.error("Error storing activity completion status:", error);
                  });
                
                return updatedActivity;
              }
              return activity;
            }),
          };
        }
        return module;
      })
    );
  };

  const handleQuizAccess = () => {
    // Navigate to the saved quizzes page
    navigate("/saved-quizzes");
  };

  // Function to update module activities (add, edit, delete)
  const updateModuleActivities = (moduleId, updatedActivities, updatedModule = null) => {
    if (!Array.isArray(modules)) return;

    setModules(
      modules.map((module) => {
        if (module && module.id === moduleId) {
          // If full updated module is provided, use it but preserve the activities
          if (updatedModule) {
            return {
              ...updatedModule,
              activities: updatedActivities,
            };
          }
          // Otherwise just update the activities
          return {
            ...module,
            activities: updatedActivities,
          };
        }
        return module;
      })
    );
  };

  // Make the function available globally for debugging and direct access
  useEffect(() => {
    window.updateModuleActivities = updateModuleActivities;

    return () => {
      // Clean up when component unmounts
      delete window.updateModuleActivities;
    };
  }, [modules]); // Re-create when modules change to maintain closure with current state

  const selectedModule = Array.isArray(modules)
    ? modules.find((module) => module && module.id === selectedModuleId) ||
      modules[0]
    : null;

  return (
    <Container fluid className="platform-overview p-0">
      {loading && (
        <div className="preloading-indicator">
          <Spinner animation="border" variant="primary" size="sm" />
          <span className="ms-2">
            Loading modules and activities...
          </span>
        </div>
      )}
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
              onUpdateActivities={updateModuleActivities}
              onModuleUpdate={handleModuleUpdate}
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

      {/* Overall Progress - Moved outside the column structure */}
      <div className="fixed-bottom bg-white border-top py-2 px-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <small className="text-muted">
            {overallProgress}% - {completedActivities} ud af{" "}
            {totalActivities} moduler gennemført
          </small>
          <small className="text-muted">Total Fremgang</small>
        </div>
        <ProgressBar
          now={overallProgress}
          variant="primary"
          style={{ height: "8px" }}
        />
      </div>
    </Container>
  );
};

export default PlatformOverview;
