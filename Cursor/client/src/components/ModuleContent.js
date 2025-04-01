import React, { useState } from 'react';
import { Card, ProgressBar, Badge } from 'react-bootstrap';
import { 
  BsCheckCircleFill, 
  BsCircleFill, 
  BsFileEarmarkPdf, 
  BsFileEarmarkWord, 
  BsYoutube,
  BsListCheck 
} from 'react-icons/bs';
import ModuleTabs from './ModuleTabs';

const ModuleContent = ({ module, onActivityCompletion, onQuizAccess }) => {
  const [activeTab, setActiveTab] = useState('indhold');
  
  if (!module) return <div className="p-4">No module selected</div>;

  const activities = Array.isArray(module.activities) ? module.activities : [];
  const totalActivities = activities.length;
  const completedActivities = activities.filter(act => act && act.completed).length;
  const progress = totalActivities > 0 
    ? Math.round((completedActivities / totalActivities) * 100) 
    : 0;

  const getIconForType = (type) => {
    switch (type) {
      case 'pdf':
        return <BsFileEarmarkPdf className="text-danger" size={20} />;
      case 'youtube':
        return <BsYoutube className="text-danger" size={20} />;
      case 'word':
        return <BsFileEarmarkWord className="text-primary" size={20} />;
      case 'quiz':
        return <BsListCheck className="text-warning" size={20} />;
      default:
        return null;
    }
  };

  const handleActivityClick = (activity) => {
    if (!activity) return;
    
    if (activity.type === 'quiz') {
      onQuizAccess && onQuizAccess();
    } else {
      if (!activity.completed && onActivityCompletion) {
        onActivityCompletion(module.id, activity.id);
      }
      
      // Open external content if URL is provided
      if (activity.url) {
        window.open(activity.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div className="module-content p-4">
      <header className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div>
            <small className="text-muted d-block">{module.date || 'No date'}</small>
            <h1 className="h3 mb-0">{module.title || 'Unnamed Module'}</h1>
          </div>
        </div>
        
        {module.description && <p className="text-muted">{module.description}</p>}
        
        <ModuleTabs 
          moduleId={module.id}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="d-flex justify-content-between align-items-center mb-2 mt-4">
          <div className="text-muted small">
            {progress}% - {completedActivities} ud af {totalActivities} aktiviteter gennemført
          </div>
        </div>
        <ProgressBar now={progress} variant="primary" style={{ height: '8px' }} />
      </header>
      
      {activeTab === 'indhold' && (
        <div className="activities-container">
          {activities.length > 0 ? (
            activities.map(activity => {
              if (!activity) return null;
              
              return (
                <Card 
                  key={activity.id || Math.random().toString()} 
                  className={`mb-3 activity-card ${activity.completed ? 'completed' : ''}`}
                  onClick={() => handleActivityClick(activity)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center">
                      <div className="activity-icon me-3">
                        {getIconForType(activity.type)}
                      </div>
                      
                      <div className="activity-content flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 className="mb-1">{activity.title || 'Unnamed Activity'}</h5>
                            {activity.description && (
                              <div className="text-muted small">{activity.description}</div>
                            )}
                            {activity.type === 'youtube' && activity.url && (
                              <div className="text-muted small text-truncate" style={{ maxWidth: '500px' }}>
                                {activity.url}
                              </div>
                            )}
                          </div>
                          
                          <div className="ms-2">
                            {activity.completed ? (
                              <BsCheckCircleFill className="text-success" />
                            ) : (
                              <BsCircleFill className="text-secondary" style={{ opacity: 0.3 }} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {activity.isNew && (
                      <Badge bg="danger" className="position-absolute top-0 end-0 m-2">
                        Ny
                      </Badge>
                    )}
                  </Card.Body>
                </Card>
              );
            })
          ) : (
            <div className="text-center p-4">
              <p className="text-muted">No activities found for this module.</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'forum' && (
        <div className="forum-placeholder p-4 text-center bg-light rounded">
          <p className="mb-0 text-muted">Forum indhold vil blive vist her</p>
        </div>
      )}
    </div>
  );
};

export default ModuleContent; 