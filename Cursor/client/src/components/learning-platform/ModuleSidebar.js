import React from 'react';
import { ListGroup } from 'react-bootstrap';
import { BsCheckCircleFill, BsCircleFill } from 'react-icons/bs';

const ModuleSidebar = ({ modules = [], selectedModuleId, onModuleSelect, userRole = 'teacher' }) => {
  // Ensure modules is always an array
  const safeModules = Array.isArray(modules) ? modules : [];
  
  return (
    <div className="module-sidebar p-3">
      <div className="d-flex align-items-center mb-3">
        <button 
          className="btn btn-link text-decoration-none p-0 text-dark" 
          onClick={() => window.history.back()}
        >
          ← Fag
        </button>
      </div>
      
      <div className="course-header d-flex align-items-center mb-4">
        <div className="course-icon me-3">
          <img 
            src="/abc-icon.svg" 
            alt="Course Icon" 
            style={{ width: '40px', height: '40px' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/40?text=ABC';
            }}
          />
        </div>
        <div>
          <h2 className="h5 mb-0">Dansk 2.A</h2>
          <small className="text-muted">{userRole === 'teacher' ? 'Lærer' : 'Elev'} visning</small>
        </div>
      </div>
      
      <div className="text-muted mb-3">
        <small>Undervisningsbeskrivelse</small>
      </div>
      
      <ListGroup variant="flush" className="module-list">
        {safeModules.length > 0 ? (
          safeModules.map(module => {
            if (!module) return null;
            
            const moduleActivities = Array.isArray(module.activities) ? module.activities : [];
            const totalActivities = moduleActivities.length;
            const completedActivities = moduleActivities.filter(act => act && act.completed).length;
            const allCompleted = totalActivities > 0 && completedActivities === totalActivities;
            
            return (
              <ListGroup.Item 
                key={module.id || Math.random().toString()}
                action
                active={module.id === selectedModuleId}
                onClick={() => onModuleSelect && onModuleSelect(module.id)}
                className="d-flex justify-content-between align-items-center border-start-0 border-end-0"
              >
                <div className="d-flex flex-column w-100">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="text-nowrap">{module.date || 'No date'}</div>
                    
                    {userRole === 'student' && (
                      allCompleted ? (
                        <BsCheckCircleFill className="text-success" />
                      ) : (
                        <BsCircleFill className={completedActivities > 0 ? "text-warning" : "text-secondary"} style={{ opacity: 0.5 }} />
                      )
                    )}
                  </div>
                  
                  <div>
                    <span className="text-truncate">{module.title}</span>
                    {module.subtitle && <small className="text-muted d-block">{module.subtitle}</small>}
                    
                    {/* Add progress indicator for students */}
                    {userRole === 'student' && totalActivities > 0 && (
                      <small className="text-muted d-block">
                        {completedActivities} af {totalActivities} aktiviteter gennemført
                      </small>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            );
          })
        ) : (
          <div className="text-center p-3">
            <p className="text-muted">No modules available.</p>
          </div>
        )}
      </ListGroup>
    </div>
  );
};

export default ModuleSidebar; 