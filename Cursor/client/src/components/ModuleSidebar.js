import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { usePlatformContext } from '../context/PlatformContext';
import { BsCircleFill, BsCheckCircleFill } from 'react-icons/bs';

const ModuleSidebar = () => {
  const { modules, selectedModule, selectModule, calculateModuleProgress } = usePlatformContext();

  return (
    <div className="module-sidebar">
      <h5 className="mb-3">Moduler</h5>
      
      <ListGroup className="module-list">
        {modules.map(module => {
          const progress = calculateModuleProgress(module.id);
          const isCompleted = progress.percentage === 100;
          const isActive = selectedModule && module.id === selectedModule.id;
          
          return (
            <ListGroup.Item 
              key={module.id}
              action
              active={isActive}
              onClick={() => selectModule(module.id)}
              className="d-flex flex-column align-items-start mb-2 rounded border-0 position-relative"
              style={{ 
                padding: '12px 15px',
                backgroundColor: isActive ? '#e9ecef' : '#f8f9fa',
                borderLeft: isActive ? '4px solid #0d6efd' : '4px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Completion indicator */}
              <div className="position-absolute" style={{ right: '15px', top: '12px' }}>
                {isCompleted ? (
                  <BsCheckCircleFill className="text-success" />
                ) : (
                  <span className="text-muted small">
                    {progress.percentage}%
                  </span>
                )}
              </div>

              {/* Module date */}
              <small className="text-muted">{module.date}</small>
              
              {/* Module title */}
              <div className="fw-500 mt-1">{module.title}</div>
              
              {/* Module progress indicators */}
              <div className="mt-2 w-100">
                <div className="progress" style={{ height: '5px' }}>
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${progress.percentage}%` }}
                    aria-valuenow={progress.percentage} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <small className="text-muted">
                    {progress.completed} / {progress.total} aktiviteter
                  </small>
                  {progress.completed > 0 && (
                    <small className="text-muted">
                      {progress.percentage}%
                    </small>
                  )}
                </div>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </div>
  );
};

export default ModuleSidebar; 