import React, { useState, useEffect } from 'react';
import { Card, ProgressBar, Badge, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { 
  BsCheckCircleFill, 
  BsCircleFill, 
  BsFileEarmarkPdf, 
  BsFileEarmarkWord, 
  BsYoutube,
  BsListCheck,
  BsPencil,
  BsX,
  BsPlus,
  BsFileEarmark
} from 'react-icons/bs';
import ModuleTabs from './ModuleTabs';
import { useNavigate } from 'react-router-dom';

const ModuleContent = ({ module, onActivityCompletion, onQuizAccess, onUpdateActivities }) => {
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('indhold');
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    type: 'text',
    url: '',
    file: null,
    content: ''
  });
  const [editActivityId, setEditActivityId] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  
  // Initialize activities from module when it changes
  useEffect(() => {
    if (module && Array.isArray(module.activities)) {
      setActivities(module.activities);
    } else {
      setActivities([]);
    }
  }, [module]);
  
  if (!module) return <div className="p-4">No module selected</div>;

  const totalActivities = activities.length;
  const completedActivities = activities.filter(act => act && act.completed).length;
  const progressPercentage = totalActivities > 0 
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
        return <BsFileEarmark className="text-secondary" size={20} />;
    }
  };

  const detectFileType = (filename) => {
    if (!filename) return 'pdf'; // Default
    
    const lowerFilename = filename.toLowerCase();
    
    if (lowerFilename.endsWith('.pdf')) {
      return 'pdf';
    } else if (lowerFilename.endsWith('.doc') || lowerFilename.endsWith('.docx')) {
      return 'word';
    } else if (
      lowerFilename.includes('youtube.com') || 
      lowerFilename.includes('youtu.be') ||
      lowerFilename.includes('vimeo.com')
    ) {
      return 'youtube';
    } else {
      // Default to generic file
      return 'file';
    }
  };

  const extractYoutubeVideoId = (url) => {
    if (!url) return null;
    
    // Try to extract the video ID from different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYoutubeEmbedUrl = (url) => {
    const videoId = extractYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleOpenPdf = (url) => {
    setSelectedPdfUrl(url);
    setPdfLoading(true);
    setShowPdfModal(true);
  };

  // Validate and potentially fix URL format
  const validateUrl = (url) => {
    if (!url) return false;
    
    // Check if URL already has http/https protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true; // URL is already valid with protocol
    }
    
    // Check for malformed URLs with duplicate protocols or domains
    if (url.includes('http://http://') || url.includes('https://https://') || 
        url.includes('http://https://') || url.includes('https://http://')) {
      // Try to extract a valid URL
      const match = url.match(/(https?:\/\/[^\/]+\/.*)/);
      if (match) {
        return match[1]; // Return the corrected URL
      }
      return false;
    }
    
    // Check for server URL prefixing issues
    if (url.includes('localhost:5001')) {
      // Check for duplicate server URLs
      if (url.match(/localhost:5001.*localhost:5001/)) {
        // Try to extract the correct part
        const parts = url.split('localhost:5001');
        if (parts.length > 1) {
          return `http://localhost:5001${parts[parts.length - 1]}`;
        }
      }
    }
    
    // If it's a relative path (likely an internal resource), prepend http protocol
    // Only for specific paths that we know should be absolute
    if (url.startsWith('/api/') || url.startsWith('/direct-file/')) {
      return `http://localhost:5001${url}`;
    }
    
    // For other relative URLs, prepend https:// as a default
    return `https://${url}`;
  };

  const handleActivityClick = (activity) => {
    if (!activity) return;
    
    // Mark activity as completed regardless of type
    if (!activity.completed && onActivityCompletion) {
      onActivityCompletion(module.id, activity.id);
    }
    
    // Handle different activity types
    if (activity.type === 'quiz') {
      onQuizAccess && onQuizAccess();
      // If it's a quiz, navigate to the take quiz page
      navigate(`/take-quiz/${activity.id}`);
    } else if (activity.type === 'pdf') {
      if (activity.url) {
        // For PDF, validate and potentially fix the URL
        let pdfUrl = activity.url;
        const validatedUrl = validateUrl(pdfUrl);
        
        if (typeof validatedUrl === 'string') {
          pdfUrl = validatedUrl;
        } else if (!validatedUrl) {
          // If validation fails completely, try a fallback approach
          if (!pdfUrl.startsWith('http')) {
            pdfUrl = `http://localhost:5001${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`;
          }
        }
        
        console.log('Opening PDF URL:', pdfUrl);
        window.open(pdfUrl, '_blank');
      } else {
        console.error('No URL provided for PDF activity:', activity);
        alert('Der er ingen PDF tilknyttet denne aktivitet.');
      }
    } else if (activity.type === 'link' && activity.url) {
      // For external links, open in a new tab
      let linkUrl = activity.url;
      const validatedUrl = validateUrl(linkUrl);
      
      if (typeof validatedUrl === 'string') {
        linkUrl = validatedUrl;
      }
      
      console.log('Opening external URL:', linkUrl);
      window.open(linkUrl, '_blank');
    } else {
      // Default: just mark as completed, don't show detail view
      console.log('Activity clicked:', activity.title);
    }
  };
  
  const handleAddActivity = () => {
    setShowAddModal(true);
    setEditActivityId(null);
    setNewActivity({
      title: '',
      description: '',
      type: 'pdf',
      url: '',
      file: null,
      completed: false,
      isNew: true
    });
  };
  
  const handleEditActivity = (e, activity) => {
    e.stopPropagation(); // Prevent triggering the card click
    setEditActivityId(activity.id);
    setNewActivity({
      ...activity,
      file: null // Don't pass the file object when editing
    });
    setShowAddModal(true);
  };
  
  const handleDeleteActivity = (e, activityId) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (window.confirm('Er du sikker på, at du vil slette denne aktivitet?')) {
      // Filter out the deleted activity
      const updatedActivities = activities.filter(activity => activity.id !== activityId);
      
      // Update the parent component
      if (onUpdateActivities) {
        onUpdateActivities(module.id, updatedActivities);
      }
    }
  };
  
  const handleModalInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'file' && files && files.length > 0) {
      const file = files[0];
      const fileType = detectFileType(file.name);
      
      setNewActivity({
        ...newActivity,
        file: file,
        type: fileType,
        title: file.name // Use filename as default title
      });
    } else if (name === 'url') {
      // Validate and possibly correct URL
      const validatedUrl = validateUrl(value);
      
      // If URL was corrected (string returned), use the corrected version
      const finalUrl = typeof validatedUrl === 'string' ? validatedUrl : value;
      
      // Auto-detect file type based on URL
      const fileType = detectFileType(finalUrl);
      
      setNewActivity({
        ...newActivity,
        url: finalUrl,
        type: fileType
      });
    } else {
      setNewActivity({
        ...newActivity,
        [name]: value
      });
    }
  };
  
  const handleSaveActivity = () => {
    // Validate URL if present before saving
    if (newActivity.url && !newActivity.file) {
      const validatedUrl = validateUrl(newActivity.url);
      
      if (!validatedUrl) {
        alert('Ugyldig URL. Angiv venligst en gyldig URL.');
        return;
      }
      
      // Use corrected URL if returned
      if (typeof validatedUrl === 'string') {
        newActivity.url = validatedUrl;
      }
    }
    
    // Generate a unique ID for new activities
    const activityId = editActivityId || `activity_${Date.now()}`;
    
    const updatedActivity = {
      ...newActivity,
      id: activityId
    };
    
    // Remove the file object before saving to state
    const { file, ...activityToSave } = updatedActivity;
    
    // Handle file upload if there's a file
    if (file) {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file
      fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Use the appropriate URL based on file type
          let fileUrl;
          
          // For PDFs, use the direct server URL to avoid routing issues
          if (data.type === 'pdf') {
            // Make sure we're using the correct URL format from the response
            fileUrl = data.serverUrl;
            
            // Ensure the URL is correctly formatted
            if (!fileUrl.startsWith('http')) {
              fileUrl = `http://localhost:5001${fileUrl}`;
            }
            
            console.log('Using direct server URL for PDF:', fileUrl);
          } else {
            // For other file types, use the relative API URL
            fileUrl = data.url;
          }
          
          // Add the URL to the activity
          const fileActivity = {
            ...activityToSave,
            url: fileUrl,
            type: data.type || activityToSave.type
          };
          
          // Update activities
          let updatedActivities;
          if (editActivityId) {
            // Update existing activity
            updatedActivities = activities.map(activity => 
              activity.id === editActivityId ? fileActivity : activity
            );
          } else {
            // Add new activity
            updatedActivities = [...activities, fileActivity];
          }
          
          // Update the parent component
          if (onUpdateActivities) {
            onUpdateActivities(module.id, updatedActivities);
          }
          
          setShowAddModal(false);
        } else {
          // Handle error
          console.error('Error uploading file:', data.error);
          alert('Error uploading file: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(error => {
        console.error('Error uploading file:', error);
        alert('Error uploading file. Please try again.');
      });
    } else {
      // No file to upload, just update activities
      let updatedActivities;
      
      if (editActivityId) {
        // Update existing activity
        updatedActivities = activities.map(activity => 
          activity.id === editActivityId ? activityToSave : activity
        );
      } else {
        // Add new activity
        updatedActivities = [...activities, activityToSave];
      }
      
      // Update the parent component
      if (onUpdateActivities) {
        onUpdateActivities(module.id, updatedActivities);
      }
      
      setShowAddModal(false);
    }
  };
  
  // Handle file drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const fileType = detectFileType(file.name);
      
      // Create a synthetic event object to reuse the existing handler
      const syntheticEvent = {
        target: {
          name: 'file',
          files: e.dataTransfer.files
        }
      };
      
      handleModalInputChange(syntheticEvent);
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
            {progressPercentage}% - {completedActivities} ud af {totalActivities} aktiviteter gennemført
          </div>
          
          {/* Add Activity Button */}
          {activeTab === 'indhold' && (
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleAddActivity} 
              className="d-flex align-items-center tilfoej-aktivitet-btn"
            >
              <BsPlus className="me-1" /> Tilføj aktivitet
            </Button>
          )}
        </div>
        <ProgressBar now={progressPercentage} variant="primary" style={{ height: '8px' }} />
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
                          
                          <div className="d-flex align-items-center">
                            {/* Edit and Delete buttons */}
                            <div className="edit-delete-buttons d-flex me-2">
                              <Button
                                variant="link"
                                className="p-0 me-2 text-secondary"
                                onClick={(e) => handleEditActivity(e, activity)}
                                style={{ fontSize: '1rem' }}
                              >
                                <BsPencil />
                              </Button>
                              <Button
                                variant="link"
                                className="p-0 text-danger"
                                onClick={(e) => handleDeleteActivity(e, activity.id)}
                                style={{ fontSize: '1rem' }}
                              >
                                <BsX />
                              </Button>
                            </div>
                            
                            {/* Completion Status */}
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
      
      {/* Add/Edit Activity Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editActivityId ? 'Rediger aktivitet' : 'Tilføj aktivitet'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titel</Form.Label>
              <Form.Control 
                type="text" 
                name="title"
                value={newActivity.title} 
                onChange={handleModalInputChange}
                placeholder="Angiv en titel for aktiviteten"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Beskrivelse</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2}
                name="description"
                value={newActivity.description} 
                onChange={handleModalInputChange}
                placeholder="Angiv en beskrivelse (valgfrit)"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>URL eller Fil</Form.Label>
              <div className="d-flex flex-column gap-2">
                <Form.Control 
                  type="url" 
                  name="url"
                  value={newActivity.url} 
                  onChange={handleModalInputChange}
                  placeholder="Angiv URL til YouTube video, quiz eller anden ressource"
                />
                <div className="text-center text-muted small py-1">- eller -</div>
                <div 
                  className={`file-upload-container ${dragActive ? 'active-drag' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <label className="file-input-label w-100">
                    <div className="mb-2">
                      <BsFileEarmark size={24} className="mb-2" />
                      <div className="fw-bold">Upload fil</div>
                    </div>
                    <div className="text-muted small mb-2">
                      Slip filer her, eller klik for at vælge
                    </div>
                    <Form.Control 
                      type="file" 
                      name="file"
                      onChange={handleModalInputChange}
                      accept=".pdf,.doc,.docx"
                      className="file-input-hidden"
                    />
                  </label>
                </div>
                <div className="text-muted small mt-1 text-center">
                  Accepterede filtyper: PDF, Word dokumenter
                </div>
              </div>
              {newActivity.url && (
                <div className="activity-url-preview mt-2">
                  <div className="d-flex align-items-center">
                    {getIconForType(newActivity.type)}
                    <span className="ms-2 text-truncate">{newActivity.url}</span>
                  </div>
                  <div className="text-muted small">
                    Detekteret type: {newActivity.type.toUpperCase()}
                  </div>
                </div>
              )}
              {newActivity.file && (
                <div className="activity-url-preview mt-2">
                  <div className="d-flex align-items-center">
                    {getIconForType(detectFileType(newActivity.file.name))}
                    <span className="ms-2 text-truncate">{newActivity.file.name}</span>
                  </div>
                  <div className="text-muted small">
                    Størrelse: {Math.round(newActivity.file.size / 1024)} KB
                  </div>
                </div>
              )}
              {newActivity.url && newActivity.type === 'youtube' && (
                <div className="mt-3">
                  <div className="small fw-bold mb-1">Video forhåndsvisning:</div>
                  <div className="ratio ratio-16x9">
                    <iframe
                      src={getYoutubeEmbedUrl(newActivity.url)}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Annuller
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveActivity}
            disabled={!newActivity.title || (!newActivity.url && !newActivity.file)}
          >
            {editActivityId ? 'Gem ændringer' : 'Tilføj aktivitet'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* PDF Viewer Modal */}
      <Modal 
        show={showPdfModal} 
        onHide={() => setShowPdfModal(false)}
        size="lg"
        centered
        className="pdf-viewer-modal"
        contentClassName="h-100"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <BsFileEarmarkPdf className="text-danger me-2" />
            PDF Dokument
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 position-relative">
          {pdfLoading && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <div className="mt-2">Indlæser PDF...</div>
              </div>
            </div>
          )}
          <div className="ratio ratio-16x9" style={{ minHeight: '80vh' }}>
            <iframe 
              src={selectedPdfUrl} 
              title="PDF Dokument" 
              allowFullScreen
              className="w-100 h-100 border-0"
              onLoad={() => setPdfLoading(false)}
            />
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ModuleContent; 