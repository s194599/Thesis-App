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
    if (savedModules) {
      try {
        setModules(JSON.parse(savedModules));
      } catch (error) {
        console.error("Error parsing saved modules:", error);
        setModules(mockModules);
      }
    } else {
      setModules(mockModules);
    }
    
    // Set default selected module
    const savedSelectedModuleId = localStorage.getItem('selectedModuleId');
    if (savedSelectedModuleId) {
      setSelectedModuleId(savedSelectedModuleId);
    } else {
      setSelectedModuleId(mockModules[0]?.id || null);
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
    
    setModules(modules.map(module => {
      if (module && module.id === moduleId) {
        return {
          ...module,
          activities: Array.isArray(module.activities) 
            ? module.activities.map(activity => {
                if (activity && activity.id === activityId) {
                  return { ...activity, completed: true };
                }
                return activity;
              })
            : []
        };
      }
      return module;
    }));
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