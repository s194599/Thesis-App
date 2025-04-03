import React, { useState, useEffect } from "react";
import { Container, Row, Col, ProgressBar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ModuleSidebar from "./ModuleSidebar";
import ModuleContent from "./ModuleContent";
import mockModules from "./data/mockModules";

const PlatformOverview = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  // Load data from localStorage or use mockData
  useEffect(() => {
    const savedModules = localStorage.getItem("learningModules");
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

    // Set default selected module
    const savedSelectedModuleId = localStorage.getItem("selectedModuleId");
    if (savedSelectedModuleId) {
      setSelectedModuleId(savedSelectedModuleId);
      // Fetch activities for the initially selected module
      fetchServerStoredActivities(savedSelectedModuleId, initialModules);
    } else if (initialModules.length > 0) {
      setSelectedModuleId(initialModules[0]?.id || null);
      // Fetch activities for the initially selected module
      fetchServerStoredActivities(initialModules[0]?.id, initialModules);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (modules && modules.length > 0) {
      localStorage.setItem("learningModules", JSON.stringify(modules));
    }

    if (selectedModuleId) {
      localStorage.setItem("selectedModuleId", selectedModuleId);
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
    
    // Fetch server-stored activities for the newly selected module
    // This ensures we get the latest activities from the server
    // when switching modules
    fetchServerStoredActivities(moduleId, modules);
  };

  // Function to handle module updates (title, date)
  const handleModuleUpdate = (moduleId, updatedModule) => {
    setModules(prevModules => 
      prevModules.map(module => 
        module.id === moduleId ? { ...module, ...updatedModule } : module
      )
    );
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
              activities: updatedActivities || module.activities,
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

  // Function to fetch server-stored activities for a module
  const fetchServerStoredActivities = (moduleId, currentModules) => {
    if (!moduleId) return;
    
    // Use relative URL and let proxy configuration handle redirection
    fetch(`/api/module-activities/${moduleId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (
          data.success &&
          Array.isArray(data.activities) &&
          data.activities.length > 0
        ) {
          console.log(
            `Fetched ${data.activities.length} server-stored activities for module ${moduleId}`
          );

          // Update the module with server-stored activities
          setModules((prevModules) => {
            // Use the provided modules array or the current state
            const modulesToUpdate = currentModules || prevModules;

            return modulesToUpdate.map((module) => {
              if (module.id === moduleId) {
                // Filter server activities to ensure they belong to this module
                const moduleActivities = data.activities.filter(
                  act => act.moduleId === moduleId
                );
                
                // Create a map of existing activities by ID for easier comparison
                const existingActivitiesMap = new Map();
                if (Array.isArray(module.activities)) {
                  module.activities.forEach((activity) => {
                    if (activity && activity.id) {
                      existingActivitiesMap.set(activity.id, activity);
                    }
                  });
                }

                // Create a new array to hold the merged activities
                const mergedActivities = Array.isArray(module.activities) ? [...module.activities] : [];

                // Process server activities
                moduleActivities.forEach((serverActivity) => {
                  const existingActivity = existingActivitiesMap.get(serverActivity.id);

                  if (!existingActivity) {
                    // If activity doesn't exist locally, add it
                    mergedActivities.push(serverActivity);
                  } else {
                    // If it exists, update it but preserve any local state not on server
                    const index = mergedActivities.findIndex(
                      (a) => a.id === serverActivity.id
                    );
                    if (index !== -1) {
                      // Update with server data, prioritizing completed status
                      mergedActivities[index] = {
                        ...existingActivity,
                        ...serverActivity,
                        // Ensure the most "complete" state wins
                        completed:
                          serverActivity.completed ||
                          existingActivity.completed,
                      };
                    }
                  }
                });

                // Return the updated module with merged activities
                return {
                  ...module,
                  activities: mergedActivities,
                };
              }
              return module;
            });
          });
        }
      })
      .catch(error => {
        console.error(
          `Error fetching activities for module ${moduleId}: ${error.message}`
        );
      });
  };

  const selectedModule = Array.isArray(modules)
    ? modules.find((module) => module && module.id === selectedModuleId) ||
      modules[0]
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
