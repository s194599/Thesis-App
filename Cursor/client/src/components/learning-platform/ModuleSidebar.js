import React, { useState, useEffect } from 'react';
import { ListGroup, Card, Button, Modal, Form, Tab, Tabs, Image } from 'react-bootstrap';
import { BsCheckCircleFill, BsCircleFill, BsPencil, BsUpload, BsImage } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import '../../styles/ModuleSidebar.css';

const ModuleSidebar = ({ modules = [], selectedModuleId, onModuleSelect, userRole = 'teacher', onModuleUpdate }) => {
  const navigate = useNavigate();
  const [showIconModal, setShowIconModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  // Ensure modules is always an array
  const safeModules = Array.isArray(modules) ? modules : [];
  
  // Predefined icons gallery
  const predefinedIcons = [
    { name: 'Book', url: 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png' },
    { name: 'Graduation', url: 'https://cdn-icons-png.flaticon.com/512/2232/2232685.png' },
    { name: 'Science', url: 'https://cdn-icons-png.flaticon.com/512/2232/2232681.png' },
    { name: 'Math', url: 'https://cdn-icons-png.flaticon.com/512/2232/2232683.png' },
    { name: 'Language', url: 'https://cdn-icons-png.flaticon.com/512/2232/2232687.png' },
    { name: 'History', url: 'https://cdn-icons-png.flaticon.com/512/2232/2232682.png' }
  ];

  // Load saved icon from localStorage on component mount
  useEffect(() => {
    const savedIcon = localStorage.getItem('courseIcon');
    if (savedIcon) {
      setSelectedIcon(savedIcon);
    }
  }, []);

  const handleIconFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconSelect = (iconUrl) => {
    setSelectedIcon(iconUrl);
    setIconPreview(null);
    setIconFile(null);
  };

  const handleSaveIcon = async () => {
    try {
      let iconUrl = selectedIcon;

      // If a file was uploaded, handle the upload
      if (iconFile) {
        const formData = new FormData();
        formData.append('icon', iconFile);

        const response = await fetch('/api/upload-icon', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to upload icon');
        }

        const data = await response.json();
        iconUrl = data.url;
      }

      // Save the icon URL to localStorage
      localStorage.setItem('courseIcon', iconUrl);
      setSelectedIcon(iconUrl);

      // Update the module if we're in a specific module context
      if (selectedModuleId && onModuleUpdate) {
        onModuleUpdate(selectedModuleId, { icon: iconUrl });
      }

      setShowIconModal(false);
    } catch (error) {
      console.error('Error saving icon:', error);
      alert('Failed to save icon. Please try again.');
    }
  };

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
          <div className="course-icon-wrapper">
            <img 
              src={selectedIcon || '/abc-icon.svg'} 
              alt="Course Icon" 
              style={{ width: '40px', height: '40px' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/40?text=ABC';
              }}
            />
            {userRole === 'teacher' && (
              <div 
                className="course-icon-edit"
                onClick={() => setShowIconModal(true)}
              >
                <BsPencil size={14} />
              </div>
            )}
          </div>
        </div>
        <div>
          <h5 className="mb-0">Dansk 2.A</h5>
          <small className="text-muted">Klasseliste</small>
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

      {/* Icon Selection Modal */}
      <Modal show={showIconModal} onHide={() => setShowIconModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Customize Course Icon</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="upload" title="Upload">
              <Form.Group className="mb-3">
                <Form.Label>Upload Custom Icon</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleIconFileChange}
                />
                {iconPreview && (
                  <div className="mt-3">
                    <Image src={iconPreview} thumbnail style={{ maxWidth: '100px' }} />
                  </div>
                )}
              </Form.Group>
            </Tab>
            <Tab eventKey="gallery" title="Gallery">
              <div className="d-flex flex-wrap gap-2 mt-3">
                {predefinedIcons.map((icon, index) => (
                  <div
                    key={index}
                    className={`icon-preview ${selectedIcon === icon.url ? 'selected' : ''}`}
                    onClick={() => handleIconSelect(icon.url)}
                  >
                    <img
                      src={icon.url}
                      alt={icon.name}
                      style={{ width: '40px', height: '40px' }}
                    />
                  </div>
                ))}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowIconModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveIcon}>
            Save Icon
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ModuleSidebar; 