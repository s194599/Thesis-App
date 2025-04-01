import React from 'react';
import { Card, Badge, Button, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  BsCircleFill, 
  BsCheckCircleFill, 
  BsFileEarmarkPdf, 
  BsFileEarmarkWord, 
  BsYoutube, 
  BsListCheck 
} from 'react-icons/bs';
import { usePlatformContext } from '../context/PlatformContext';

const ModuleContent = () => {
  const { 
    selectedModule, 
    markMaterialCompleted, 
    calculateModuleProgress 
  } = usePlatformContext();

  if (!selectedModule) {
    return <div className="p-4 text-center">Vælg et modul for at se indholdet</div>;
  }

  const progress = calculateModuleProgress(selectedModule.id);

  const handleMaterialClick = (materialId) => {
    markMaterialCompleted(selectedModule.id, materialId);
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <BsFileEarmarkPdf size={20} className="text-danger" />;
      case 'doc':
        return <BsFileEarmarkWord size={20} className="text-primary" />;
      case 'video':
        return <BsYoutube size={20} className="text-danger" />;
      case 'quiz':
        return <BsListCheck size={20} className="text-success" />;
      default:
        return <BsCircleFill size={20} className="text-muted" />;
    }
  };

  return (
    <div className="module-content">
      <div className="module-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="text-muted mb-1">{selectedModule.date}</h6>
            <h2>{selectedModule.title}</h2>
          </div>
          <Badge bg="light" text="dark" className="p-2">
            <span>{progress.percentage}% færdig</span>
          </Badge>
        </div>
        
        <p className="text-muted mt-2">{selectedModule.description}</p>
        
        <div className="progress-section mt-3">
          <ProgressBar 
            now={progress.percentage} 
            label={`${progress.percentage}%`} 
            variant="primary" 
            className="mb-2"
            style={{ height: '8px' }}
          />
          <small className="text-muted">{progress.completed} ud af {progress.total} aktiviteter gennemført</small>
        </div>
      </div>

      <h5 className="mb-3">Materialer</h5>
      
      <div className="materials-list">
        {selectedModule.materials.map(material => (
          <Card 
            key={material.id} 
            className="mb-3 material-card border-0 shadow-sm"
          >
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                {/* Status indicator */}
                <div 
                  className="status-indicator me-3"
                  onClick={() => handleMaterialClick(material.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {material.completed ? (
                    <BsCheckCircleFill className="text-success" size={22} />
                  ) : (
                    <BsCircleFill className="text-muted opacity-50" size={22} />
                  )}
                </div>
                
                {/* Material icon and content */}
                <div className="d-flex align-items-center flex-grow-1">
                  <div className="me-3">
                    {getMaterialIcon(material.type)}
                  </div>
                  
                  <div className="flex-grow-1">
                    <div className="material-title fw-500">
                      {material.title}
                    </div>
                    <div className="material-type small text-muted text-capitalize">
                      {material.type === 'pdf' ? 'PDF dokument' : 
                       material.type === 'doc' ? 'Word dokument' : 
                       material.type === 'video' ? 'Video' : 'Quiz'}
                    </div>
                  </div>
                </div>
                
                {/* Action button */}
                <div className="ms-3">
                  {material.type === 'quiz' ? (
                    <Link to={`/take-quiz/${material.quizId}`}>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleMaterialClick(material.id)}
                      >
                        Åbn Quiz
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      as="a" 
                      href={material.url} 
                      target="_blank"
                      onClick={() => handleMaterialClick(material.id)}
                    >
                      Åbn
                    </Button>
                  )}
                </div>
              </div>
              
              {/* For videos, show thumbnail */}
              {material.type === 'video' && material.thumbnail && (
                <div className="video-thumbnail mt-3">
                  <a 
                    href={material.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => handleMaterialClick(material.id)}
                  >
                    <img 
                      src={material.thumbnail} 
                      alt={material.title} 
                      className="w-100 rounded" 
                      style={{ maxHeight: '180px', objectFit: 'cover' }} 
                    />
                  </a>
                </div>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModuleContent; 