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
  BsFileEarmark,
  BsLink45Deg,
  BsQuestionCircle,
  BsPencilSquare,
  BsImage
} from 'react-icons/bs';
import ModuleTabs from './ModuleTabs';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const ModuleContent = ({ module, onActivityCompletion, onQuizAccess, onUpdateActivities }) => {
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('indhold');
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showActivityTypeModal, setShowActivityTypeModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
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
  const [editingDescription, setEditingDescription] = useState(false);
  const [moduleDescription, setModuleDescription] = useState('');
  const navigate = useNavigate();
  
  // Initialize activities from module when it changes
  useEffect(() => {
    if (module && Array.isArray(module.activities)) {
      setActivities(module.activities);
      setModuleDescription(module.description || '');
      
      // Also fetch any server-stored activities for this module
      fetchServerStoredActivities(module.id);
    } else {
      setActivities([]);
      setModuleDescription('');
    }
  }, [module]);
  
  // Fetch activities stored on the server for this module
  const fetchServerStoredActivities = (moduleId) => {
    fetch(`/api/module-activities/${moduleId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.activities) && data.activities.length > 0) {
          console.log('Fetched server-stored activities:', data.activities);
          
          // Merge with existing activities, avoiding duplicates
          const existingIds = new Set(activities.map(act => act.id));
          const newActivities = data.activities.filter(act => !existingIds.has(act.id));
          
          if (newActivities.length > 0) {
            const mergedActivities = [...activities, ...newActivities];
            setActivities(mergedActivities);
            
            // Update parent component with merged activities
            if (onUpdateActivities) {
              onUpdateActivities(moduleId, mergedActivities);
            }
          }
        }
      })
      .catch(error => {
        console.error(`Error fetching server-stored activities: ${error.message}`);
        // Silently fail - just won't have server-stored activities
      });
  };
  
  if (!module) return <div className="p-4">No module selected</div>;

  const totalActivities = activities.length;
  const completedActivities = activities.filter(act => act && act.completed).length;
  const progressPercentage = totalActivities > 0 
    ? Math.round((completedActivities / totalActivities) * 100) 
    : 0;

  const getIconForType = (type, url = null) => {
    switch (type) {
      case 'pdf':
        return <BsFileEarmarkPdf className="text-danger" size={20} />;
      case 'youtube':
        // If URL is provided, return a thumbnail image as the icon
        if (url) {
          const thumbnailUrl = getYoutubeThumbnailUrl(url);
          if (thumbnailUrl) {
            return (
              <div className="youtube-icon-thumbnail">
                <img 
                  src={thumbnailUrl} 
                  alt="YouTube Thumbnail" 
                  className="rounded youtube-icon-image"
                />
                <div className="youtube-icon-play">
                  <BsYoutube size={12} />
                </div>
              </div>
            );
          }
        }
        // Fallback to default YouTube icon
        return <BsYoutube className="text-danger" size={20} />;
      case 'word':
        return <BsFileEarmarkWord className="text-primary" size={20} />;
      case 'quiz':
        return <BsListCheck className="text-warning" size={20} />;
      case 'image':
        return <BsImage className="text-success" size={20} />;
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
    } else if (
      lowerFilename.endsWith('.jpg') || 
      lowerFilename.endsWith('.jpeg') || 
      lowerFilename.endsWith('.png')
    ) {
      return 'image';
    } else {
      // Default to generic file
      return 'file';
    }
  };

  // Function to extract YouTube video ID from different URL formats
  const extractYoutubeVideoId = (url) => {
    if (!url) return null;
    
    // Regular YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
    // Shortened URL: https://youtu.be/VIDEO_ID
    // Embedded URL: https://www.youtube.com/embed/VIDEO_ID
    
    let videoId = null;
    
    // Try to match standard YouTube URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    
    return videoId;
  };

  const getYoutubeEmbedUrl = (url) => {
    const videoId = extractYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };
  
  const getYoutubeThumbnailUrl = (url) => {
    const videoId = extractYoutubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  // Function to fetch YouTube video title
  const fetchYoutubeVideoTitle = async (url) => {
    try {
      const videoId = extractYoutubeVideoId(url);
      if (!videoId) return null;
      
      // Use our server-side proxy endpoint
      const response = await fetch(`/api/youtube-title?videoId=${videoId}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.title;
      } else {
        console.error('Error fetching YouTube title:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error in fetchYoutubeVideoTitle:', error);
      return null;
    }
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
    
    // If it's a relative path starting with /api or /uploads, it's valid
    if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
      return true; // This is valid as-is and will work with the proxy
    }
    
    // For other relative URLs, prepend https:// as a default
    return `https://${url}`;
  };

  const handleActivityClick = (activity) => {
    if (!activity) return;
    
    // Mark activity as completed regardless of type
    // Only if it's not already completed
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
        
        // If it's a relative URL, use it directly (proxy will handle it)
        if (!pdfUrl.startsWith('http')) {
          window.open(pdfUrl, '_blank');
        } else {
          // For external URLs, open directly
          window.open(pdfUrl, '_blank');
        }
      } else {
        console.error('No URL provided for PDF activity:', activity);
        alert('Der er ingen PDF tilknyttet denne aktivitet.');
      }
    } else if (activity.type === 'image') {
      // For images, we don't do anything on click since they're shown inline
      // Just mark as completed by the handler at the top of this function
      console.log('Image activity clicked, already displayed inline');
    } else if ((activity.type === 'link' || activity.type === 'youtube') && activity.url) {
      // For external links and YouTube videos, open in a new tab
      let linkUrl = activity.url;
      
      // If it doesn't start with http, prepend it
      if (!linkUrl.startsWith('http')) {
        linkUrl = `https://${linkUrl}`;
      }
      
      console.log(`Opening ${activity.type} URL:`, linkUrl);
      window.open(linkUrl, '_blank');
    } else {
      // Default: just mark as completed, don't show detail view
      console.log('Activity clicked:', activity.title);
    }
  };
  
  const handleAddActivity = () => {
    setShowActivityTypeModal(true);
  };
  
  const handleActivityTypeSelect = (type) => {
    setShowActivityTypeModal(false);
    
    // Configure the new activity based on the selected type
    if (type === 'file') {
      setNewActivity({
        title: '',
        description: '',
        type: 'pdf', // Default to PDF for file uploads
        url: '',
        file: null,
        completed: false,
        isNew: true
      });
      setShowFileUploadModal(true);
    } 
    else if (type === 'link') {
      setNewActivity({
        title: '',
        description: '',
        type: 'link', 
        url: '',
        file: null,
        completed: false,
        isNew: true
      });
      setShowUrlModal(true);
    }
    else if (type === 'quiz') {
      // This will be a dummy action for now
      alert('Quiz-funktionalitet kommer snart!');
    }
  };
  
  const handleEditActivity = (e, activity) => {
    e.stopPropagation(); // Prevent triggering the card click
    setEditActivityId(activity.id);
    setNewActivity({
      ...activity,
      file: null // Don't pass the file object when editing
    });
    
    // Open the appropriate modal based on activity type
    if (activity.type === 'pdf' || activity.type === 'word' || activity.type === 'file') {
      setShowFileUploadModal(true);
    } else if (activity.type === 'youtube' || activity.type === 'link') {
      setShowUrlModal(true);
    } else {
      // For other types or legacy activities, use the general edit modal
      setShowAddModal(true);
    }
  };
  
  const handleDeleteActivity = (e, activityId) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (window.confirm('Er du sikker på, at du vil slette denne aktivitet?')) {
      // Find the activity to get its details before deleting
      const activityToDelete = activities.find(activity => activity.id === activityId);
      
      // Filter out the deleted activity
      const updatedActivities = activities.filter(activity => activity.id !== activityId);
      
      // Update the parent component
      if (onUpdateActivities) {
        onUpdateActivities(module.id, updatedActivities);
      }
      
      // Also delete from server storage if it's a file activity
      if (activityToDelete && 
          (activityToDelete.type === 'pdf' || activityToDelete.type === 'word' || activityToDelete.type === 'file')) {
        
        fetch('/api/delete-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: activityId,
            moduleId: module.id
          }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Activity deleted from server:', data);
        })
        .catch(error => {
          console.error(`Error deleting activity from server: ${error.message}`);
        });
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
      
      // Detect if this is a YouTube URL
      const isYoutubeUrl = finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be');
      
      // Auto-detect file type based on URL
      const fileType = isYoutubeUrl ? 'youtube' : detectFileType(finalUrl);
      
      setNewActivity({
        ...newActivity,
        url: finalUrl,
        type: fileType
      });
      
      // If it's a YouTube URL, try to fetch the title automatically
      if (isYoutubeUrl && finalUrl) {
        // Only try to fetch if the URL seems valid
        const videoId = extractYoutubeVideoId(finalUrl);
        if (videoId) {
          // Show loading state or placeholder if needed
          if (!newActivity.title) {
            setNewActivity(prev => ({
              ...prev,
              url: finalUrl,
              type: fileType,
              title: 'Loading video title...'
            }));
          }
          
          // Fetch the title asynchronously
          fetchYoutubeVideoTitle(finalUrl)
            .then(title => {
              if (title) {
                // Only set the title if it hasn't been manually changed
                // or if it's still the loading placeholder
                if (!newActivity.title || newActivity.title === 'Loading video title...') {
                  setNewActivity(prev => ({
                    ...prev,
                    title: title
                  }));
                }
              }
            })
            .catch(error => {
              console.error('Error fetching video title:', error);
            });
        }
      }
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
            
            // Make sure the URL is correctly formatted with server port
            if (!fileUrl.startsWith('http')) {
              fileUrl = `http://localhost:5001${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
            }
          }
          
          // Add the URL to the activity
          const fileActivity = {
            ...activityToSave,
            url: fileUrl,
            type: data.type || activityToSave.type,
            moduleId: module.id // Add moduleId to the activity data
          };
          
          // Store the activity on the server for persistence
          fetch('/api/store-activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fileActivity),
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then(serverData => {
            console.log('Activity stored on server:', serverData);
          })
          .catch(error => {
            console.error(`Error storing activity on server: ${error.message}`);
          });
          
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
        console.error(`Error uploading file: ${error.message}`);
        alert('Error uploading file. Please try again.');
      });
    } else {
      // No file to upload, just update activities
      // Add moduleId to the activity for server storage
      const activityWithModule = {
        ...activityToSave,
        moduleId: module.id
      };
      
      // Store activities that have URLs on the server
      if (activityWithModule.url) {
        fetch('/api/store-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityWithModule),
        })
        .then(response => response.json())
        .then(serverData => {
          console.log('Activity stored on server:', serverData);
        })
        .catch(error => {
          console.error(`Error storing activity on server: ${error.message}`);
        });
      }
      
      let updatedActivities;
      
      if (editActivityId) {
        // Update existing activity
        updatedActivities = activities.map(activity => 
          activity.id === editActivityId ? activityWithModule : activity
        );
      } else {
        // Add new activity
        updatedActivities = [...activities, activityWithModule];
      }
      
      // Update the parent component
      if (onUpdateActivities) {
        onUpdateActivities(module.id, updatedActivities);
      }
      
      setShowAddModal(false);
    }
  };
  
  const handleSaveDescription = () => {
    if (onUpdateActivities && module) {
      // Create an updated module with the new description
      const updatedModule = {
        ...module,
        description: moduleDescription
      };
      
      // Update the module in the parent component
      // We'll reuse the updateModuleActivities function which accepts moduleId and activities
      // but we'll pass the entire module as a third parameter
      onUpdateActivities(module.id, activities, updatedModule);
      
      setEditingDescription(false);
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

  // Separate handler for saving file uploads
  const handleSaveFileActivity = () => {
    if (!newActivity.title || !newActivity.file) {
      alert('Angiv venligst titel og upload en fil');
      return;
    }
    
    // Generate a unique ID for new activities
    const activityId = editActivityId || `activity_${Date.now()}`;
    
    const updatedActivity = {
      ...newActivity,
      id: activityId
    };
    
    // Remove the file object before saving to state
    const { file, ...activityToSave } = updatedActivity;
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload the file - use relative URL
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
        let fileUrl = data.url;
        
        // Add the URL to the activity
        const fileActivity = {
          ...activityToSave,
          url: fileUrl,
          type: data.type || activityToSave.type,
          moduleId: module.id // Add moduleId to the activity data
        };
        
        // Store the activity on the server for persistence
        fetch('/api/store-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fileActivity),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(serverData => {
          console.log('Activity stored on server:', serverData);
        })
        .catch(error => {
          console.error(`Error storing activity on server: ${error.message}`);
        });
        
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
        
        setShowFileUploadModal(false);
      } else {
        // Handle error
        console.error('Error uploading file:', data.error);
        alert('Error uploading file: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error(`Error uploading file: ${error.message}`);
      alert('Error uploading file. Please try again.');
    });
  };
  
  // Separate handler for saving URL activities
  const handleSaveUrlActivity = () => {
    if (!newActivity.title || !newActivity.url) {
      alert('Angiv venligst titel og en gyldig URL');
      return;
    }
    
    // Validate URL before saving
    const validatedUrl = validateUrl(newActivity.url);
    
    if (!validatedUrl) {
      alert('Ugyldig URL. Angiv venligst en gyldig URL.');
      return;
    }
    
    // Use corrected URL if returned
    if (typeof validatedUrl === 'string') {
      newActivity.url = validatedUrl;
    }
    
    // Generate a unique ID for new activities
    const activityId = editActivityId || `activity_${Date.now()}`;
    
    const activityWithModule = {
      ...newActivity,
      id: activityId,
      moduleId: module.id
    };
    
    // Determine activity type based on URL
    if (newActivity.url.includes('youtube.com') || newActivity.url.includes('youtu.be')) {
      activityWithModule.type = 'youtube';
    } else {
      activityWithModule.type = 'link';
    }
    
    // Store activity on the server
    fetch('/api/store-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityWithModule),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(serverData => {
      console.log('Activity stored on server:', serverData);
    })
    .catch(error => {
      console.error(`Error storing activity on server: ${error.message}`);
    });
    
    let updatedActivities;
    
    if (editActivityId) {
      // Update existing activity
      updatedActivities = activities.map(activity => 
        activity.id === editActivityId ? activityWithModule : activity
      );
    } else {
      // Add new activity
      updatedActivities = [...activities, activityWithModule];
    }
    
    // Update the parent component
    if (onUpdateActivities) {
      onUpdateActivities(module.id, updatedActivities);
    }
    
    setShowUrlModal(false);
  };

  const handleImageClick = (e, imageUrl, title) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (imageUrl) {
      // Use the URL directly, whether it's absolute or relative
      const fullImageUrl = imageUrl;
      
      setSelectedImageUrl(fullImageUrl);
      setSelectedImageTitle(title || 'Image');
      setShowImageModal(true);
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
        
        {/* Rich text editor for module description */}
        {editingDescription ? (
          <div className="mb-3">
            <ReactQuill 
              value={moduleDescription} 
              onChange={setModuleDescription}
              theme="snow"
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link'],
                  ['clean']
                ]
              }}
            />
            <div className="mt-2 d-flex justify-content-end">
              <Button 
                variant="secondary" 
                size="sm" 
                className="me-2"
                onClick={() => {
                  setModuleDescription(module.description || '');
                  setEditingDescription(false);
                }}
              >
                Annuller
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleSaveDescription}
              >
                Gem beskrivelse
              </Button>
            </div>
          </div>
        ) : (
          <div className="position-relative mb-3">
            {moduleDescription ? (
              <div 
                className="text-muted module-description"
                dangerouslySetInnerHTML={{ __html: moduleDescription }}
              />
            ) : (
              <p className="text-muted font-italic">Ingen beskrivelse. Klik for at tilføje.</p>
            )}
            <Button 
              variant="link" 
              className="position-absolute top-0 end-0 p-0 text-muted"
              onClick={() => setEditingDescription(true)}
            >
              <BsPencilSquare />
            </Button>
          </div>
        )}
        
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
      
      {/* Activity Type Selection Modal */}
      <Modal show={showActivityTypeModal} onHide={() => setShowActivityTypeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Vælg aktivitetstype</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">
            <Button 
              variant="outline-primary" 
              className="p-3 d-flex align-items-center"
              onClick={() => handleActivityTypeSelect('file')}
            >
              <BsFileEarmark className="me-3 fs-4" />
              <div className="text-start">
                <h5 className="mb-1">Upload fil</h5>
                <small className="text-muted">Upload et PDF eller Word dokument</small>
              </div>
            </Button>
            
            <Button 
              variant="outline-primary" 
              className="p-3 d-flex align-items-center"
              onClick={() => handleActivityTypeSelect('link')}
            >
              <BsLink45Deg className="me-3 fs-4" />
              <div className="text-start">
                <h5 className="mb-1">Upload link (URL)</h5>
                <small className="text-muted">Tilføj et link til en ekstern webside eller video</small>
              </div>
            </Button>
            
            <Button 
              variant="outline-primary" 
              className="p-3 d-flex align-items-center"
              onClick={() => handleActivityTypeSelect('quiz')}
            >
              <BsQuestionCircle className="me-3 fs-4" />
              <div className="text-start">
                <h5 className="mb-1">Generer quiz</h5>
                <small className="text-muted">Opret en interaktiv quiz (kommer snart)</small>
              </div>
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      
      {/* File Upload Modal */}
      <Modal show={showFileUploadModal} onHide={() => setShowFileUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload fil</Modal.Title>
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
              <Form.Label>Fil</Form.Label>
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
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="file-input-hidden"
                  />
                </label>
              </div>
              <div className="text-muted small mt-1 text-center">
                Accepterede filtyper: PDF, Word dokumenter, billeder
              </div>
              
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
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFileUploadModal(false)}>
            Annuller
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveFileActivity}
            disabled={!newActivity.title || !newActivity.file}
          >
            {editActivityId ? 'Gem ændringer' : 'Tilføj aktivitet'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* URL Input Modal */}
      <Modal show={showUrlModal} onHide={() => setShowUrlModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tilføj link (URL)</Modal.Title>
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
              <Form.Label>URL</Form.Label>
              <Form.Control 
                type="url" 
                name="url"
                value={newActivity.url} 
                onChange={handleModalInputChange}
                placeholder="Angiv URL til webside eller YouTube video"
                required
              />
              
              {newActivity.url && (
                <div className="activity-url-preview mt-2">
                  <div className="d-flex align-items-center">
                    {newActivity.url.includes('youtube.com') || newActivity.url.includes('youtu.be') 
                      ? <BsYoutube className="text-danger" size={20} />
                      : <BsLink45Deg className="text-primary" size={20} />
                    }
                    <span className="ms-2 text-truncate">{newActivity.url}</span>
                  </div>
                  <div className="text-muted small">
                    Type: {newActivity.url.includes('youtube.com') || newActivity.url.includes('youtu.be') 
                      ? 'YouTube video' 
                      : 'Webside link'}
                  </div>
                </div>
              )}
              
              {newActivity.url && (newActivity.url.includes('youtube.com') || newActivity.url.includes('youtu.be')) && (
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
          <Button variant="secondary" onClick={() => setShowUrlModal(false)}>
            Annuller
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveUrlActivity}
            disabled={!newActivity.title || !newActivity.url}
          >
            {editActivityId ? 'Gem ændringer' : 'Tilføj aktivitet'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Edit Activity Modal - Keep this for editing existing activities */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rediger aktivitet</Modal.Title>
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
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="file-input-hidden"
                    />
                  </label>
                </div>
                <div className="text-muted small mt-1 text-center">
                  Accepterede filtyper: PDF, Word dokumenter, billeder
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
            Gem ændringer
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
      
      {/* Image Viewer Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)}
        size="lg"
        centered
        className="image-viewer-modal"
        contentClassName="h-100"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <BsImage className="text-danger me-2" />
            {selectedImageTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 position-relative">
          <img 
            src={selectedImageUrl} 
            alt={selectedImageTitle}
            className="w-100 h-100"
          />
        </Modal.Body>
      </Modal>
      
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
                        {getIconForType(activity.type, activity.url)}
                      </div>
                      
                      <div className="activity-content flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 className="mb-1">{activity.title || 'Unnamed Activity'}</h5>
                            {activity.description && (
                              <div className="text-muted small">{activity.description}</div>
                            )}
                            {activity.type === 'youtube' && activity.url && (
                              <div className="d-flex align-items-center">
                                <div className="text-muted small text-truncate" style={{ maxWidth: '500px' }}>
                                  {extractYoutubeVideoId(activity.url) ? 'YouTube Video' : activity.url}
                                </div>
                                <small className="ms-2 text-primary">Klik for at åbne</small>
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
                    
                    {activity.type === 'image' && activity.url && (
                      <div className="mt-3 activity-image-container">
                        <img 
                          src={activity.url.startsWith('http') 
                            ? activity.url 
                            : activity.url
                          } 
                          alt={activity.title}
                          className="activity-inline-image"
                          onClick={(e) => handleImageClick(e, activity.url, activity.title)}
                        />
                      </div>
                    )}
                    
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