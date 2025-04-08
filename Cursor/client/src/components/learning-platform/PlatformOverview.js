import React, { useState, useEffect } from "react";
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

  // Load data from server or localStorage
  useEffect(() => {
    const loadModules = async () => {
      setLoading(true);

      try {
        // Load user role from localStorage first
        const savedUserRole = localStorage.getItem("userRole");
        if (savedUserRole) {
          setUserRole(savedUserRole);
        }

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

              // Set default selected module
              const savedSelectedModuleId =
                localStorage.getItem("selectedModuleId");
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
          // Count activities for debugging
          let serverQuizCount = 0;
          let localQuizCount = 0;

          // Create a map of all local quizzes for quick lookup
          const localQuizMap = new Map();

          if (localModules.length > 0) {
            localModules.forEach((module) => {
              if (module && Array.isArray(module.activities)) {
                module.activities.forEach((activity) => {
                  if (activity && activity.type === "quiz") {
                    localQuizCount++;
                    // Create a key combining moduleId and activityId for unique identification
                    const key = `${module.id}:${activity.id}`;
                    localQuizMap.set(key, activity);
                  }
                });
              }
            });
          }

          serverModules.forEach((module) => {
            if (module && Array.isArray(module.activities)) {
              module.activities.forEach((activity) => {
                if (activity && activity.type === "quiz") {
                  serverQuizCount++;
                }
              });
            }
          });

          console.log(
            `Loaded ${serverModules.length} modules from server with ${serverQuizCount} quizzes (localStorage had ${localQuizCount} quizzes)`
          );

          // If we have more quizzes in localStorage than server, sync them
          if (localQuizCount > serverQuizCount) {
            console.log(
              `Found ${
                localQuizCount - serverQuizCount
              } more quizzes in localStorage - syncing to server data`
            );

            // Copy quizzes from localStorage to server data if they're missing
            serverModules.forEach((module) => {
              if (!module || !Array.isArray(module.activities)) return;

              // Check if this module exists in localStorage
              const localModule = localModules.find((m) => m.id === module.id);
              if (!localModule || !Array.isArray(localModule.activities))
                return;

              // Find local quizzes for this module that don't exist in server data
              const localQuizzesForModule = localModule.activities.filter(
                (a) =>
                  a &&
                  a.type === "quiz" &&
                  !module.activities.some((sa) => sa.id === a.id)
              );

              if (localQuizzesForModule.length > 0) {
                console.log(
                  `Adding ${localQuizzesForModule.length} missing quizzes to module ${module.id} from localStorage`
                );
                module.activities = [
                  ...module.activities,
                  ...localQuizzesForModule,
                ];
              }
            });
          }

          // Set total modules to track loading progress
          setTotalModulesToLoad(serverModules.length);

          // Refresh activities for each module to ensure completion status is up-to-date
          const modulesWithUpdatedActivities = [...serverModules];

          // Process modules sequentially to avoid overwhelming the server
          for (const module of serverModules) {
            if (module && module.id) {
              try {
                const moduleActivities = await fetchModuleActivities(module.id);

                // Count quizzes for debugging
                const quizActivities = moduleActivities.filter(
                  (a) => a && a.type === "quiz"
                );
                console.log(
                  `Preloaded ${moduleActivities.length} activities for module ${module.id}, including ${quizActivities.length} quizzes`
                );

                // If we have local modules, merge them to preserve quiz data
                if (localModules.length > 0) {
                  const localModule = localModules.find(
                    (m) => m.id === module.id
                  );
                  if (localModule && Array.isArray(localModule.activities)) {
                    const localQuizzes = localModule.activities.filter(
                      (a) => a && a.type === "quiz"
                    );

                    // Check for quizzes that exist locally but not in server data
                    for (const localQuiz of localQuizzes) {
                      if (
                        !moduleActivities.some(
                          (a) => a.id === localQuiz.id && a.type === "quiz"
                        )
                      ) {
                        console.log(
                          `Adding missing quiz from localStorage: ${localQuiz.title}`
                        );
                        moduleActivities.push(localQuiz);
                      }
                    }
                  }
                }

                // Find the module in our array and update its activities
                const moduleIndex = modulesWithUpdatedActivities.findIndex(
                  (m) => m.id === module.id
                );
                if (moduleIndex !== -1) {
                  modulesWithUpdatedActivities[moduleIndex] = {
                    ...modulesWithUpdatedActivities[moduleIndex],
                    activities: moduleActivities,
                  };
                }

                // Update loading counter for progress indication
                setLoadedModulesCount((prev) => prev + 1);
              } catch (error) {
                console.error(
                  `Error preloading activities for module ${module.id}:`,
                  error
                );
              }
            }
          }

          // Always update with server data, which will have the latest activity completion status
          setModules(modulesWithUpdatedActivities);
          setInitialLoadComplete(true);

          // Set selected module if not already set
          if (!selectedModuleId && modulesWithUpdatedActivities.length > 0) {
            const savedSelectedModuleId =
              localStorage.getItem("selectedModuleId");
    if (savedSelectedModuleId) {
      setSelectedModuleId(savedSelectedModuleId);
    } else {
              setSelectedModuleId(modulesWithUpdatedActivities[0]?.id || null);
            }
          }

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

    // Save user role when it changes
    localStorage.setItem("userRole", userRole);
  }, [modules, selectedModuleId, initialLoadComplete, userRole]);

  // Function to refresh all data from the server
  const refreshData = async () => {
    try {
      // Get initial modules from server
      const serverModules = await fetchModulesWithActivities();
      if (serverModules.length > 0) {
        console.log(`Refreshing ${serverModules.length} modules from server`);

        // Create a copy of current modules to preserve any local state
        const currentModules = [...modules];
        const currentModulesMap = new Map();
        currentModules.forEach((module) => {
          if (module && module.id) {
            currentModulesMap.set(module.id, module);
          }
        });

        // Create a copy to update with refreshed activities
        const modulesWithUpdatedActivities = [...serverModules];

        // Process modules sequentially to avoid overwhelming the server
        for (const module of serverModules) {
          if (module && module.id) {
            try {
              const moduleActivities = await fetchModuleActivities(module.id);
              console.log(
                `Refreshed ${moduleActivities.length} activities for module ${module.id}`
              );

              // Find the module in our array and update its activities
              const moduleIndex = modulesWithUpdatedActivities.findIndex(
                (m) => m.id === module.id
              );
              if (moduleIndex !== -1) {
                // Check if we have this module in current state to merge activities
                const existingModule = currentModulesMap.get(module.id);
                let mergedActivities = moduleActivities;

                if (
                  existingModule &&
                  Array.isArray(existingModule.activities)
                ) {
                  // Create a map of existing activities for easy lookup
                  const existingActivitiesMap = new Map();
                  existingModule.activities.forEach((activity) => {
                    if (activity && activity.id) {
                      existingActivitiesMap.set(activity.id, activity);
                    }
                  });

                  // Merge activities preserving quiz data and completion status
                  mergedActivities = moduleActivities.map((serverActivity) => {
                    if (!serverActivity || !serverActivity.id)
                      return serverActivity;

                    const existingActivity = existingActivitiesMap.get(
                      serverActivity.id
                    );
                    if (existingActivity) {
                      // Special handling for quiz activities
                      if (
                        serverActivity.type === "quiz" ||
                        existingActivity.type === "quiz"
                      ) {
                        // Log for debugging
                        console.log(
                          `Merging quiz activity: ${
                            serverActivity.title || existingActivity.title
                          }`
                        );

                        return {
                          ...existingActivity,
                          ...serverActivity,
                          // Always preserve quiz-specific properties from both sources
                          quizId:
                            serverActivity.quizId || existingActivity.quizId,
                          completed:
                            serverActivity.completed ||
                            existingActivity.completed,
                          ...(serverActivity.quizScore
                            ? { quizScore: serverActivity.quizScore }
                            : {}),
                          ...(existingActivity.quizScore
                            ? { quizScore: existingActivity.quizScore }
                            : {}),
                        };
                      }

                      // For non-quiz activities
                      return {
                        ...existingActivity,
                        ...serverActivity,
                        completed:
                          serverActivity.completed ||
                          existingActivity.completed,
                      };
                    }

                    return serverActivity;
                  });

                  // Also preserve any activities that exist locally but not on server
                  existingModule.activities.forEach((activity) => {
                    if (
                      activity &&
                      activity.id &&
                      !moduleActivities.some((a) => a.id === activity.id)
                    ) {
                      // Especially preserve quiz activities
                      if (activity.type === "quiz" && activity.quizId) {
                        console.log(
                          `Preserving local-only quiz: ${activity.title} (${activity.id})`
                        );
                        mergedActivities.push(activity);
                      }
                      // Also preserve other local-only activities if needed
                      else if (activity.isNew || activity.completed) {
                        mergedActivities.push(activity);
                      }
                    }
                  });
                }

                modulesWithUpdatedActivities[moduleIndex] = {
                  ...modulesWithUpdatedActivities[moduleIndex],
                  activities: mergedActivities,
                };
              }
            } catch (error) {
              console.error(
                `Error refreshing activities for module ${module.id}:`,
                error
              );
            }
          }
        }

        // Update with the refreshed data
        setModules(modulesWithUpdatedActivities);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Handle role toggle
  const handleRoleToggle = (role) => {
    setUserRole(role);
    localStorage.setItem("userRole", role); // Immediately save to ensure it's stored

    // Refresh data when switching roles to ensure we have the latest status
    refreshData();
  };

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
      // Get the current module with its existing activities first
      const currentModule = modules.find((m) => m && m.id === moduleId);
      let currentActivities = [];

      if (currentModule && Array.isArray(currentModule.activities)) {
        currentActivities = [...currentModule.activities];
        // Log the current quizzes in the module
        const currentQuizzes = currentActivities.filter(
          (a) => a && a.type === "quiz"
        );
        console.log(
          `Current module ${moduleId} has ${currentActivities.length} activities, including ${currentQuizzes.length} quizzes before refresh`
        );
      }

      // Fetch fresh activities from server
      const serverActivities = await fetchModuleActivities(moduleId);

      if (Array.isArray(serverActivities)) {
        // Log the server-fetched quizzes
        const serverQuizzes = serverActivities.filter(
          (a) => a && a.type === "quiz"
        );
        console.log(
          `Server returned ${serverActivities.length} activities for module ${moduleId}, including ${serverQuizzes.length} quizzes`
        );

        // Update the module with the refreshed activities, merging carefully
        setModules((prevModules) =>
          prevModules.map((module) => {
            if (module && module.id === moduleId) {
              // Build a comprehensive map of all activities by ID
              const activityMap = new Map();

              // First add server activities to the map
              serverActivities.forEach((activity) => {
                if (activity && activity.id) {
                  activityMap.set(activity.id, { ...activity });
                }
              });

              // Then merge with current activities, preserving client-side state and quizzes
              if (Array.isArray(currentActivities)) {
                currentActivities.forEach((activity) => {
                  if (activity && activity.id) {
                    // If it's a quiz or it already exists in the map
                    if (
                      activity.type === "quiz" ||
                      activityMap.has(activity.id)
                    ) {
                      const existingActivity = activityMap.get(activity.id);

                      // For quizzes, ensure we preserve all essential properties
                      if (activity.type === "quiz") {
                        activityMap.set(activity.id, {
                          ...activity,
                          ...(existingActivity || {}),
                          type: "quiz", // Always ensure type remains 'quiz'
                          quizId: activity.quizId || existingActivity?.quizId, // Keep quizId
                          completed:
                            activity.completed || existingActivity?.completed,
                          title: activity.title || existingActivity?.title,
                        });
                      }
                      // For other activities, merge prioritizing server data but keep completion status
                      else if (existingActivity) {
                        activityMap.set(activity.id, {
                          ...activity,
                          ...existingActivity,
                          completed:
                            existingActivity.completed || activity.completed,
                        });
                      }
                    }
                    // If it's not in the map at all, add it (might be client-only data)
                    else if (!activityMap.has(activity.id)) {
                      activityMap.set(activity.id, { ...activity });
                    }
                  }
                });
              }

              // Convert map back to array
              const mergedActivities = Array.from(activityMap.values());

              // Log what we're saving
              const finalQuizzes = mergedActivities.filter(
                (a) => a && a.type === "quiz"
              );
              console.log(
                `Final merged data: ${mergedActivities.length} activities for module ${moduleId}, including ${finalQuizzes.length} quizzes`
              );

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
      console.error(
        `Error refreshing activities for module ${moduleId}:`,
        error
      );
    }
  };

  // Function to handle module updates (title, date)
  const handleModuleUpdate = async (moduleId, updatedModuleData) => {
    if (!moduleId || !updatedModuleData) return;

    try {
      // Update the module on the server
      const updatedModule = await updateModule(moduleId, updatedModuleData);

      // Update the local state
      setModules((prevModules) =>
        prevModules.map((module) =>
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

  const handleActivityCompletion = async (moduleId, activityId) => {
    // First update the UI optimistically for a responsive feel
    setModules((prevModules) =>
      prevModules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            activities: module.activities.map((activity) => {
              if (activity.id === activityId) {
                return {
                  ...activity,
                  completed: true,
                };
                  }
                  return activity;
            }),
          };
        }
        return module;
      })
    );

    // Then update on the server
    try {
      const response = await fetch("/api/complete-activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
          activityId: activityId,
          moduleId: moduleId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to mark activity as completed:", data.message);
      } else {
        console.log("Activity marked as completed:", data);
      }
    } catch (error) {
      console.error("Error marking activity as completed:", error);
    }
  };

  const handleQuizAccess = () => {
    // Navigate to the saved quizzes page
    navigate("/saved-quizzes");
  };

  // Function to update module activities (add, edit, delete)
  const updateModuleActivities = (
    moduleId,
    updatedActivities,
    updatedModule = null
  ) => {
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
      {/* Role toggle switch with label */}
      <div className="role-toggle-container position-fixed end-0 top-0 m-3 z-3">
        <div className="d-flex align-items-center bg-light p-2 rounded shadow-sm">
          <span className="me-2 fw-bold small text-secondary">Vælg rolle:</span>
          <ButtonGroup>
            <ToggleButton
              id="role-toggle-student"
              type="radio"
              variant={userRole === "student" ? "primary" : "outline-primary"}
              name="radio"
              value="student"
              checked={userRole === "student"}
              onChange={(e) => handleRoleToggle(e.currentTarget.value)}
            >
              Elev
            </ToggleButton>
            <ToggleButton
              id="role-toggle-teacher"
              type="radio"
              variant={userRole === "teacher" ? "primary" : "outline-primary"}
              name="radio"
              value="teacher"
              checked={userRole === "teacher"}
              onChange={(e) => handleRoleToggle(e.currentTarget.value)}
            >
              Lærer
            </ToggleButton>
          </ButtonGroup>
        </div>
      </div>

      {loading && (
        <div
          className="preloading-indicator position-fixed bg-white py-2 px-3 rounded shadow-sm"
          style={{ top: "80px", right: "20px", zIndex: 1050 }}
        >
          <div className="d-flex align-items-center">
            <Spinner animation="border" variant="primary" size="sm" />
            <span className="ms-2">
              Loading modules and activities...
              {totalModulesToLoad > 0 &&
                ` (${loadedModulesCount}/${totalModulesToLoad})`}
            </span>
          </div>
          {totalModulesToLoad > 0 && (
            <ProgressBar
              now={(loadedModulesCount / totalModulesToLoad) * 100}
              variant="primary"
              style={{ height: "6px" }}
              className="mt-1"
            />
          )}
        </div>
      )}
      <Row className="g-0 min-vh-100">
        <Col md={3} className="sidebar-col bg-light border-end">
          <ModuleSidebar
            modules={modules || []}
            selectedModuleId={selectedModuleId}
            onModuleSelect={handleModuleSelect}
            userRole={userRole}
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

      {/* Overall Progress - Only visible in student mode */}
      {userRole === "student" && (
          <div className="fixed-bottom bg-white border-top py-2 px-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted">
              {overallProgress}% - {completedActivities} ud af {totalActivities}{" "}
              moduler gennemført
              </small>
              <small className="text-muted">Total Fremgang</small>
            </div>
            <ProgressBar
              now={overallProgress}
              variant="primary"
              style={{ height: "8px" }}
            />
          </div>
      )}
    </Container>
  );
};

export default PlatformOverview;
