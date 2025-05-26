import React, { useState, useEffect } from 'react';
import { ListGroup, Card, Button, Modal, Form, Tab, Tabs, Image } from 'react-bootstrap';
import { BsCheckCircleFill, BsCircleFill, BsPencil, BsUpload, BsImage, BsPlusCircle, BsX, BsCalendar, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/ModuleSidebar.css';
import { createModule, deleteModule } from '../../services/moduleService';

const ModuleSidebar = ({ modules = [], selectedModuleId, onModuleSelect, userRole = 'teacher', onModuleUpdate, onSidebarStateChange }) => {
  const navigate = useNavigate();
  const [showIconModal, setShowIconModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [renderKey, setRenderKey] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('Dansk 2.A'); // Default value
  const [newModule, setNewModule] = useState({
    title: '',
    date: new Date(),
    description: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setRenderKey(prevKey => prevKey + 1);
  }, [userRole]);

  // Load minimized state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarMinimized');
    if (savedState) {
      setIsMinimized(savedState === 'true');
    }
  }, []);

  // Save minimized state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarMinimized', isMinimized);
    if (onSidebarStateChange) {
      onSidebarStateChange(isMinimized);
    }
  }, [isMinimized, onSidebarStateChange]);

  // Load course title from localStorage
  useEffect(() => {
    const loadCourseTitle = () => {
      const selectedCourse = localStorage.getItem('selectedCourse');
      if (selectedCourse) {
        // Map ID to a display name with grade
        const courseMap = {
          'dansk': 'Dansk 2.A',
          'historie': 'Historie 2.A',
          'engelsk': 'Engelsk 2.A',
          'samfundsfag': 'Samfundsfag 2.A'
        };
        setCourseTitle(courseMap[selectedCourse] || 'Dansk 2.A');
      }
    };
    loadCourseTitle();
  }, []);

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
    // If we have a selected module and it has an icon, use that
    const selectedModule = safeModules.find(module => module.id === selectedModuleId);
    if (selectedModule && selectedModule.icon) {
      setSelectedIcon(selectedModule.icon);
    } else {
      // Otherwise, fall back to localStorage
      const savedIcon = localStorage.getItem('courseIcon');
      if (savedIcon) {
        setSelectedIcon(savedIcon);
      }
    }
  }, [selectedModuleId, safeModules]);

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

      // Save the icon URL to localStorage as a fallback
      localStorage.setItem('courseIcon', iconUrl);
      setSelectedIcon(iconUrl);

      // Update the module if we're in a specific module context
      if (selectedModuleId && onModuleUpdate) {
        console.log('Updating module icon for module ID:', selectedModuleId);
        onModuleUpdate(selectedModuleId, { icon: iconUrl });
      }

      setShowIconModal(false);
    } catch (error) {
      console.error('Error saving icon:', error);
      alert('Failed to save icon. Please try again.');
    }
  };

  const handleCreateModuleChange = (e) => {
    const { name, value } = e.target;
    setNewModule(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Date change handler for DatePicker
  const handleDateChange = (date) => {
    setNewModule(prev => ({
      ...prev,
      date: date
    }));
  };

  // Function to format date from numeric format to Danish format with month name
  const formatDanishDate = (dateString) => {
    // Check if the date is in a numeric format like "6.5.2025" or "6-5-2025"
    const numericDateRegex = /^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/;
    const match = dateString.match(numericDateRegex);
    
    if (!match) {
      // If it's not in numeric format, return as is
      return dateString;
    }
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = match[3];
    
    // Danish month names
    const danishMonths = [
      'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 
      'Juli', 'August', 'September', 'Oktober', 'November', 'December'
    ];
    
    // Month index is 0-based in arrays
    const monthName = danishMonths[month - 1];
    
    // Return formatted date: "6. Maj 2025"
    return `${day}. ${monthName} ${year}`;
  };

  const handleCreateModule = async () => {
    try {
      setIsCreating(true);
      setError(null);
      
      // Validate required fields
      if (!newModule.title.trim()) {
        setError('Module title is required');
        setIsCreating(false);
        return;
      }
      
      // Format the date from Date object to Danish format
      const formattedModule = {
        ...newModule,
        date: formatDanishDate(newModule.date instanceof Date 
          ? `${newModule.date.getDate()}.${newModule.date.getMonth() + 1}.${newModule.date.getFullYear()}`
          : newModule.date
        )
      };
      
      // Create the module with formatted date
      const createdModule = await createModule(formattedModule);
      
      // Close the modal and reset form
      setShowCreateModal(false);
      setNewModule({
        title: '',
        date: new Date(),
        description: ''
      });
      
      // Reload the modules or add the newly created module to the list
      // This depends on how the parent component handles module updates
      if (createdModule && onModuleUpdate) {
        // If the parent component provides a way to refresh modules, use it
        window.location.reload(); // Force a reload to refresh modules
      }
      
      setIsCreating(false);
    } catch (err) {
      setError(err.message || 'Failed to create module');
      setIsCreating(false);
    }
  };

  // Handler for initiating module deletion
  const handleDeleteClick = (e, module) => {
    e.stopPropagation(); // Prevent module selection when clicking the delete button
    setModuleToDelete(module);
    setShowDeleteModal(true);
  };

  // Handler for confirming module deletion
  const handleConfirmDelete = async () => {
    if (!moduleToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteModule(moduleToDelete.id);
      
      // Close the modal
      setShowDeleteModal(false);
      setModuleToDelete(null);
      
      // Reload the page to refresh the module list
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete module:', error);
      alert(`Failed to delete module: ${error.message}`);
      setIsDeleting(false);
    }
  };

  const toggleSidebar = () => {
    setIsMinimized(prev => !prev);
  };

  return (
    <div className={`module-sidebar p-3 ${isMinimized ? 'minimized' : ''}`} key={`sidebar-${renderKey}`}>
      <div className="sidebar-toggle-wrapper">
        <Button 
          variant="light" 
          size="sm" 
          className="sidebar-toggle-button" 
          onClick={toggleSidebar}
          title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
        >
          {isMinimized ? <BsChevronRight /> : <BsChevronLeft />}
        </Button>
      </div>

      {!isMinimized && (
        <>
          <div className="course-header d-flex align-items-center mb-4">
            <div className="course-icon me-3">
              <div className="course-icon-wrapper">
                <img 
                  src={
                    // First try to use the selected module's icon
                    (selectedModuleId && 
                     safeModules.find(m => m.id === selectedModuleId)?.icon) ||
                    // Then fall back to the stored selectedIcon
                    selectedIcon || 
                    // Then use a default placeholder
                    '/abc-icon.svg'
                  } 
                  alt="Course Icon" 
                  style={{ width: '55px', height: '55px' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/55?text=ABC';
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
              <h4 className="mb-0 module-title">{courseTitle}</h4>
            </div>
          </div>
          
          <ListGroup variant="flush" className="module-list">
            {safeModules.length > 0 ? (
              safeModules.map(module => {
                if (!module) return null;
                
                const moduleActivities = Array.isArray(module.activities) ? module.activities : [];
                // Filter out folder-type activities
                const nonFolderActivities = moduleActivities.filter(act => act && act.type !== 'folder');
                const totalActivities = nonFolderActivities.length;
                const completedActivities = nonFolderActivities.filter(act => act && act.completed).length;
                const allCompleted = totalActivities > 0 && completedActivities === totalActivities;
                
                return (
                  <ListGroup.Item 
                    key={module.id || Math.random().toString()}
                    action
                    active={module.id === selectedModuleId}
                    onClick={() => onModuleSelect && onModuleSelect(module.id)}
                    className="d-flex justify-content-between align-items-center border-start-0 border-end-0 position-relative module-item"
                    style={{ overflow: "hidden" }}
                  >
                    <div className="d-flex flex-column w-100" style={{ minWidth: 0 }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="text-nowrap small text-muted" style={{ fontSize: '0.8rem' }}>{module.date || 'No date'}</div>
                        
                        {userRole === 'student' && (
                          allCompleted ? (
                            <BsCheckCircleFill className="text-success" style={{ fontSize: '1.5rem' }} />
                          ) : (
                            <BsCircleFill className={completedActivities > 0 ? "text-warning" : "text-secondary"} style={{ opacity: 0.5, fontSize: '1.5rem' }} />
                          )
                        )}
                      </div>
                      
                      <div>
                        <span 
                          className="fw-medium module-title"
                        >
                          {module.title}
                        </span>
                        {module.subtitle && <small className="text-muted d-block">{module.subtitle}</small>}
                        
                        {/* Add progress indicator for students */}
                        {userRole === 'student' && totalActivities > 0 && (
                          <small className="text-muted d-block">
                            {completedActivities} af {totalActivities} aktiviteter gennemført
                          </small>
                        )}
                        
                        {/* Add activity count for teachers */}
                        {userRole === 'teacher' && totalActivities > 0 && (
                          <small className="text-muted d-block">
                            {totalActivities} {totalActivities === 1 ? 'aktivitet' : 'aktiviteter'}
                          </small>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete button (only visible for teachers on hover) */}
                    {userRole === 'teacher' && (
                      <div 
                        className="module-delete-btn"
                        onClick={(e) => handleDeleteClick(e, module)}
                        title="Slet modul"
                      >
                        <BsX size={20} />
                      </div>
                    )}
                  </ListGroup.Item>
                );
              })
            ) : (
              <div className="text-center p-3">
                <p className="text-muted">No modules available.</p>
              </div>
            )}
          </ListGroup>
          
          {/* Create Module Button (only for teachers) */}
          {userRole === 'teacher' && (
            <div className="mt-3 mb-3">
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={() => setShowCreateModal(true)}
              >
                <BsPlusCircle className="me-2" /> Opret nyt modul
              </Button>
            </div>
          )}
        </>
      )}

      {isMinimized && (
        <div className="minimized-content">
          {selectedModuleId && (
            <div className="vertical-text">
              {courseTitle}
            </div>
          )}
        </div>
      )}

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

      {/* Create Module Modal */}
      <Modal show={showCreateModal} onHide={() => !isCreating && setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Opret nyt modul</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titel*</Form.Label>
              <Form.Control 
                type="text" 
                name="title"
                value={newModule.title}
                onChange={handleCreateModuleChange}
                placeholder="Indtast modultitel"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Dato</Form.Label>
              <div className="date-picker-container">
                <DatePicker
                  selected={newModule.date instanceof Date ? newModule.date : new Date()}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  placeholderText="Vælg dato"
                />
                <div className="date-picker-icon">
                  <BsCalendar />
                </div>
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Beskrivelse</Form.Label>
              <Form.Control 
                as="textarea" 
                name="description"
                value={newModule.description}
                onChange={handleCreateModuleChange}
                placeholder="Indtast modulbeskrivelse"
                rows={3}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => !isCreating && setShowCreateModal(false)}
            disabled={isCreating}
          >
            Annuller
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateModule}
            disabled={isCreating}
          >
            {isCreating ? 'Opretter...' : 'Opret modul'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => !isDeleting && setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Slet modul</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {moduleToDelete && (
            <p>
              Er du sikker på, at du vil slette modulet "<strong>{moduleToDelete.title}</strong>"?
              <br />
              <small className="text-danger">Denne handling kan ikke fortrydes.</small>
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => !isDeleting && setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Annuller
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Sletter...' : 'Slet modul'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ModuleSidebar; 