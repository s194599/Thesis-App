import React, { useState, useEffect } from "react";
import {
  Card,
  ProgressBar,
  Badge,
  Button,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
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
  BsImage,
  BsCheck,
  BsRobot,
  BsFolder,
  BsFolderFill,
  BsChevronDown,
  BsChevronRight,
} from "react-icons/bs";
import ModuleTabs from "./ModuleTabs";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Forum from './Forum';
import '../../styles/Forum.css';

const ModuleContent = ({
  module,
  onActivityCompletion,
  onQuizAccess,
  onUpdateActivities,
  onModuleUpdate,
  resetTabFn,
  userRole = "teacher", // Default to teacher role if not provided
}) => {
  // Check if in teacher mode (can edit)
  const isTeacherMode = userRole === "teacher";

  const [activities, setActivities] = useState([]);
  const [completedActivities, setCompletedActivities] = useState([]);
  const [activeTab, setActiveTab] = useState("indhold");
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showActivityTypeModal, setShowActivityTypeModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showQuizChoiceModal, setShowQuizChoiceModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [openFolders, setOpenFolders] = useState({});
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [movingActivity, setMovingActivity] = useState(null);
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [selectedImageTitle, setSelectedImageTitle] = useState("");
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    type: "text",
    url: "",
    file: null,
    content: "",
  });
  const [editActivityId, setEditActivityId] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [moduleDescription, setModuleDescription] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [editedDate, setEditedDate] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");
  const [selectedVideoTitle, setSelectedVideoTitle] = useState("");
  const [selectedAudioUrl, setSelectedAudioUrl] = useState("");
  const [selectedAudioTitle, setSelectedAudioTitle] = useState("");
  const [targetFolderId, setTargetFolderId] = useState(null);
  const [draggedActivity, setDraggedActivity] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [activityOrder, setActivityOrder] = useState({});
  const [isDraggingOver, setIsDraggingOver] = useState(null); // 'before', 'after', or null
  const [dragTarget, setDragTarget] = useState(null);
  const navigate = useNavigate();
  
  // Expose the setActiveTab function through the resetTabFn prop
  useEffect(() => {
    if (resetTabFn) {
      resetTabFn(setActiveTab);
    }
  }, [resetTabFn]);
  
  // Initialize activities from module when it changes
  useEffect(() => {
    if (module && Array.isArray(module.activities)) {
      // Create a deep copy to avoid reference issues
      const moduleCopy = JSON.parse(JSON.stringify(module.activities));

      // Track quizzes by quizId to prevent duplicates
      const quizMap = new Map();

      // Normalize quiz activities to ensure they have proper fields
      // and filter out any duplicates
      const normalizedActivities = moduleCopy
        .filter((activity) => {
          // Skip if null or undefined
          if (!activity) return false;

          // If this is a quiz activity, manage it specially to avoid duplicates
          if (activity.type === "quiz") {
            // Ensure quiz activity has necessary fields
            if (!activity.id && activity.quizId) {
              activity.id = `activity_quiz_${activity.quizId}`;
            }

            // Add isNew field if missing (for consistency with other activities)
            if (activity.isNew === undefined) {
              activity.isNew = false;
            }

            // Skip if we already have this quiz in this module
            if (activity.quizId && quizMap.has(activity.quizId)) {
              // Skip this duplicate
              return false;
            }

            // Track this quiz by quizId to avoid duplicates
            if (activity.quizId) {
              quizMap.set(activity.quizId, activity);
            }
          }

          // Verify this activity belongs to the current module
          if (activity.moduleId && activity.moduleId !== module.id) {
            // Skip activities from other modules that were accidentally included
            return false;
          }

          // Include this activity
          return true;
        })
        .map((activity) => {
          // Make sure moduleId is set correctly for each activity
          // Remove completed field if present
          const { completed, ...activityWithoutCompleted } = activity;
          return {
            ...activityWithoutCompleted,
            moduleId: module.id,
            parentId: activity.parentId || null
          };
        });

      // Count and log quizzes for debugging
      const quizzes = normalizedActivities.filter(
        (a) => a && a.type === "quiz"
      );
      console.log(
        `Setting ${normalizedActivities.length} activities for module ${module.id}, including ${quizzes.length} quizzes`
      );

      // Initialize open folder state
      const initialOpenState = {};
      normalizedActivities.forEach(activity => {
        if (activity.type === 'folder') {
          initialOpenState[activity.id] = true; // Default to open
        }
      });
      setOpenFolders(initialOpenState);

      // Set the activities state with the normalized data
      setActivities(normalizedActivities);
      setModuleDescription(module.description || "");
      setEditedTitle(module.title || "");
      setEditedDate(module.date || "");

      // Reset other module-specific states
      setShowModal(false);
      setShowAddModal(false);
      setShowFileUploadModal(false);
      setShowUrlModal(false);
      setShowActivityTypeModal(false);
      setShowPdfModal(false);
      setEditActivityId(null);
      setNewActivity({
        title: "",
        description: "",
        type: "text",
        url: "",
        file: null,
        content: "",
      });
    } else {
      setActivities([]);
      setModuleDescription("");
      setEditedTitle("");
      setEditedDate("");
    }
  }, [module, userRole]); // Add userRole dependency to ensure re-render when role changes
  
  // Fetch activity completions for the current student (Christian Wu)
  useEffect(() => {
    if (userRole === "student" && activities.length > 0) {
      fetchStudentCompletions();
    }
  }, [activities, userRole]);

  // Function to fetch student activity completions
  const fetchStudentCompletions = async () => {
    try {
      const response = await fetch("/api/student-activity-completions?studentId=1");
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.completed_activities)) {
          setCompletedActivities(data.completed_activities);
        }
      } else {
        console.error("Error fetching activity completions");
      }
    } catch (error) {
      console.error("Error fetching activity completions:", error);
    }
  };

  // Initialize activity orders when activities change
  useEffect(() => {
    if (activities && activities.length > 0) {
      // Group activities by parent
      const groupedActivities = {};
      
      // First pass - group by parent ID
      activities.forEach(activity => {
        const parentId = activity.parentId || 'root';
        if (!groupedActivities[parentId]) {
          groupedActivities[parentId] = [];
        }
        groupedActivities[parentId].push(activity);
      });
      
      // Second pass - assign order within each group
      const orderMap = {};
      Object.keys(groupedActivities).forEach(parentId => {
        const group = groupedActivities[parentId];
        group.forEach((activity, index) => {
          orderMap[activity.id] = index;
        });
      });
      
      setActivityOrder(orderMap);
    }
  }, [activities]);

  // Add CSS for drag and drop in useEffect to avoid conflicts
  useEffect(() => {
    // Add custom CSS for drag and drop
    const style = document.createElement('style');
    style.innerHTML = `
      .activity-card.dragging {
        opacity: 0.5;
        border: 2px dashed #999;
      }
      .folder-card.drag-over {
        background-color: rgba(13, 110, 253, 0.1);
        border: 2px dashed #0d6efd;
      }
      .activity-card[draggable=true]:hover {
        cursor: grab;
      }
      .activity-card[draggable=true]:active {
        cursor: grabbing;
      }
      .drop-indicator {
        height: 3px;
        background-color: transparent;
        margin: 0;
        transition: all 0.2s;
      }
      .drop-indicator.active {
        background-color: #0d6efd;
        height: 6px;
      }
      .drop-zone {
        height: 20px;
        margin: -10px 0;
        z-index: 10;
        position: relative;
        transition: all 0.2s;
      }
      .drop-zone.drag-over {
        height: 30px;
        background-color: transparent;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Handle dragging activities
  const handleDragStart = (e, activity) => {
    // Only allow dragging if in teacher mode and not a folder itself
    if (!isTeacherMode || activity.type === 'folder') {
      e.preventDefault();
      return;
    }

    // Set data for the drag operation
    e.dataTransfer.setData('text/plain', activity.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Track the dragged activity
    setDraggedActivity(activity);
    
    // Add a class to the dragged element
    e.target.closest('.activity-card').classList.add('dragging');
  };
  
  const handleDragEnd = (e) => {
    // Reset the dragged state
    setDraggedActivity(null);
    setDragOverFolder(null);
    
    // Remove the dragging class
    document.querySelectorAll('.activity-card.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
    
    // Remove drag-over class from all folders
    document.querySelectorAll('.folder-card.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  };
  
  // Handle folder drop targets
  const handleDragOver = (e, folderId) => {
    // Prevent default to allow drop
    e.preventDefault();
    e.stopPropagation();
    
    // Set the drag effect
    e.dataTransfer.dropEffect = 'move';
    
    // Track which folder we're hovering over
    setDragOverFolder(folderId);
    
    // Add visual feedback to the folder
    const folderCard = e.currentTarget.closest('.folder-card');
    if (folderCard) {
      folderCard.classList.add('drag-over');
    }
  };
  
  const handleDragLeave = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove highlighting when dragging out of a folder
    if (dragOverFolder === folderId) {
      setDragOverFolder(null);
      
      // Remove visual feedback
      const folderCard = e.currentTarget.closest('.folder-card');
      if (folderCard) {
        folderCard.classList.remove('drag-over');
      }
    }
  };
  
  // Handle drop
  const handleActivityDrop = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the activity ID from the dragged data
    const activityId = e.dataTransfer.getData('text/plain');
    
    // Remove drag-over class
    const folderCard = e.currentTarget.closest('.folder-card');
    if (folderCard) {
      folderCard.classList.remove('drag-over');
    }
    
    // Find the activity being moved
    const activity = activities.find(a => a.id === activityId);
    
    // Don't process if this is a self-drop or no activity found
    if (!activity || activity.parentId === folderId) {
      return;
    }
    
    // Use the existing move function
    const updatedActivity = {
      ...activity,
      parentId: folderId
    };
    
    // Update the activity on the server
    fetch("/api/store-activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedActivity),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((serverData) => {
        console.log("Activity moved on server:", serverData);
      })
      .catch((error) => {
        console.error(`Error moving activity on server: ${error.message}`);
      });
    
    // Update activities in local state
    const updatedActivities = activities.map(a => 
      a.id === activity.id ? updatedActivity : a
    );
    
    setActivities(updatedActivities);
    
    // Update the parent component
    if (onUpdateActivities && module) {
      onUpdateActivities(module.id, updatedActivities);
    }
    
    // Reset drag states
    setDraggedActivity(null);
    setDragOverFolder(null);
  };
  
  // Add a function to handle drag operation for root level drop
  const handleRootDrop = (e) => {
    e.preventDefault();
    
    // Only process if we have a dragged activity
    if (!draggedActivity) return;
    
    // Get the activity ID from the dragged data
    const activityId = e.dataTransfer.getData('text/plain');
    
    // Find the activity
    const activity = activities.find(a => a.id === activityId);
    
    // Only process if activity has a parent (is not already at root)
    if (!activity || !activity.parentId) return;
    
    // Update to move to root level
    const updatedActivity = {
      ...activity,
      parentId: null // null parentId = root level
    };
    
    // Save to server
    fetch("/api/store-activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedActivity),
    })
      .then(response => response.json())
      .then(data => console.log("Moved to root:", data))
      .catch(error => console.error("Error moving to root:", error));
    
    // Update local state
    const updatedActivities = activities.map(a => 
      a.id === activity.id ? updatedActivity : a
    );
    
    setActivities(updatedActivities);
    
    // Update parent component
    if (onUpdateActivities && module) {
      onUpdateActivities(module.id, updatedActivities);
    }
    
    // Reset states
    setDraggedActivity(null);
  };

  if (!module) return <div className="p-4">No module selected</div>;

  const totalActivities = activities.filter(activity => activity.type !== 'folder').length;
  const completedActivitiesCount = activities.filter(activity => 
    completedActivities.includes(activity.id)
  ).length;
  const progressPercentage =
    totalActivities > 0
      ? Math.round((completedActivitiesCount / totalActivities) * 100)
      : 0;

  // Check if an activity is completed by the current student
  const isActivityCompleted = (activityId) => {
    return completedActivities.includes(activityId);
  };

  const getIconForType = (type, url = null) => {
    switch (type) {
      case "pdf":
        return <BsFileEarmarkPdf className="text-danger" size={20} />;
      case "youtube":
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
      case "word":
        return <BsFileEarmarkWord className="text-primary" size={20} />;
      case "quiz":
        return <BsListCheck className="text-warning" size={20} />;
      case "image":
        return <BsImage className="text-success" size={20} />;
      case "video":
        return <BsYoutube className="text-info" size={20} />;
      case "audio":
        return <BsFileEarmark className="text-warning" size={20} />;
      case "folder":
        return <BsFolderFill className="text-primary" size={20} />;
      default:
        return <BsFileEarmark className="text-secondary" size={20} />;
    }
  };

  const detectFileType = (filename) => {
    if (!filename) return "pdf"; // Default
    
    const lowerFilename = filename.toLowerCase();
    
    if (lowerFilename.endsWith(".pdf")) {
      return "pdf";
    } else if (
      lowerFilename.endsWith(".doc") ||
      lowerFilename.endsWith(".docx")
    ) {
      return "word";
    } else if (
      lowerFilename.includes("youtube.com") ||
      lowerFilename.includes("youtu.be") ||
      lowerFilename.includes("vimeo.com")
    ) {
      return "youtube";
    } else if (
      lowerFilename.endsWith(".jpg") ||
      lowerFilename.endsWith(".jpeg") ||
      lowerFilename.endsWith(".png") ||
      lowerFilename.endsWith(".gif")
    ) {
      return "image";
    } else if (
      lowerFilename.endsWith(".mp4") ||
      lowerFilename.endsWith(".webm") ||
      lowerFilename.endsWith(".mov") ||
      lowerFilename.endsWith(".avi")
    ) {
      return "video";
    } else if (
      lowerFilename.endsWith(".mp3") ||
      lowerFilename.endsWith(".wav") ||
      lowerFilename.endsWith(".ogg") ||
      lowerFilename.endsWith(".m4a")
    ) {
      return "audio";
    } else {
      // Default to generic file
      return "file";
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
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
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
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : null;
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
        console.error("Error fetching YouTube title:", await response.text());
        return null;
      }
    } catch (error) {
      console.error("Error in fetchYoutubeVideoTitle:", error);
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
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return true; // URL is already valid with protocol
    }
    
    // Check for malformed URLs with duplicate protocols or domains
    if (
      url.includes("http://http://") ||
      url.includes("https://https://") ||
      url.includes("http://https://") ||
      url.includes("https://http://")
    ) {
      // Try to extract a valid URL
      const match = url.match(/(https?:\/\/[^\/]+\/.*)/);
      if (match) {
        return match[1]; // Return the corrected URL
      }
      return false;
    }
    
    // If it's a relative path starting with /api or /uploads, it's valid
    if (url.startsWith("/api/") || url.startsWith("/uploads/")) {
      return true; // This is valid as-is and will work with the proxy
    }
    
    // For other relative URLs, prepend https:// as a default
    return `https://${url}`;
  };

  const handleActivityClick = async (activity) => {
    if (userRole === "student") {
      if (activity.type === "quiz") {
        // Navigate to quiz intro view with the quiz ID and activity/module IDs as query params
        navigate(
          `/quiz/intro/${activity.quizId}?activityId=${activity.id}&moduleId=${module.id}`
        );
        return;
      }

      // Mark activity as completed for students
      if (!isActivityCompleted(activity.id)) {
        try {
          const response = await fetch("/api/complete-activity", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              activityId: activity.id,
              moduleId: module.id,
              studentId: "1", // Christian Wu's ID
              studentName: "Christian Wu"
            }),
          });

          if (response.ok) {
            // Update the completions list locally
            setCompletedActivities(prev => [...prev, activity.id]);

            // Also notify parent component to update its state
            if (onActivityCompletion) {
              onActivityCompletion(module.id, activity.id);
            }
          }
        } catch (error) {
          console.error("Error marking activity as completed:", error);
        }
      }
    }

    // Handle different activity types
    switch (activity.type) {
      case "pdf":
        window.open(activity.url, "_blank", "noopener,noreferrer");
        break;
      case "doc":
      case "word":
        window.open(activity.url, "_blank", "noopener,noreferrer");
        break;
      case "image":
        handleImageClick(null, activity.url, activity.title);
        break;
      case "link":
        window.open(activity.url, "_blank", "noopener,noreferrer");
        break;
      case "youtube":
        window.open(activity.url, "_blank", "noopener,noreferrer");
        break;
      case "video":
        setSelectedVideoUrl(activity.url);
        setSelectedVideoTitle(activity.title || "Video");
        setShowVideoModal(true);
        break;
      case "audio":
        setSelectedAudioUrl(activity.url);
        setSelectedAudioTitle(activity.title || "Audio");
        setShowAudioModal(true);
        break;
      case "quiz":
        if (userRole === "teacher") {
          // For teachers, navigate to the results page if there's a quizId
          if (activity.quizId) {
            navigate(`/quiz/${activity.quizId}/results`);
          } else {
            // For generating a new quiz when no quizId exists
            // Include pdf, doc, word, video, and audio files for quiz generation
            const documents = activities.filter(
              (a) => a.type === "pdf" || 
                     a.type === "word" || 
                     a.type === "doc" || 
                     a.type === "video" || 
                     a.type === "audio" ||
                     a.type === "youtube"
            );
            localStorage.setItem(
              "quizDocuments",
              JSON.stringify({
                moduleId: module.id,
                documents,
              })
            );
            navigate("/quiz/create");
          }
        }
        // Note: Student navigation to quiz is handled at the top of this function
        break;
      default:
        console.log("Opening activity:", activity.title);
    }
  };
  
  const handleAddActivity = (folderId = null) => {
    // Store the target folder ID if provided
    setTargetFolderId(folderId);
    setShowActivityTypeModal(true);
  };
  
  const handleActivityTypeSelect = (type) => {
    setShowActivityTypeModal(false);

    // Configure the new activity based on the selected type
    if (type === "file") {
      setNewActivity({
        title: "",
        description: "",
        type: "pdf", // Default to PDF for file uploads
        url: "",
        file: null,
        isNew: true,
        parentId: targetFolderId // Use the target folder as parent if set
      });
      setShowFileUploadModal(true);
    } else if (type === "link") {
      setNewActivity({
        title: "",
        description: "",
        type: "link",
        url: "",
        file: null,
        isNew: true,
        parentId: targetFolderId // Use the target folder as parent if set
      });
      setShowUrlModal(true);
    } else if (type === "folder") {
      setNewActivity({
        title: "",
        description: "",
        type: "folder",
        isNew: true,
        parentId: targetFolderId // Use the target folder as parent if set
      });
      setShowFolderModal(true);
    } else if (type === "quiz") {
      // Get all relevant activities from the current module for quiz generation
      // Include pdf, doc, word, video, audio, and youtube files
      const documents = activities
        .filter(
          (activity) =>
            activity &&
            (activity.type === "pdf" ||
             activity.type === "word" ||
             activity.type === "doc" ||
             activity.type === "video" ||
             activity.type === "audio" ||
             activity.type === "youtube")
        )
        .map((activity) => ({
          url: activity.url,
          title: activity.title,
          type: activity.type,
        }));

      // Store the documents in localStorage for the quiz creation page
      localStorage.setItem(
        "quizDocuments",
        JSON.stringify({
          moduleId: module.id,
          documents: documents,
        })
      );

      // Show quiz choice modal instead of navigating to a separate page
      setShowQuizChoiceModal(true);
    }
  };
  
  // Handle quiz creation method selection
  const handleQuizMethodSelect = (method) => {
    setShowQuizChoiceModal(false);
    
    if (method === "ai") {
      // Navigate to AI quiz generation page
      navigate("/quiz/create");
    } else if (method === "manual") {
      // Navigate to manual quiz creation page
      navigate("/quiz/manual-create");
    }
  };
  
  const handleEditActivity = (e, activity) => {
    e.stopPropagation(); // Prevent triggering the card click
    setEditActivityId(activity.id);

    // For PDF activities, only set the title and description
    if (
      activity.type === "pdf" ||
      activity.type === "word" ||
      activity.type === "file"
    ) {
      setNewActivity({
        title: activity.title,
        description: activity.description || "",
        type: activity.type,
        url: activity.url,
        file: null, // Don't pass the file object when editing
      });
      setShowAddModal(true);
    } else if (activity.type === "youtube" || activity.type === "link") {
      setNewActivity({
        ...activity,
        file: null, // Don't pass the file object when editing
      });
      setShowUrlModal(true);
    } else if (activity.type === "quiz") {
      // For quizzes, navigate to the quiz editing page
      navigate(`/quiz/preview/${activity.quizId}`);
    } else {
      // For other types or legacy activities, use the general edit modal
    setNewActivity({
      ...activity,
      file: null // Don't pass the file object when editing
    });
    setShowAddModal(true);
    }
  };
  
  const handleDeleteActivity = (e, activityId) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    // Find the activity to get its details before deleting
    const activityToDelete = activities.find(
      (activity) => activity.id === activityId
    );
    
    if (!activityToDelete) return;
    
    let deleteMessage = "Er du sikker på, at du vil slette denne aktivitet?";
    
    // If it's a folder, warn about deleting contents too
    if (activityToDelete.type === 'folder') {
      const childActivities = activities.filter(a => a.parentId === activityId);
      if (childActivities.length > 0) {
        deleteMessage = `Er du sikker på, at du vil slette denne mappe? Den indeholder ${childActivities.length} aktiviteter, som også vil blive slettet.`;
      }
    }
    
    if (window.confirm(deleteMessage)) {
      // First update the UI for immediate feedback
      if (activityToDelete.type === 'folder') {
        // Find all activities that have this folder as parent
        const childActivities = activities.filter(a => a.parentId === activityId);
        console.log(`Folder "${activityToDelete.title}" has ${childActivities.length} child activities to delete`, childActivities);
        
        // Get all IDs to delete (folder + children)
        const childIds = childActivities.map(a => a.id);
        const allIdsToDelete = [activityId, ...childIds];
        
        // Update local state to remove the folder and its contents
        const updatedActivities = activities.filter(
          (activity) => !allIdsToDelete.includes(activity.id)
        );
        
        setActivities(updatedActivities);
        
        // Update the parent component
        if (onUpdateActivities && module) {
          onUpdateActivities(module.id, updatedActivities);
        }
        
        // Now handle the actual server-side deletion with a sequential approach
        // First delete all child activities, then delete the folder itself
        const deleteChildrenSequentially = async () => {
          console.log(`Starting deletion of ${childIds.length} children of folder ${activityId}`);
          
          // Delete children first
          for (const childId of childIds) {
            console.log(`Deleting child activity ${childId}...`);
            try {
              const response = await fetch("/api/delete-activity", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id: childId,
                  moduleId: module.id,
                }),
              });
              
              if (!response.ok) {
                console.error(`Failed to delete child ${childId}: ${response.status}`);
              } else {
                const data = await response.json();
                console.log(`Successfully deleted child ${childId}`, data);
              }
            } catch (error) {
              console.error(`Error deleting child ${childId}:`, error);
            }
          }
          
          // Finally delete the folder itself
          console.log(`Deleting folder ${activityId}...`);
          try {
            const response = await fetch("/api/delete-activity", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: activityId,
                moduleId: module.id,
              }),
            });
            
            if (!response.ok) {
              console.error(`Failed to delete folder ${activityId}: ${response.status}`);
            } else {
              const data = await response.json();
              console.log(`Successfully deleted folder ${activityId}`, data);
            }
          } catch (error) {
            console.error(`Error deleting folder ${activityId}:`, error);
          }
          
          console.log("Folder deletion process complete");
        };
        
        // Start the deletion process
        deleteChildrenSequentially();
      } else {
        // For non-folder activities, just delete the single activity
        // Update UI first
        const updatedActivities = activities.filter(a => a.id !== activityId);
        setActivities(updatedActivities);
        
        if (onUpdateActivities && module) {
          onUpdateActivities(module.id, updatedActivities);
        }
        
        // Then delete from server
        fetch("/api/delete-activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: activityId,
            moduleId: module.id,
          }),
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to delete ${activityId}: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log(`Successfully deleted ${activityId}:`, data);
          })
          .catch(error => {
            console.error(`Error deleting ${activityId}:`, error);
          });
      }
    }
  };
  
  const handleModalInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "file" && files && files.length > 0) {
      const file = files[0];
      const fileType = detectFileType(file.name);
      
      setNewActivity({
        ...newActivity,
        file: file,
        type: fileType,
        title: file.name, // Use filename as default title
      });
    } else if (name === "url") {
      // Validate and possibly correct URL
      const validatedUrl = validateUrl(value);
      
      // If URL was corrected (string returned), use the corrected version
      const finalUrl = typeof validatedUrl === "string" ? validatedUrl : value;

      // Detect if this is a YouTube URL
      const isYoutubeUrl =
        finalUrl.includes("youtube.com") || finalUrl.includes("youtu.be");
      
      // Auto-detect file type based on URL
      const fileType = isYoutubeUrl ? "youtube" : detectFileType(finalUrl);
      
      setNewActivity({
        ...newActivity,
        url: finalUrl,
        type: fileType,
      });

      // If it's a YouTube URL, try to fetch the title automatically
      if (isYoutubeUrl && finalUrl) {
        // Only try to fetch if the URL seems valid
        const videoId = extractYoutubeVideoId(finalUrl);
        if (videoId) {
          // Show loading state or placeholder if needed
          if (!newActivity.title) {
            setNewActivity((prev) => ({
              ...prev,
              url: finalUrl,
              type: fileType,
              title: "Loading video title...",
            }));
          }

          // Fetch the title asynchronously
          fetchYoutubeVideoTitle(finalUrl)
            .then((title) => {
              if (title) {
                // Only set the title if it hasn't been manually changed
                // or if it's still the loading placeholder
                if (
                  !newActivity.title ||
                  newActivity.title === "Loading video title..."
                ) {
                  setNewActivity((prev) => ({
                    ...prev,
                    title: title,
                  }));
                }
              }
            })
            .catch((error) => {
              console.error("Error fetching video title:", error);
            });
        }
      }
    } else {
      setNewActivity({
        ...newActivity,
        [name]: value,
      });
    }
  };
  
  const handleSaveActivity = () => {
    // Validate URL if present before saving
    if (newActivity.url && !newActivity.file) {
      const validatedUrl = validateUrl(newActivity.url);
      
      if (!validatedUrl) {
        alert("Ugyldig URL. Angiv venligst en gyldig URL.");
        return;
      }
      
      // Use corrected URL if returned
      if (typeof validatedUrl === "string") {
        newActivity.url = validatedUrl;
      }
    }
    
    // Generate a unique ID for new activities
    const activityId = editActivityId || `activity_${Date.now()}`;
    
    // Create a clean object without DOM elements or event references
    const activityData = {
      id: activityId,
      title: newActivity.title,
      description: newActivity.description || "",
      type: newActivity.type || "text",
      url: newActivity.url || "",
      content: newActivity.content || "",
      moduleId: module?.id
    };
    
    // Handle file upload if there's a file
    if (newActivity.file) {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("file", newActivity.file);
      
      // Upload the file
      fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
        .then((data) => {
        if (data.success) {
            // Always use the full server URL for all file types to avoid routing issues
            let fileUrl = data.serverUrl;

            // Make sure serverUrl exists, otherwise construct it from the url
            if (!fileUrl) {
              fileUrl = `http://localhost:5001${
                data.url.startsWith("/") ? "" : "/"
              }${data.url}`;
          }
          
          // Add the URL to the activity
          const fileActivity = {
            ...activityData,
            url: fileUrl,
            type: data.type || activityData.type,
          };
          
          // Store the activity on the server for persistence
            fetch("/api/store-activity", {
              method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(fileActivity),
          })
              .then((response) => {
                if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
              })
              .then((serverData) => {
                console.log("Activity stored on server:", serverData);
              })
              .catch((error) => {
                console.error(
                  `Error storing activity on server: ${error.message}`
                );
          });
          
          // Update activities
          let updatedActivities;
          if (editActivityId) {
            // Update existing activity
              updatedActivities = activities.map((activity) =>
              activity.id === editActivityId ? fileActivity : activity
            );
          } else {
            // Add new activity
            updatedActivities = [...activities, fileActivity];
          }

            // Update local state first for immediate UI feedback
            setActivities(updatedActivities);
          
          // Update the parent component
            if (onUpdateActivities && module) {
            onUpdateActivities(module.id, updatedActivities);
          }
          
          setShowAddModal(false);
            // Reset newActivity state
            setNewActivity({
              title: "",
              description: "",
              type: "text",
              url: "",
              file: null,
              content: "",
            });
            setEditActivityId(null);
        } else {
          // Handle error
            console.error("Error uploading file:", data.error);
            alert("Error uploading file: " + (data.error || "Unknown error"));
          }
        })
        .catch((error) => {
          console.error(`Error uploading file: ${error.message}`);
          alert("Error uploading file. Please try again.");
      });
    } else {
      // No file to upload, just update activities
      
      // Store activities that have URLs on the server
      if (activityData.url) {
        fetch("/api/store-activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(activityData),
        })
          .then((response) => response.json())
          .then((serverData) => {
            console.log("Activity stored on server:", serverData);
          })
          .catch((error) => {
            console.error(`Error storing activity on server: ${error.message}`);
        });
      }
      
      let updatedActivities;
      
      if (editActivityId) {
        // Update existing activity
        updatedActivities = activities.map((activity) =>
          activity.id === editActivityId ? activityData : activity
        );
      } else {
        // Add new activity
        updatedActivities = [...activities, activityData];
      }

      // Update local state first for immediate UI feedback
      setActivities(updatedActivities);
      
      // Update the parent component
      if (onUpdateActivities && module) {
        onUpdateActivities(module.id, updatedActivities);
      }
      
      setShowAddModal(false);
      // Reset newActivity state
      setNewActivity({
        title: "",
        description: "",
        type: "text",
        url: "",
        file: null,
        content: "",
      });
      setEditActivityId(null);
    }
  };

  const handleSaveDescription = () => {
    if (module) {
      if (onModuleUpdate) {
        // Use the dedicated module update function
        onModuleUpdate(module.id, { description: moduleDescription });
      } else if (onUpdateActivities) {
        // Fall back to the legacy method if onModuleUpdate is not provided
        const updatedModule = {
          ...module,
          description: moduleDescription,
        };
        onUpdateActivities(module.id, activities, updatedModule);
      }

      setEditingDescription(false);
    }
  };
  
  // Handle file drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
          name: "file",
          files: e.dataTransfer.files,
        },
      };
      
      handleModalInputChange(syntheticEvent);
    }
  };

  // Separate handler for saving file uploads
  const handleSaveFileActivity = () => {
    if (!newActivity.title || !newActivity.file) {
      alert("Angiv venligst titel og upload en fil");
      return;
    }

    // Generate a unique ID for new activities
    const activityId = editActivityId || `activity_${Date.now()}`;

    // Create a clean object without DOM elements or event references
    const { file } = newActivity;
    const activityToSave = {
      id: activityId,
      title: newActivity.title,
      description: newActivity.description || "",
      type: newActivity.type || "pdf",
      moduleId: module?.id
    };

    // Create form data for file upload
    const formData = new FormData();
    formData.append("file", file);

    // Upload the file - use relative URL
    fetch("/api/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          // Always use the full server URL for all file types to avoid routing issues
          let fileUrl = data.serverUrl;

          // Make sure serverUrl exists, otherwise construct it from the url
          if (!fileUrl) {
            fileUrl = `http://localhost:5001${
              data.url.startsWith("/") ? "" : "/"
            }${data.url}`;
          }

          // Add the URL to the activity
          const fileActivity = {
            ...activityToSave,
            url: fileUrl,
            type: data.type || activityToSave.type,
          };

          // Store the activity on the server for persistence
          fetch("/api/store-activity", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(fileActivity),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
            })
            .then((serverData) => {
              console.log("Activity stored on server:", serverData);
            })
            .catch((error) => {
              console.error(
                `Error storing activity on server: ${error.message}`
              );
            });

          // Update activities
          let updatedActivities;
          if (editActivityId) {
            // Update existing activity
            updatedActivities = activities.map((activity) =>
              activity.id === editActivityId ? fileActivity : activity
            );
          } else {
            // Add new activity
            updatedActivities = [...activities, fileActivity];
          }

          // Update local state first for immediate UI feedback
          setActivities(updatedActivities);

          // Update the parent component
          if (onUpdateActivities && module) {
            onUpdateActivities(module.id, updatedActivities);
          }

          setShowFileUploadModal(false);
          // Reset newActivity state
          setNewActivity({
            title: "",
            description: "",
            type: "text",
            url: "",
            file: null,
            content: "",
          });
          setEditActivityId(null);
        } else {
          // Handle error
          console.error("Error uploading file:", data.error);
          alert("Error uploading file: " + (data.error || "Unknown error"));
        }
      })
      .catch((error) => {
        console.error(`Error uploading file: ${error.message}`);
        alert("Error uploading file. Please try again.");
      });
  };

  // Separate handler for saving URL activities
  const handleSaveUrlActivity = () => {
    if (!newActivity.title || !newActivity.url) {
      alert("Angiv venligst titel og en gyldig URL");
      return;
    }

    // Validate URL before saving
    const validatedUrl = validateUrl(newActivity.url);

    if (!validatedUrl) {
      alert("Ugyldig URL. Angiv venligst en gyldig URL.");
      return;
    }

    // Use corrected URL if returned
    let finalUrl = newActivity.url;
    if (typeof validatedUrl === "string") {
      finalUrl = validatedUrl;
    }

    // Generate a unique ID for new activities
    const activityId = editActivityId || `activity_${Date.now()}`;

    // Create a clean object without DOM elements or event references
    let activityType = "link";
    if (finalUrl.includes("youtube.com") || finalUrl.includes("youtu.be")) {
      activityType = "youtube";
    } else if (finalUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
      activityType = "image";
    }
    
    const activityData = {
      id: activityId,
      title: newActivity.title,
      description: newActivity.description || "",
      type: activityType,
      url: finalUrl,
      moduleId: module?.id
    };

    // Store activity on the server
    fetch("/api/store-activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((serverData) => {
        console.log("Activity stored on server:", serverData);
      })
      .catch((error) => {
        console.error(`Error storing activity on server: ${error.message}`);
      });

    let updatedActivities;

    if (editActivityId) {
      // Update existing activity
      updatedActivities = activities.map((activity) =>
        activity.id === editActivityId ? activityData : activity
      );
    } else {
      // Add new activity
      updatedActivities = [...activities, activityData];
    }

    // Update local state first for immediate UI feedback
    setActivities(updatedActivities);

    // Update the parent component
    if (onUpdateActivities && module) {
      onUpdateActivities(module.id, updatedActivities);
    }

    setShowUrlModal(false);
    // Reset newActivity state
    setNewActivity({
      title: "",
      description: "",
      type: "text",
      url: "",
      file: null,
      content: "",
    });
    setEditActivityId(null);
  };

  const handleImageClick = (e, imageUrl, title) => {
    // Only call stopPropagation if the event object exists
    if (e) {
      e.stopPropagation(); // Prevent triggering the card click
    }
    
    if (imageUrl) {
      // Ensure we have the full URL for the image
      let fullImageUrl = imageUrl;

      // If it's not already a full URL, add the server prefix
      if (!fullImageUrl.startsWith("http")) {
        fullImageUrl = `http://localhost:5001${
          fullImageUrl.startsWith("/") ? "" : "/"
        }${fullImageUrl}`;
      }

      setSelectedImageUrl(fullImageUrl);
      setSelectedImageTitle(title || "Image");
      setShowImageModal(true);
    }
  };

  // Function to handle title edit mode
  const handleTitleEdit = () => {
    setEditingTitle(true);
    setEditedTitle(module.title || "");
  };

  // Function to save edited title
  const handleTitleSave = () => {
    if (module) {
      if (onModuleUpdate) {
        // Use the dedicated module update function
        onModuleUpdate(module.id, { title: editedTitle });
      } else if (onUpdateActivities) {
        // Fall back to the legacy method if onModuleUpdate is not provided
        const updatedModule = { ...module, title: editedTitle };
        onUpdateActivities(module.id, module.activities, updatedModule);
      }
    }
    setEditingTitle(false);
  };

  // Function to handle key press in title input
  const handleTitleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape" || e.key === "Esc") {
      setEditingTitle(false);
      setEditedTitle(module.title || "");
    }
  };

  // Function to handle date edit mode
  const handleDateEdit = (e) => {
    e.stopPropagation();
    setEditingDate(true);
    setEditedDate(module.date || "");
  };

  // Function to save edited date
  const handleDateSave = () => {
    if (module) {
      if (onModuleUpdate) {
        // Use the dedicated module update function
        onModuleUpdate(module.id, { date: editedDate });
      } else if (onUpdateActivities) {
        // Fall back to the legacy method if onModuleUpdate is not provided
        const updatedModule = { ...module, date: editedDate };
        onUpdateActivities(module.id, module.activities, updatedModule);
      }
    }
    setEditingDate(false);
  };

  // Function to handle key press in date input
  const handleDateKeyPress = (e) => {
    if (e.key === "Enter") {
      handleDateSave();
    } else if (e.key === "Escape" || e.key === "Esc") {
      setEditingDate(false);
      setEditedDate(module.date || "");
    }
  };

  const handleFolderClick = (e, folderId) => {
    e.stopPropagation(); // Prevent triggering the card click
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  const handleCreateFolder = () => {
    if (!newActivity.title) {
      alert("Angiv venligst en titel til mappen");
      return;
    }

    // Generate a unique ID for the new folder
    const folderId = `folder_${Date.now()}`;

    const folderActivity = {
      ...newActivity,
      id: folderId,
      type: "folder",
      moduleId: module.id,
      parentId: null
    };

    // Store the folder activity on the server
    fetch("/api/store-activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(folderActivity),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((serverData) => {
        console.log("Folder created on server:", serverData);
      })
      .catch((error) => {
        console.error(`Error creating folder on server: ${error.message}`);
      });

    // Add the new folder to the activities list
    const updatedActivities = [...activities, folderActivity];
    
    // Update open folders state
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: true // New folders are open by default
    }));

    // Update local state
    setActivities(updatedActivities);

    // Update the parent component
    if (onUpdateActivities && module) {
      onUpdateActivities(module.id, updatedActivities);
    }

    // Close the modal and reset the form
    setShowFolderModal(false);
    setNewActivity({
      title: "",
      description: "",
      type: "text",
      url: "",
      file: null,
      content: "",
    });
  };
  
  const openMoveToFolderModal = (e, activity) => {
    e.stopPropagation(); // Prevent triggering the card click
    setMovingActivity(activity);
    setShowMoveToFolderModal(true);
  };
  
  const handleMoveToFolder = (folderId) => {
    if (!movingActivity) return;
    
    // Update the activity's parentId
    const updatedActivity = {
      ...movingActivity,
      parentId: folderId === "root" ? null : folderId
    };
    
    // Update the activity on the server
    fetch("/api/store-activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedActivity),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((serverData) => {
        console.log("Activity moved on server:", serverData);
      })
      .catch((error) => {
        console.error(`Error moving activity on server: ${error.message}`);
      });
    
    // Update activities in local state
    const updatedActivities = activities.map(activity => 
      activity.id === movingActivity.id ? updatedActivity : activity
    );
    
    setActivities(updatedActivities);
    
    // Update the parent component
    if (onUpdateActivities && module) {
      onUpdateActivities(module.id, updatedActivities);
    }
    
    // Close modal and reset state
    setShowMoveToFolderModal(false);
    setMovingActivity(null);
    setSelectedFolder(null);
  };
  
  // Function to group activities by parentId for rendering folders
  const getStructuredActivities = () => {
    // Create a map of all folders
    const folders = activities
      .filter(activity => activity.type === 'folder')
      .reduce((map, folder) => {
        map[folder.id] = {
          ...folder,
          children: []
        };
        return map;
      }, {});
    
    // Root level items (parentId is null or not in a folder)
    const rootItems = [];
    
    // Process all activities
    activities.forEach(activity => {
      if (activity.type === 'folder') {
        // Skip folders as we've already processed them
        return;
      }
      
      if (!activity.parentId) {
        // This is a root level activity
        rootItems.push(activity);
      } else if (folders[activity.parentId]) {
        // This activity belongs in a folder
        folders[activity.parentId].children.push(activity);
      } else {
        // Parent folder doesn't exist, treat as root item
        rootItems.push({
          ...activity,
          parentId: null
        });
      }
    });
    
    // Add folders to root items
    Object.values(folders).forEach(folder => {
      if (!folder.parentId) {
        rootItems.push(folder);
      } else if (folders[folder.parentId]) {
        // This folder is nested inside another folder
        folders[folder.parentId].children.push(folder);
      } else {
        // Parent folder doesn't exist, treat as root item
        rootItems.push({
          ...folder,
          parentId: null
        });
      }
    });
    
    return rootItems;
  };
  
  // Recursive function to render activities and folders
  const renderActivityItem = (activity, depth = 0) => {
    // Check if activity is completed by the current student
    const completed = isActivityCompleted(activity.id);
    
    // For folders, render with children
    if (activity.type === 'folder') {
      const isOpen = openFolders[activity.id] || false;
      const folderChildren = activities.filter(a => a.parentId === activity.id);
      const sortedFolderChildren = sortActivities(folderChildren);
      
      return (
        <div key={activity.id} className="folder-container mb-3">
          <Card 
            className={`activity-card folder-card ${
              userRole === "student" && completed ? "completed" : ""
            }`}
            style={{ cursor: "pointer" }}
            onDragOver={(e) => handleDragOver(e, activity.id)}
            onDragLeave={(e) => handleDragLeave(e, activity.id)}
            onDrop={(e) => handleActivityDrop(e, activity.id)}
          >
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div 
                  className="me-2 cursor-pointer" 
                  onClick={(e) => handleFolderClick(e, activity.id)}
                >
                  {isOpen ? <BsChevronDown /> : <BsChevronRight />}
                </div>
                <div className="activity-icon me-3">
                  {getIconForType(activity.type)}
                </div>
                
                <div className="activity-content flex-grow-1" onClick={(e) => handleFolderClick(e, activity.id)}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">
                        {activity.title || "Unnamed Folder"}
                      </h5>
                      {activity.description && (
                        <div className="text-muted small">
                          {activity.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="d-flex align-items-center">
                      {/* Edit and Delete buttons - Only visible in teacher mode */}
                      {isTeacherMode && (
                        <div className="edit-delete-buttons d-flex me-2">
                          <Button
                            variant="link"
                            className="p-0 me-2 text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddActivity(activity.id);
                            }}
                            style={{ fontSize: "1rem" }}
                            title="Tilføj aktivitet til mappe"
                          >
                            <BsPlus />
                          </Button>
                          <Button
                            variant="link"
                            className="p-0 me-2 text-secondary"
                            onClick={(e) => handleEditActivity(e, activity)}
                            style={{ fontSize: "1rem" }}
                          >
                            <BsPencil />
                          </Button>
                          <Button
                            variant="link"
                            className="p-0 text-danger"
                            onClick={(e) => handleDeleteActivity(e, activity.id)}
                            style={{ fontSize: "1rem" }}
                          >
                            <BsX />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
          
          {/* Render folder contents if open */}
          {isOpen && (
            <div className="folder-contents ms-4 mt-2">
              {sortedFolderChildren.length > 0 ? (
                <>
                  {/* Top drop zone for first item */}
                  {isTeacherMode && (
                    <div 
                      className={`drop-zone ${isDraggingOver === 'before' && dragTarget?.id === sortedFolderChildren[0].id ? 'drag-over' : ''}`}
                      onDragOver={(e) => handleDropZoneDragOver(e, 'before', sortedFolderChildren[0])}
                      onDragLeave={(e) => handleDropZoneDragLeave(e, 'before', sortedFolderChildren[0])}
                      onDrop={(e) => handleReorderDrop(e, 'before', sortedFolderChildren[0])}
                    >
                      <div 
                        id={`drop-indicator-before-${sortedFolderChildren[0].id}`}
                        className="drop-indicator"
                      ></div>
                    </div>
                  )}
                  
                  {sortedFolderChildren.map((childActivity, index) => (
                    <React.Fragment key={childActivity.id}>
                      <Card  
                        className={`mb-3 activity-card ${
                          userRole === "student" && isActivityCompleted(childActivity.id)
                            ? "completed"
                            : ""
                        }`}
                        onClick={() => handleActivityClick(childActivity)}
                        style={{ cursor: "pointer" }}
                        draggable={isTeacherMode && childActivity.type !== 'folder'}
                        onDragStart={(e) => handleDragStart(e, childActivity)}
                        onDragEnd={handleDragEnd}
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-center">
                            <div className="activity-icon me-3">
                              {getIconForType(childActivity.type, childActivity.url)}
                            </div>
                            
                            <div className="activity-content flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h5 className="mb-1">
                                    {childActivity.title || "Unnamed Activity"}
                                  </h5>
                                  {childActivity.description && (
                                    <div className="text-muted small">
                                      {childActivity.description}
                                    </div>
                                  )}
                                  {childActivity.type === "youtube" && childActivity.url && (
                                    <div className="d-flex align-items-center">
                                      <div
                                        className="text-muted small text-truncate"
                                        style={{ maxWidth: "500px" }}
                                      >
                                        {extractYoutubeVideoId(childActivity.url)
                                          ? "YouTube Video"
                                          : childActivity.url}
                                      </div>
                                      <small className="ms-2 text-primary">
                                        Klik for at åbne
                                      </small>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="d-flex align-items-center">
                                  {/* Edit and Delete buttons - Only visible in teacher mode */}
                                  {isTeacherMode && (
                                    <div className="edit-delete-buttons d-flex me-2">
                                      <Button
                                        variant="link"
                                        className="p-0 me-2 text-secondary"
                                        onClick={(e) => handleEditActivity(e, childActivity)}
                                        style={{ fontSize: "1rem" }}
                                      >
                                        <BsPencil />
                                      </Button>
                                      <Button
                                        variant="link"
                                        className="p-0 me-2 text-primary"
                                        onClick={(e) => openMoveToFolderModal(e, childActivity)}
                                        style={{ fontSize: "1rem" }}
                                      >
                                        <BsFolder />
                                      </Button>
                                      <Button
                                        variant="link"
                                        className="p-0 text-danger"
                                        onClick={(e) => handleDeleteActivity(e, childActivity.id)}
                                        style={{ fontSize: "1rem" }}
                                      >
                                        <BsX />
                                      </Button>
                                    </div>
                                  )}
                                  
                                  {/* Completion Status - Only visible in student mode */}
                                  {userRole === "student" && (
                                    <div className="ms-2">
                                      {isActivityCompleted(childActivity.id) ? (
                                        <BsCheckCircleFill className="text-success" />
                                      ) : (
                                        <BsCircleFill
                                          className="text-secondary"
                                          style={{ opacity: 0.3 }}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {childActivity.type === "image" && childActivity.url && (
                            <div className="mt-3 activity-image-container">
                              <img
                                src={
                                  childActivity.url.startsWith("http")
                                    ? childActivity.url
                                    : `http://localhost:5001${
                                        childActivity.url.startsWith("/") ? "" : "/"
                                      }${childActivity.url}`
                                }
                                alt={childActivity.title}
                                className="activity-inline-image"
                                onClick={(e) =>
                                  handleImageClick(e, childActivity.url, childActivity.title)
                                }
                              />
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                      
                      {/* Drop zone after each item */}
                      {isTeacherMode && (
                        <div 
                          className={`drop-zone ${isDraggingOver === 'after' && dragTarget?.id === childActivity.id ? 'drag-over' : ''}`}
                          onDragOver={(e) => handleDropZoneDragOver(e, 'after', childActivity)}
                          onDragLeave={(e) => handleDropZoneDragLeave(e, 'after', childActivity)}
                          onDrop={(e) => handleReorderDrop(e, 'after', childActivity)}
                        >
                          <div 
                            id={`drop-indicator-after-${childActivity.id}`}
                            className="drop-indicator"
                          ></div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <div className="text-center p-3 text-muted">
                  <p>Denne mappe er tom</p>
                  {isTeacherMode && (
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddActivity(activity.id);
                      }}
                      className="d-flex align-items-center mx-auto"
                    >
                      <BsPlus className="me-1" /> Tilføj aktivitet
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    // For normal activities, render standard card with drag capability
    return (
      <Card 
        key={activity.id || Math.random().toString()} 
        className={`mb-3 activity-card ${
          userRole === "student" && completed
            ? "completed"
            : ""
        }`}
        onClick={() => handleActivityClick(activity)}
        style={{ cursor: "pointer" }}
        draggable={isTeacherMode && activity.type !== 'folder'}
        onDragStart={(e) => handleDragStart(e, activity)}
        onDragEnd={handleDragEnd}
      >
        <Card.Body className="p-3">
          <div className="d-flex align-items-center">
            <div className="activity-icon me-3">
              {getIconForType(activity.type, activity.url)}
            </div>
            
            <div className="activity-content flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">
                    {activity.title || "Unnamed Activity"}
                  </h5>
                  {activity.description && (
                    <div className="text-muted small">
                      {activity.description}
                    </div>
                  )}
                  {activity.type === "youtube" && activity.url && (
                    <div className="d-flex align-items-center">
                      <div
                        className="text-muted small text-truncate"
                        style={{ maxWidth: "500px" }}
                      >
                        {extractYoutubeVideoId(activity.url)
                          ? "YouTube Video"
                          : activity.url}
                      </div>
                      <small className="ms-2 text-primary">
                        Klik for at åbne
                      </small>
                    </div>
                  )}
                </div>
                
                <div className="d-flex align-items-center">
                  {/* Edit and Delete buttons - Only visible in teacher mode */}
                  {isTeacherMode && (
                    <div className="edit-delete-buttons d-flex me-2">
                      <Button
                        variant="link"
                        className="p-0 me-2 text-secondary"
                        onClick={(e) => handleEditActivity(e, activity)}
                        style={{ fontSize: "1rem" }}
                      >
                        <BsPencil />
                      </Button>
                      <Button
                        variant="link"
                        className="p-0 me-2 text-primary"
                        onClick={(e) => openMoveToFolderModal(e, activity)}
                        style={{ fontSize: "1rem" }}
                      >
                        <BsFolder />
                      </Button>
                      <Button
                        variant="link"
                        className="p-0 text-danger"
                        onClick={(e) => handleDeleteActivity(e, activity.id)}
                        style={{ fontSize: "1rem" }}
                      >
                        <BsX />
                      </Button>
                    </div>
                  )}
                  
                  {/* Completion Status - Only visible in student mode */}
                  {userRole === "student" && (
                    <div className="ms-2">
                      {completed ? (
                        <BsCheckCircleFill className="text-success" />
                      ) : (
                        <BsCircleFill
                          className="text-secondary"
                          style={{ opacity: 0.3 }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {activity.type === "image" && activity.url && (
            <div className="mt-3 activity-image-container">
              <img
                src={
                  activity.url.startsWith("http")
                    ? activity.url
                    : `http://localhost:5001${
                        activity.url.startsWith("/") ? "" : "/"
                      }${activity.url}`
                }
                alt={activity.title}
                className="activity-inline-image"
                onClick={(e) =>
                  handleImageClick(e, activity.url, activity.title)
                }
              />
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  // When closing a modal, reset the target folder
  const handleCloseModals = () => {
    setShowActivityTypeModal(false);
    setShowFileUploadModal(false);
    setShowUrlModal(false);
    setShowFolderModal(false);
    setTargetFolderId(null);  // Clear target folder when closing modals
  };

  // Add handlers for reordering
  const handleDropZoneDragOver = (e, position, targetActivity) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow reordering if the dragged activity has the same parent
    if (draggedActivity && targetActivity) {
      const sameParent = 
        (draggedActivity.parentId === targetActivity.parentId) || 
        (!draggedActivity.parentId && !targetActivity.parentId);
        
      // Don't allow dropping on itself
      if (draggedActivity.id === targetActivity.id) {
        return;
      }
      
      if (sameParent) {
        e.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(position);
        setDragTarget(targetActivity);
        
        // Add visual feedback
        const indicator = document.getElementById(`drop-indicator-${position}-${targetActivity.id}`);
        if (indicator) {
          indicator.classList.add('active');
        }
      }
    }
  };
  
  const handleDropZoneDragLeave = (e, position, targetActivity) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDraggingOver === position && dragTarget?.id === targetActivity.id) {
      setIsDraggingOver(null);
      setDragTarget(null);
      
      // Remove visual feedback
      const indicator = document.getElementById(`drop-indicator-${position}-${targetActivity.id}`);
      if (indicator) {
        indicator.classList.remove('active');
      }
    }
  };
  
  const handleReorderDrop = (e, position, targetActivity) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear visual state
    setIsDraggingOver(null);
    setDragTarget(null);
    
    // Get the activity ID from the dragged data
    const activityId = e.dataTransfer.getData('text/plain');
    
    // Find the activity being moved
    const activity = activities.find(a => a.id === activityId);
    
    // Don't process if dropping on itself
    if (!activity || activity.id === targetActivity.id) {
      return;
    }
    
    // Clone current activities
    const updatedActivities = [...activities];
    
    // Get activities with same parent
    const parentId = targetActivity.parentId || 'root';
    const siblingActivities = updatedActivities.filter(a => 
      a.parentId === targetActivity.parentId || 
      (!a.parentId && !targetActivity.parentId)
    );
    
    // Remove the activity from its current position
    const sourceIndex = siblingActivities.findIndex(a => a.id === activity.id);
    if (sourceIndex > -1) {
      siblingActivities.splice(sourceIndex, 1);
    }
    
    // Find the target position
    const targetIndex = siblingActivities.findIndex(a => a.id === targetActivity.id);
    
    // Insert at correct position
    if (position === 'before') {
      siblingActivities.splice(targetIndex, 0, activity);
    } else { // 'after'
      siblingActivities.splice(targetIndex + 1, 0, activity);
    }
    
    // Create new order map
    const newOrder = {};
    siblingActivities.forEach((a, index) => {
      newOrder[a.id] = index;
    });
    
    // Update activity order
    setActivityOrder(prevOrder => ({
      ...prevOrder,
      ...newOrder
    }));
    
    // Remove visual feedback
    const indicator = document.getElementById(`drop-indicator-${position}-${targetActivity.id}`);
    if (indicator) {
      indicator.classList.remove('active');
    }
  };
  
  // Helper to sort activities based on order
  const sortActivities = (activities) => {
    if (!activities || !activities.length) return [];
    
    return [...activities].sort((a, b) => {
      const orderA = activityOrder[a.id] !== undefined ? activityOrder[a.id] : 999;
      const orderB = activityOrder[b.id] !== undefined ? activityOrder[b.id] : 999;
      return orderA - orderB;
    });
  };

  return (
    <div className="module-content p-4">
      <header className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div>
            {editingDate && isTeacherMode ? (
              <div className="d-flex align-items-center mb-1">
                <Form.Control
                  size="sm"
                  type="text"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  onKeyDown={handleDateKeyPress}
                  autoFocus
                  style={{ width: "100px" }}
                />
                <BsCheck
                  className="text-success ms-1 clickable"
                  size={16}
                  onClick={handleDateSave}
                  style={{ cursor: "pointer" }}
                />
          </div>
            ) : (
              <div className="d-flex align-items-center">
                <small className="text-muted d-block">
                  {module.date || "Ingen dato"}
                </small>
                {isTeacherMode && (
                  <BsPencil
                    size={12}
                    className="ms-2 text-muted edit-icon"
                    onClick={handleDateEdit}
                    style={{ cursor: "pointer" }}
                  />
                )}
        </div>
            )}

            {editingTitle && isTeacherMode ? (
              <div className="d-flex align-items-center">
                <Form.Control
                  size="lg"
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleTitleKeyPress}
                  autoFocus
                  style={{ minWidth: "300px" }}
                />
                <BsCheck
                  className="text-success ms-2 clickable"
                  size={24}
                  onClick={handleTitleSave}
                  style={{ cursor: "pointer" }}
                />
              </div>
            ) : (
              <div className="d-flex align-items-center">
                <h1 className="h3 mb-0">{module.title || "Unnamed Module"}</h1>
                {isTeacherMode && (
                  <BsPencil
                    size={16}
                    className="ms-3 text-muted edit-icon"
                    onClick={handleTitleEdit}
                    style={{ cursor: "pointer" }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rich text editor for module description */}
        {editingDescription && isTeacherMode ? (
          <div className="mb-3">
            <ReactQuill
              value={moduleDescription}
              onChange={setModuleDescription}
              theme="snow"
              modules={{
                toolbar: [
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link"],
                  ["clean"],
                ],
              }}
            />
            <div className="mt-2 d-flex justify-content-end">
              <Button
                variant="secondary"
                size="sm"
                className="me-2"
                onClick={() => {
                  setModuleDescription(module.description || "");
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
              <p className="text-muted font-italic">
                {isTeacherMode
                  ? "Ingen beskrivelse. Klik for at tilføje."
                  : "Ingen beskrivelse."}
              </p>
            )}
            {isTeacherMode && (
              <Button
                variant="link"
                className="position-absolute top-0 end-0 p-0 text-muted"
                onClick={() => setEditingDescription(true)}
              >
                <BsPencilSquare />
              </Button>
            )}
          </div>
        )}
        
        <ModuleTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={userRole}
          moduleId={module.id}
        />
        
        {userRole === "student" && (
          <div className="mb-2 mt-4">
            <ProgressBar
              now={progressPercentage}
              variant="primary"
              style={{ height: "8px" }}
              className="w-100 mb-2"
            />
            <div className="text-muted small text-center">
              <span className="fw-bold">{progressPercentage}%</span> - {completedActivitiesCount} ud af{" "}
              {totalActivities} aktiviteter gennemført
            </div>
          </div>
        )}

        {/* Add Activity Button - Only visible in teacher mode */}
        {activeTab === "indhold" && isTeacherMode && (
          <div className="d-flex justify-content-end my-3">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleAddActivity} 
              className="d-flex align-items-center tilfoej-aktivitet-btn"
            >
              <BsPlus className="me-1" /> Tilføj aktivitet
            </Button>
        </div>
        )}
      </header>
      
      {activeTab === "indhold" && (
        <div 
          className="activities-container"
          onDragOver={(e) => {
            // Allow dropping at root level
            e.preventDefault();
          }}
          onDrop={handleRootDrop}
        >
          {activities.length > 0 ? (
            <>
              {/* Get root level activities and folders */}
              {(() => {
                // Filter root level items
                const rootItems = activities.filter(activity => !activity.parentId);
                
                // Sort by order
                const sortedRootItems = sortActivities(rootItems);
                
                if (sortedRootItems.length === 0) return null;
                
                return (
                  <>
                    {/* First drop zone */}
                    {isTeacherMode && (
                      <div 
                        className={`drop-zone ${isDraggingOver === 'before' && dragTarget?.id === sortedRootItems[0].id ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleDropZoneDragOver(e, 'before', sortedRootItems[0])}
                        onDragLeave={(e) => handleDropZoneDragLeave(e, 'before', sortedRootItems[0])}
                        onDrop={(e) => handleReorderDrop(e, 'before', sortedRootItems[0])}
                      >
                        <div 
                          id={`drop-indicator-before-${sortedRootItems[0].id}`}
                          className="drop-indicator"
                        ></div>
                      </div>
                    )}
                    
                    {sortedRootItems.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        {renderActivityItem(activity)}
                        
                        {/* Drop zone after each item */}
                        {isTeacherMode && (
                          <div 
                            className={`drop-zone ${isDraggingOver === 'after' && dragTarget?.id === activity.id ? 'drag-over' : ''}`}
                            onDragOver={(e) => handleDropZoneDragOver(e, 'after', activity)}
                            onDragLeave={(e) => handleDropZoneDragLeave(e, 'after', activity)}
                            onDrop={(e) => handleReorderDrop(e, 'after', activity)}
                          >
                            <div 
                              id={`drop-indicator-after-${activity.id}`}
                              className="drop-indicator"
                            ></div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </>
                );
              })()}
            </>
          ) : (
            <div className="text-center p-4">
              <p className="text-muted">
                {isTeacherMode
                  ? 'Der er ingen aktiviteter tilføjet til dette modul endnu. Klik på "Tilføj aktivitet" for at komme i gang.'
                  : "Der er ingen aktiviteter tilføjet til dette modul endnu."}
              </p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === "forum" && (
        <Forum moduleId={module.id} userRole={userRole} />
      )}
      
      {/* Only render modals if in teacher mode */}
      {isTeacherMode && (
        <>
          {/* Activity Type Selection Modal */}
          <Modal
            show={showActivityTypeModal}
            onHide={handleCloseModals}
          >
            <Modal.Header closeButton>
              <Modal.Title>Vælg aktivitetstype</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="d-flex flex-column gap-3">
                <Button
                  variant="outline-primary"
                  className="p-3 d-flex align-items-center"
                  onClick={() => handleActivityTypeSelect("file")}
                >
                  <BsFileEarmark className="me-3 fs-4" />
                  <div className="text-start">
                    <h5 className="mb-1">Upload fil</h5>
                    <small className="text-muted">
                      Upload et PDF eller Word dokument
                    </small>
                  </div>
                </Button>

                <Button
                  variant="outline-primary"
                  className="p-3 d-flex align-items-center"
                  onClick={() => handleActivityTypeSelect("link")}
                >
                  <BsLink45Deg className="me-3 fs-4" />
                  <div className="text-start">
                    <h5 className="mb-1">Upload link (URL)</h5>
                    <small className="text-muted">
                      Tilføj et link til en ekstern webside eller video
                    </small>
                  </div>
                </Button>

                <Button
                  variant="outline-primary"
                  className="p-3 d-flex align-items-center"
                  onClick={() => handleActivityTypeSelect("folder")}
                >
                  <BsFolder className="me-3 fs-4" />
                  <div className="text-start">
                    <h5 className="mb-1">Opret mappe</h5>
                    <small className="text-muted">
                      Opret en mappe til at organisere filer
                    </small>
                  </div>
                </Button>

                <Button
                  variant="outline-primary"
                  className="p-3 d-flex align-items-center"
                  onClick={() => handleActivityTypeSelect("quiz")}
                >
                  <BsQuestionCircle className="me-3 fs-4" />
                  <div className="text-start">
                    <h5 className="mb-1">Opret quiz</h5>
                    <small className="text-muted">
                      Opret en interaktiv quiz
                    </small>
                  </div>
                </Button>
              </div>
            </Modal.Body>
          </Modal>

          {/* Folder Creation Modal */}
          <Modal
            show={showFolderModal}
            onHide={handleCloseModals}
          >
            <Modal.Header closeButton>
              <Modal.Title>Opret mappe</Modal.Title>
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
                    placeholder="Angiv et navn til mappen"
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
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowFolderModal(false)}
              >
                Annuller
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateFolder}
                disabled={!newActivity.title}
              >
                Opret mappe
              </Button>
            </Modal.Footer>
          </Modal>
          
          {/* Move To Folder Modal */}
          <Modal
            show={showMoveToFolderModal}
            onHide={() => {
              setShowMoveToFolderModal(false);
              setMovingActivity(null);
              setSelectedFolder(null);
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title>Flyt til mappe</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Vælg mappe</Form.Label>
                  <Form.Select
                    value={selectedFolder || ""}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                  >
                    <option value="root">Rodmappe (øverste niveau)</option>
                    {activities
                      .filter(activity => activity.type === 'folder' && activity.id !== movingActivity?.id)
                      .map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.title}
                        </option>
                      ))
                    }
                  </Form.Select>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowMoveToFolderModal(false);
                  setMovingActivity(null);
                  setSelectedFolder(null);
                }}
              >
                Annuller
              </Button>
              <Button
                variant="primary"
                onClick={() => handleMoveToFolder(selectedFolder || "root")}
                disabled={!selectedFolder && selectedFolder !== "root"}
              >
                Flyt
              </Button>
            </Modal.Footer>
          </Modal>
          
          {/* File Upload Modal */}
          <Modal
            show={showFileUploadModal}
            onHide={handleCloseModals}
          >
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
                    className={`file-upload-container ${
                      dragActive ? "active-drag" : ""
                    }`}
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
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.webm,.mov,.avi,.mp3,.wav,.ogg,.m4a"
                        className="file-input-hidden"
                      />
                    </label>
                  </div>
                  <div className="text-muted small mt-1 text-center">
                    Accepterede filtyper: PDF, Word dokumenter, billeder, videoer, lydfiler
                  </div>

                  {newActivity.file && (
                    <div className="activity-url-preview mt-2">
                      <div className="d-flex align-items-center">
                        {getIconForType(detectFileType(newActivity.file.name))}
                        <span className="ms-2 text-truncate">
                          {newActivity.file.name}
                        </span>
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
              <Button
                variant="secondary"
                onClick={() => setShowFileUploadModal(false)}
              >
                Annuller
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveFileActivity}
                disabled={!newActivity.title || !newActivity.file}
              >
                {editActivityId ? "Gem ændringer" : "Tilføj aktivitet"}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* URL Input Modal */}
          <Modal
            show={showUrlModal}
            onHide={handleCloseModals}
          >
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
                        {newActivity.url.includes("youtube.com") ||
                        newActivity.url.includes("youtu.be") ? (
                          <BsYoutube className="text-danger" size={20} />
                        ) : (
                          <BsLink45Deg className="text-primary" size={20} />
                        )}
                        <span className="ms-2 text-truncate">
                          {newActivity.url}
                        </span>
                      </div>
                      <div className="text-muted small">
                        Type:{" "}
                        {newActivity.url.includes("youtube.com") ||
                        newActivity.url.includes("youtu.be")
                          ? "YouTube video"
                          : "Webside link"}
                      </div>
                    </div>
                  )}

                  {newActivity.url &&
                    (newActivity.url.includes("youtube.com") ||
                      newActivity.url.includes("youtu.be")) && (
                      <div className="mt-3">
                        <div className="small fw-bold mb-1">
                          Video forhåndsvisning:
                        </div>
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
              <Button
                variant="secondary"
                onClick={() => setShowUrlModal(false)}
              >
                Annuller
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveUrlActivity}
                disabled={!newActivity.title || !newActivity.url}
              >
                {editActivityId ? "Gem ændringer" : "Tilføj aktivitet"}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Edit Activity Modal */}
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
                    <div className="text-center text-muted small py-1">
                      - eller -
                    </div>
                <div 
                      className={`file-upload-container ${
                        dragActive ? "active-drag" : ""
                      }`}
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
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.webm,.mov,.avi,.mp3,.wav,.ogg,.m4a"
                      className="file-input-hidden"
                    />
                  </label>
                </div>
                <div className="text-muted small mt-1 text-center">
                      Accepterede filtyper: PDF, Word dokumenter, billeder, videoer, lydfiler
                </div>
              </div>
              {newActivity.url && (
                <div className="activity-url-preview mt-2">
                  <div className="d-flex align-items-center">
                    {getIconForType(newActivity.type)}
                        <span className="ms-2 text-truncate">
                          {newActivity.url}
                        </span>
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
                        <span className="ms-2 text-truncate">
                          {newActivity.file.name}
                        </span>
                  </div>
                  <div className="text-muted small">
                    Størrelse: {Math.round(newActivity.file.size / 1024)} KB
                  </div>
                </div>
              )}
                  {newActivity.url && newActivity.type === "youtube" && (
                <div className="mt-3">
                      <div className="small fw-bold mb-1">
                        Video forhåndsvisning:
                      </div>
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
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
            Annuller
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveActivity}
                disabled={
                  !newActivity.title || (!newActivity.url && !newActivity.file)
                }
          >
                Gem ændringer
          </Button>
        </Modal.Footer>
      </Modal>
        </>
      )}
      
      {/* These modals are always available as they're for viewing content, not editing */}
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
          <div className="ratio ratio-16x9" style={{ minHeight: "80vh" }}>
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

      {/* Quiz Creation Choice Modal */}
      <Modal
        show={showQuizChoiceModal}
        onHide={() => setShowQuizChoiceModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Vælg oprettelsesmetode</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">
            <Button
              variant="outline-primary"
              className="p-3 d-flex align-items-center"
              onClick={() => handleQuizMethodSelect("ai")}
            >
              <BsRobot className="me-3 fs-4" />
              <div className="text-start">
                <h5 className="mb-1">Generer med AI</h5>
                <small className="text-muted">
                  Lad kunstig intelligens oprette en quiz baseret på emne, tekst eller filer.
                  Perfekt til at spare tid og få inspiration.
                </small>
              </div>
            </Button>

            <Button
              variant="outline-primary"
              className="p-3 d-flex align-items-center"
              onClick={() => handleQuizMethodSelect("manual")}
            >
              <BsPencilSquare className="me-3 fs-4" />
              <div className="text-start">
                <h5 className="mb-1">Opret manuelt</h5>
                <small className="text-muted">
                  Opret og tilpas din egen quiz med dine egne spørgsmål og svarmuligheder.
                  Fuld kontrol over indholdet.
                </small>
              </div>
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        show={showVideoModal}
        onHide={() => setShowVideoModal(false)}
        size="lg"
        centered
        className="video-viewer-modal"
        contentClassName="h-100"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <BsYoutube className="text-danger me-2" />
            {selectedVideoTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 position-relative">
          <div className="ratio ratio-16x9" style={{ minHeight: "70vh" }}>
            <video 
              src={selectedVideoUrl} 
              controls
              className="w-100 h-100"
              controlsList="nodownload"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </Modal.Body>
      </Modal>

      {/* Audio Player Modal */}
      <Modal
        show={showAudioModal}
        onHide={() => setShowAudioModal(false)}
        centered
        className="audio-viewer-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <BsFileEarmark className="text-warning me-2" />
            {selectedAudioTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          <audio 
            src={selectedAudioUrl} 
            controls
            className="w-100"
            controlsList="nodownload"
          >
            Your browser does not support the audio tag.
          </audio>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ModuleContent; 
