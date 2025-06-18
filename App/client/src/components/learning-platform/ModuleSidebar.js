import React, { useState, useEffect, useRef } from "react";
import {
  ListGroup,
  Card,
  Button,
  Modal,
  Form,
  Tab,
  Tabs,
  Image,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from "react-bootstrap";
import {
  BsCheckCircleFill,
  BsCircleFill,
  BsPencil,
  BsUpload,
  BsImage,
  BsPlusCircle,
  BsX,
  BsCalendar,
  BsChevronLeft,
  BsChevronRight,
  BsEye,
  BsFilter,
} from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/ModuleSidebar.css";
import { createModule, deleteModule } from "../../services/moduleService";

const ModuleSidebar = ({
  modules = [],
  selectedModuleId,
  onModuleSelect,
  userRole = "student", // Default to student role for testing
  onModuleUpdate,
  onSidebarStateChange,
  onTopicSelect,
}) => {
  const navigate = useNavigate();
  // Ensure modules is always an array - moved earlier in the component
  const safeModules = Array.isArray(modules) ? modules : [];

  const [showIconModal, setShowIconModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [renderKey, setRenderKey] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState("Dansk 2.A"); // Default value
  const [newModule, setNewModule] = useState({
    title: "",
    date: new Date(),
    description: "",
    topicId: "topic-1", // Default to the first topic
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewMode, setViewMode] = useState('modules'); // 'modules' or 'topics'
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [showAllModules, setShowAllModules] = useState(false);
  
  // Ref to track auto-selection state to prevent infinite loops
  const isAutoSelectingRef = useRef(false);
  
  // Ref to track if this is the initial mount
  const isInitialMountRef = useRef(true);
  
  // Use the passed userRole prop instead of forcing student mode
  const effectiveUserRole = userRole;
  
  // Use a fixed date for testing - April 15, 2023
  const useFixedTestDate = true;
  const getToday = () => {
    if (useFixedTestDate) {
      // Using April 15, 2023 as a fixed date for testing
      return new Date(2023, 3, 15); // Month is 0-indexed (3 = April)
    } else {
      return new Date();
    }
  };
  
  // Only show debug info in development mode
  const isDevMode = process.env.NODE_ENV === 'development';
  
  useEffect(() => {
    setRenderKey((prevKey) => prevKey + 1);
  }, [userRole]);
  
  // Fetch topics once when component mounts (for both views and for modal)
  useEffect(() => {
    fetchTopics();
  }, []);

  // Fetch topics from the server when in topics view
  useEffect(() => {
    if (viewMode === 'topics') {
      fetchTopics().then(() => {
        // Auto-select the first topic if no topic is selected
        if (!selectedTopicId && topics.length > 0) {
          setSelectedTopicId(topics[0].id);
          if (onTopicSelect) {
            onTopicSelect(topics[0].id);
          }
        }
      });
    }
  }, [viewMode]);
  
  // Select first topic when topics array is populated
  useEffect(() => {
    if (viewMode === 'topics' && !selectedTopicId && topics.length > 0) {
      setSelectedTopicId(topics[0].id);
      if (onTopicSelect) {
        onTopicSelect(topics[0].id);
      }
    }
  }, [topics, viewMode, selectedTopicId, onTopicSelect]);

  // Fetch topics from the API
  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics', {
        headers: {
          'Accept': 'application/json; charset=utf-8'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.topics)) {
          console.log('Fetched topics for sidebar:', data.topics);
          setTopics(data.topics);
          return data.topics;
        }
      } else {
        console.error('Failed to fetch topics');
      }
      return [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      return [];
    }
  };

  // Parse Danish date format (e.g., "8. Februar 2023" or "8. feb 2023" or "8/2/2023")
  const parseDanishDate = (dateString) => {
    if (!dateString) return null;
    
    // Map of Danish month names (including abbreviations)
    const monthMap = {
      'januar': 0, 'jan': 0, 
      'februar': 1, 'feb': 1, 
      'marts': 2, 'mar': 2, 
      'april': 3, 'apr': 3, 
      'maj': 4, 
      'juni': 5, 'jun': 5, 
      'juli': 6, 'jul': 6, 
      'august': 7, 'aug': 7, 
      'september': 8, 'sep': 8, 
      'oktober': 9, 'okt': 9, 
      'november': 10, 'nov': 10, 
      'december': 11, 'dec': 11
    };
    
    try {
      // First try the standard format: "8. Februar 2023"
      const standardPattern = /(\d{1,2})\.\s+([a-zA-ZæøåÆØÅ]+)\s+(\d{4})/i;
      const standardMatch = dateString.match(standardPattern);
      
      if (standardMatch) {
        const day = parseInt(standardMatch[1], 10);
        const monthLower = standardMatch[2].toLowerCase();
        const month = monthMap[monthLower];
        const year = parseInt(standardMatch[3], 10);
        
        if (!isNaN(day) && month !== undefined && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
      
      // Try numeric format: "8/2/2023" or "8-2-2023" or "8.2.2023"
      const numericPattern = /(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})/;
      const numericMatch = dateString.match(numericPattern);
      
      if (numericMatch) {
        const day = parseInt(numericMatch[1], 10);
        const month = parseInt(numericMatch[2], 10) - 1; // Month is 0-indexed in JS Date
        const year = parseInt(numericMatch[3], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
      
      // Check for ISO format YYYY-MM-DD
      const isoPattern = /(\d{4})-(\d{2})-(\d{2})/;
      const isoMatch = dateString.match(isoPattern);
      
      if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10) - 1;
        const day = parseInt(isoMatch[3], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
      
    } catch (error) {
      console.error('Error parsing date:', error);
    }
    
    return null;
  };
  
  // Filter modules by date proximity (with a 15-day window)
  const getFilteredModules = () => {
    // For any user role, apply filtering based on toggle state
    if (!showAllModules) {
      if (isDevMode) console.log(`${effectiveUserRole} mode - filtered view`);
      
      const today = getToday();
      today.setHours(0, 0, 0, 0);
      
      // Use a 15-day window before and after the current date
      const fifteenDaysAgo = new Date(today);
      fifteenDaysAgo.setDate(today.getDate() - 15); 
      
      const fifteenDaysFromNow = new Date(today);
      fifteenDaysFromNow.setDate(today.getDate() + 15);
      
      if (isDevMode) console.log(`Date filter window: ${fifteenDaysAgo.toDateString()} - ${today.toDateString()} - ${fifteenDaysFromNow.toDateString()}`);

      let filtered = safeModules.filter(module => {
        const moduleDate = parseDanishDate(module.date);
        
        if (!moduleDate) return false; // Skip modules without valid dates
        
        moduleDate.setHours(0, 0, 0, 0);
        return moduleDate >= fifteenDaysAgo && moduleDate <= fifteenDaysFromNow;
      });
      
      if (isDevMode) console.log(`Filtered from ${safeModules.length} to ${filtered.length} modules`);
      
      // If no modules match the date range, show the first one
      if (filtered.length === 0 && safeModules.length > 0) {
        if (isDevMode) console.log('No modules in range, showing first module');
        filtered = [safeModules[0]];
      }
      
      return sortModulesByDate(filtered);
    } else {
      if (isDevMode) console.log(`${effectiveUserRole} mode - showing all modules`);
      return sortModulesByDate(safeModules);
    }
  };
  
  // Helper function to sort modules by date
  const sortModulesByDate = (modules) => {
    return [...modules].sort((a, b) => {
      const dateA = parseDanishDate(a.date) || new Date(0);
      const dateB = parseDanishDate(b.date) || new Date(0);
      return dateA - dateB;
    });
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'topics') {
      // When switching to topics view, automatically select the first topic if available
      fetchTopics().then(() => {
        if (topics.length > 0) {
          // Select the first topic
          setSelectedTopicId(topics[0].id);
          if (onTopicSelect) {
            onTopicSelect(topics[0].id);
          }
        } else {
          // If there are no topics yet but they might be loading, set up a small delay to check again
          setTimeout(() => {
            if (topics.length > 0) {
              setSelectedTopicId(topics[0].id);
              if (onTopicSelect) {
                onTopicSelect(topics[0].id);
              }
            }
          }, 500);
        }
      });
    } else {
      // Reset to module view - try to select the previously selected module
      const savedModuleId = localStorage.getItem("selectedModuleId");
      
      if (savedModuleId) {
        // Check if the saved module still exists in our current module list
        const moduleExists = modules.some(m => m.id === savedModuleId);
        
        if (moduleExists) {
          // Restore the saved module selection
          if (isDevMode) console.log('Restoring saved module when returning to module view:', savedModuleId);
          handleModuleSelection(savedModuleId);
        } else if (selectedModuleId) {
          // Fall back to current selection if available
          handleModuleSelection(selectedModuleId);
        }
      } else if (selectedModuleId) {
        // No saved module, but we have a current selection
        handleModuleSelection(selectedModuleId);
      }
    }
  };

  // Handle topic selection
  const handleTopicSelect = (topicId) => {
    setSelectedTopicId(topicId);
    if (onTopicSelect) {
      onTopicSelect(topicId);
    }
  };

  // Load minimized state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarMinimized");
    if (savedState) {
      setIsMinimized(savedState === "true");
    }
    
    // Load module filter preference
    const savedFilterState = localStorage.getItem("showAllModules");
    if (savedFilterState) {
      setShowAllModules(savedFilterState === "true");
    }
  }, []);

  // Save minimized state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("sidebarMinimized", isMinimized);
    if (onSidebarStateChange) {
      onSidebarStateChange(isMinimized);
    }
  }, [isMinimized, onSidebarStateChange]);
  
  // Save filter preference to localStorage
  useEffect(() => {
    localStorage.setItem("showAllModules", showAllModules);
    
    // When switching to filtered view, check if current module is visible
    if (!showAllModules && selectedModuleId) {
      // Check if the current module would be filtered out
      const wouldBeFilteredOut = isModuleFilteredByDate(selectedModuleId);
      
      if (wouldBeFilteredOut) {
        if (isDevMode) console.log('Current module filtered out after toggle - selecting today\'s module');
        
        // Find and select today's module or first available module in filtered list
        const today = getToday();
        today.setHours(0, 0, 0, 0);
        
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(today.getDate() - 15);
        
        const fifteenDaysFromNow = new Date(today);
        fifteenDaysFromNow.setDate(today.getDate() + 15);
        
        // Get modules within date range
        const filteredModules = safeModules.filter(module => {
          const moduleDate = parseDanishDate(module.date);
          if (!moduleDate) return false;
          
          moduleDate.setHours(0, 0, 0, 0);
          return moduleDate >= fifteenDaysAgo && moduleDate <= fifteenDaysFromNow;
        });
        
        // Sort by date
        const sortedFilteredModules = sortModulesByDate(filteredModules);
        
        // Try to find today's module first
        const todaysModule = sortedFilteredModules.find(module => {
          const moduleDate = parseDanishDate(module.date);
          if (!moduleDate) return false;
          
          return (
            moduleDate.getDate() === today.getDate() &&
            moduleDate.getMonth() === today.getMonth() &&
            moduleDate.getFullYear() === today.getFullYear()
          );
        });
        
        if (todaysModule) {
          // Select today's module
          if (isDevMode) console.log('Selecting today\'s module after filter:', todaysModule.id);
          isAutoSelectingRef.current = true;
          handleModuleSelection(todaysModule.id);
        } else if (sortedFilteredModules.length > 0) {
          // Select first available module in filtered list
          if (isDevMode) console.log('Selecting first filtered module after filter:', sortedFilteredModules[0].id);
          isAutoSelectingRef.current = true;
          handleModuleSelection(sortedFilteredModules[0].id);
        }
      }
    }
  }, [showAllModules]);
  
  // Persist selected module ID to localStorage when it changes
  useEffect(() => {
    // Only save if we have a valid selection and it's not the initial mount
    if (selectedModuleId && !isAutoSelectingRef.current) {
      if (isDevMode) console.log('Saving selected module ID to localStorage:', selectedModuleId);
      localStorage.setItem("selectedModuleId", selectedModuleId);
    }
  }, [selectedModuleId, isDevMode]);
  
  // Auto-select today's module if selected module is not in filtered list
  useEffect(() => {
    if (viewMode !== 'modules') return;
    
    // Skip if we're already handling a selection
    if (isAutoSelectingRef.current) {
      isAutoSelectingRef.current = false;
      return;
    }
    
    const checkAndSelectModule = async () => {
      // We need to make a fresh calculation of the filtered module list
      let filteredModules = [];
      
      if (!showAllModules) {
        const today = getToday();
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(today.getDate() - 15);
        
        const fifteenDaysFromNow = new Date(today);
        fifteenDaysFromNow.setDate(today.getDate() + 15);
        
        // Basic filter by date range
        filteredModules = safeModules.filter(module => {
          const moduleDate = parseDanishDate(module.date);
          if (!moduleDate) return false;
          
          return moduleDate >= fifteenDaysAgo && moduleDate <= fifteenDaysFromNow;
        });
      } else {
        // Show all modules
        filteredModules = safeModules;
      }
      
      // Sort modules by date
      filteredModules.sort((a, b) => {
        const dateA = parseDanishDate(a.date) || new Date(0);
        const dateB = parseDanishDate(b.date) || new Date(0);
        return dateA - dateB;
      });
      
      // Check if selected module is in the filtered list
      const selectedExists = filteredModules.some(m => m.id === selectedModuleId);
      
      // Only for initial load or URL navigation - don't auto-switch to "show all" for user toggle actions
      if (!selectedExists && selectedModuleId && !document.referrer.includes(window.location.host)) {
        // If the currently selected module would be filtered out and this is initial navigation,
        // we should show all modules instead of auto-selecting a different one
        const moduleExists = safeModules.some(m => m.id === selectedModuleId);
        if (moduleExists) {
          if (isDevMode) console.log('Currently selected module would be filtered out, showing all modules');
          setShowAllModules(true);
          return;
        }
      }
      
      if (!selectedExists && filteredModules.length > 0) {
        // Mark that we're auto-selecting to prevent loops
        isAutoSelectingRef.current = true;
        
        // First check if there's a previously selected module in localStorage
        // that exists in our current filtered list
        const savedModuleId = localStorage.getItem("selectedModuleId");
        const savedModuleInFilter = savedModuleId && 
          filteredModules.some(m => m.id === savedModuleId);
        
        if (savedModuleInFilter) {
          // Use the previously selected module that's in our filtered list
          if (isDevMode) console.log('Selecting previously saved module from filter:', savedModuleId);
          handleModuleSelection(savedModuleId);
          return;
        }
        
        // If no previously selected module available, find today's module
        const today = getToday();
        const todaysModule = filteredModules.find(module => {
          const moduleDate = parseDanishDate(module.date);
          if (!moduleDate) return false;
          
          return (
            moduleDate.getDate() === today.getDate() &&
            moduleDate.getMonth() === today.getMonth() &&
            moduleDate.getFullYear() === today.getFullYear()
          );
        });
        
        if (todaysModule) {
          // Select today's module
          if (isDevMode) console.log('Auto-selecting today\'s module:', todaysModule.id);
          handleModuleSelection(todaysModule.id);
        } else if (filteredModules.length > 0) {
          // Select first module
          if (isDevMode) console.log('Auto-selecting first module:', filteredModules[0].id);
          handleModuleSelection(filteredModules[0].id);
        }
      }
    };
    
    // Run the check and selection logic
    checkAndSelectModule();
    
  }, [showAllModules, selectedModuleId, safeModules]); // Run when filter toggle changes or selected module changes

  // Add a function to check if a module would be filtered by date
  const isModuleFilteredByDate = (moduleId) => {
    if (!moduleId || showAllModules) return false;
    
    const module = safeModules.find(m => m.id === moduleId);
    if (!module) return false;
    
    const moduleDate = parseDanishDate(module.date);
    if (!moduleDate) return false;
    
    const today = getToday();
    today.setHours(0, 0, 0, 0);
    
    const fifteenDaysAgo = new Date(today);
    fifteenDaysAgo.setDate(today.getDate() - 15);
    
    const fifteenDaysFromNow = new Date(today);
    fifteenDaysFromNow.setDate(today.getDate() + 15);
    
    moduleDate.setHours(0, 0, 0, 0);
    return !(moduleDate >= fifteenDaysAgo && moduleDate <= fifteenDaysFromNow);
  };
  
  // Modified useEffect for initial module selection with added check for filtered out modules
  useEffect(() => {
    if (isInitialMountRef.current && modules.length > 0) {
      isInitialMountRef.current = false;
      
      // Get the previously selected module ID from localStorage
      const savedModuleId = localStorage.getItem("selectedModuleId");
      
      if (savedModuleId) {
        // Check if the saved module ID still exists in the current module list
        const moduleExists = modules.some(m => m.id === savedModuleId);
        
        if (moduleExists) {
          // If the module exists and differs from the current selection, select it
          if (savedModuleId !== selectedModuleId) {
            if (isDevMode) console.log('Restoring previously selected module:', savedModuleId);
            
            // Check if this module would be filtered out by date
            if (isModuleFilteredByDate(savedModuleId)) {
              if (isDevMode) console.log('Saved module would be filtered out - showing all modules');
              setShowAllModules(true);
            }
            
            isAutoSelectingRef.current = true;
            handleModuleSelection(savedModuleId);
          }
        } else {
          // If saved module doesn't exist anymore, remove it from localStorage
          localStorage.removeItem("selectedModuleId");
        }
      }
    }
  }, [modules, selectedModuleId, onModuleSelect, isDevMode]);

  // Load course title from localStorage
  useEffect(() => {
    const loadCourseTitle = () => {
      const selectedCourse = localStorage.getItem("selectedCourse");
      if (selectedCourse) {
        // Map ID to a display name with grade
        const courseMap = {
          dansk: "Dansk 2.A",
          historie: "Historie 2.A",
          engelsk: "Engelsk 2.A",
          samfundsfag: "Samfundsfag 2.A",
        };
        setCourseTitle(courseMap[selectedCourse] || "Dansk 2.A");
      }
    };
    loadCourseTitle();
  }, []);

  // Predefined icons gallery
  const predefinedIcons = [
    {
      name: "Book",
      url: "https://cdn-icons-png.flaticon.com/512/2232/2232688.png",
    },
    {
      name: "Graduation",
      url: "https://cdn-icons-png.flaticon.com/512/2232/2232685.png",
    },
    {
      name: "Science",
      url: "https://cdn-icons-png.flaticon.com/512/2232/2232681.png",
    },
    {
      name: "Math",
      url: "https://cdn-icons-png.flaticon.com/512/2232/2232683.png",
    },
    {
      name: "Language",
      url: "https://cdn-icons-png.flaticon.com/512/2232/2232687.png",
    },
    {
      name: "History",
      url: "https://cdn-icons-png.flaticon.com/512/2232/2232682.png",
    },
  ];

  // Load saved icon from localStorage on component mount
  useEffect(() => {
    // If we have a selected module and it has an icon, use that
    const selectedModule = safeModules.find(
      (module) => module.id === selectedModuleId
    );
    if (selectedModule && selectedModule.icon) {
      setSelectedIcon(selectedModule.icon);
    } else {
      // Otherwise, fall back to localStorage
      const savedIcon = localStorage.getItem("courseIcon");
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
        formData.append("icon", iconFile);

        const response = await fetch("/api/upload-icon", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload icon");
        }

        const data = await response.json();
        iconUrl = data.url;
      }

      // Save the icon URL to localStorage as a fallback
      localStorage.setItem("courseIcon", iconUrl);
      setSelectedIcon(iconUrl);

      // Update the module if we're in a specific module context
      if (selectedModuleId && onModuleUpdate) {
        console.log("Updating module icon for module ID:", selectedModuleId);
        onModuleUpdate(selectedModuleId, { icon: iconUrl });
      }

      setShowIconModal(false);
    } catch (error) {
      console.error("Error saving icon:", error);
      alert("Failed to save icon. Please try again.");
    }
  };

  const handleCreateModuleChange = (e) => {
    const { name, value } = e.target;
    setNewModule((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Date change handler for DatePicker
  const handleDateChange = (date) => {
    setNewModule((prev) => ({
      ...prev,
      date: date,
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
      "Januar",
      "Februar",
      "Marts",
      "April",
      "Maj",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "December",
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
        setError("Module title is required");
        setIsCreating(false);
        return;
      }

      // Format the date from Date object to Danish format
      const formattedModule = {
        ...newModule,
        date: formatDanishDate(
          newModule.date instanceof Date
            ? `${newModule.date.getDate()}.${
                newModule.date.getMonth() + 1
              }.${newModule.date.getFullYear()}`
            : newModule.date
        ),
        // Use the selected topicId from the dropdown
        topicId: newModule.topicId || "topic-1",
      };

      // Create the module with formatted date
      const createdModule = await createModule(formattedModule);

      // Close the modal and reset form
      setShowCreateModal(false);
      setNewModule({
        title: "",
        date: new Date(),
        description: "",
        topicId: "topic-1", // Reset to default topic
      });

      // Reload the modules or add the newly created module to the list
      // This depends on how the parent component handles module updates
      if (createdModule && onModuleUpdate) {
        // If the parent component provides a way to refresh modules, use it
        window.location.reload(); // Force a reload to refresh modules
      }

      setIsCreating(false);
    } catch (err) {
      setError(err.message || "Failed to create module");
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
      console.error("Failed to delete module:", error);
      alert(`Failed to delete module: ${error.message}`);
      setIsDeleting(false);
    }
  };

  // Helper function to handle module selection and persist it
  const handleModuleSelection = (moduleId) => {
    if (!moduleId) return;
    
    // Save to localStorage first to ensure it's available for back navigation
    localStorage.setItem("selectedModuleId", moduleId);
    
    if (isDevMode) console.log('Selected and saved module ID:', moduleId);
    
    // We're removing the automatic switching to "show all modules" here
    // to allow the filter toggle to work independently
    
    // Call the parent component's handler
    if (onModuleSelect) {
      onModuleSelect(moduleId);
    }
  };

  const toggleSidebar = () => {
    setIsMinimized((prev) => !prev);
  };

  // Render topics list for Forløb view
  const renderTopicsList = () => {
    if (topics.length === 0) {
      return (
        <div className="text-center p-3">
          <p className="text-muted">Ingen forløb tilgængelige.</p>
        </div>
      );
    }

    return (
      <ListGroup variant="flush" className="module-list">
        {topics.map(topic => (
          <ListGroup.Item
            key={topic.id}
            action
            active={topic.id === selectedTopicId}
            onClick={() => handleTopicSelect(topic.id)}
            className="d-flex justify-content-between align-items-center border-start-0 border-end-0 position-relative module-item"
            style={{ overflow: "hidden" }}
          >
            <div className="d-flex flex-column w-100" style={{ minWidth: 0 }}>
              <div>
                <span className="fw-medium module-title">
                  {topic.name}
                </span>
              </div>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  // Render modules list for Moduler view
  const renderModulesList = () => {
    let modulesToDisplay = getFilteredModules();
    
    // In filtered view, don't force the display of filtered out modules
    // This allows the filter toggle to work properly and show only the expected modules
    // The automatic selection of today's module is now handled in the filter toggle effect
    
    if (modulesToDisplay.length === 0) {
      return (
        <div className="text-center p-3">
          {showAllModules ? (
            <p className="text-muted">Ingen moduler tilgængelige</p>
          ) : (
            <div>
              <p className="text-muted mb-1">Ingen aktuelle moduler</p>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowAllModules(true)}
              >
                Vis alle moduler
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <ListGroup variant="flush" className="module-list">
          {modulesToDisplay.map((module) => {
            if (!module) return null;

            const moduleActivities = Array.isArray(module.activities)
              ? module.activities
              : [];
            // Filter out folder-type activities
            const nonFolderActivities = moduleActivities.filter(
              (act) => act && act.type !== "folder"
            );
            const totalActivities = nonFolderActivities.length;
            const completedActivities = nonFolderActivities.filter(
              (act) => act && act.completed
            ).length;
            const allCompleted =
              totalActivities > 0 &&
              completedActivities === totalActivities;
            
            // Highlight current module
            const moduleDate = parseDanishDate(module.date);
            const today = getToday();
            
            // Set hours, minutes, seconds to 0 for date comparison
            if (moduleDate) {
              moduleDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
            }
            
            const isCurrentModule = moduleDate && 
              moduleDate.getDate() === today.getDate() &&
              moduleDate.getMonth() === today.getMonth() &&
              moduleDate.getFullYear() === today.getFullYear();
            
            // Debug current module detection (only in development)
            if (isDevMode && isCurrentModule) {
              console.log(`Current module: ${module.id} - ${module.title} - ${moduleDate.toDateString()}`);
            }

            // Determine CSS class based on module status:
            // - 'current-module' for the selected module
            // - 'today-module' for today's module (when not selected)
            // - no special class for other modules
            const isSelected = module.id === selectedModuleId;
            let moduleClass = '';
            
            if (isSelected) {
              moduleClass = 'current-module';
            } else if (isCurrentModule) {
              moduleClass = 'today-module';
            }

            return (
              <ListGroup.Item
                key={module.id || Math.random().toString()}
                action
                active={isSelected}
                onClick={() => handleModuleSelection(module.id)}
                className={`d-flex justify-content-between align-items-center border-start-0 border-end-0 position-relative module-item ${moduleClass}`}
                style={{ overflow: "hidden" }}
              >
                <div
                  className="d-flex flex-column w-100"
                  style={{ minWidth: 0 }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div
                      className={`text-nowrap small ${isSelected ? 'text-primary fw-bold' : 'text-muted'}`}
                      style={{ fontSize: "0.8rem" }}
                    >
                      {module.date || "No date"}
                      {isCurrentModule && !isSelected && (
                        <span className="today-badge">I dag</span>
                      )}
                    </div>

                    {effectiveUserRole === "student" &&
                      (allCompleted ? (
                        <BsCheckCircleFill
                          className="text-success"
                          style={{ fontSize: "1.5rem" }}
                        />
                      ) : (
                        <BsCircleFill
                          className={
                            completedActivities > 0
                              ? "text-warning"
                              : "text-secondary"
                          }
                          style={{ opacity: 0.5, fontSize: "1.5rem" }}
                        />
                      ))}
                  </div>

                  <div>
                    <span className={`fw-medium module-title ${isSelected ? 'text-primary' : ''}`}>
                      {module.title}
                    </span>
                    {module.subtitle && (
                      <small className="text-muted d-block">
                        {module.subtitle}
                      </small>
                    )}

                    {/* Add progress indicator for students */}
                    {effectiveUserRole === "student" && totalActivities > 0 && (
                      <small className="text-muted d-block">
                        {completedActivities} af {totalActivities}{" "}
                        aktiviteter gennemført
                      </small>
                    )}

                    {/* Add activity count for teachers */}
                    {/* {userRole === "teacher" && totalActivities > 0 && (
                      <small className="text-muted d-block">
                        {totalActivities}{" "}
                        {totalActivities === 1
                          ? "aktivitet"
                          : "aktiviteter"}
                      </small>
                    )} */}
                  </div>
                </div>

                {/* Delete button (only visible for teachers on hover) */}
                {effectiveUserRole === "teacher" && (
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
          })}
        </ListGroup>
      </>
    );
  };

  // Add effect to check URL for module ID param on initial mount
  useEffect(() => {
    // Only run this once on initial mount
    if (!isInitialMountRef.current) return;
    
    try {
      // Get the current URL path
      const path = window.location.pathname;
      
      // Check if the URL contains a module ID pattern like /module/module-123/...
      const modulePattern = /\/module\/(module-\w+)\//;
      const match = path.match(modulePattern);
      
      if (match && match[1]) {
        const urlModuleId = match[1];
        if (isDevMode) console.log('Found module ID in URL:', urlModuleId);
        
        // Check if this module exists in our list
        const moduleExists = safeModules.some(m => m.id === urlModuleId);
        
        if (moduleExists) {
          // Ensure the module will be visible in the sidebar
          if (isModuleFilteredByDate(urlModuleId)) {
            if (isDevMode) console.log('Module from URL would be filtered out - showing all modules');
            setShowAllModules(true);
          }
          
          // Select this module
          isAutoSelectingRef.current = true;
          handleModuleSelection(urlModuleId);
        }
      }
    } catch (error) {
      console.error('Error checking URL for module ID:', error);
    }
  }, [safeModules]); // Only run when module list changes (effectively just on initial load)

  return (
    <div
      className={`module-sidebar p-3 ${isMinimized ? "minimized" : ""}`}
      key={`sidebar-${renderKey}`}
    >
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
                      safeModules.find((m) => m.id === selectedModuleId)
                        ?.icon) ||
                    // Then fall back to the stored selectedIcon
                    selectedIcon ||
                    // Then use a default placeholder
                    "/abc-icon.svg"
                  }
                  alt="Course Icon"
                  style={{ width: "55px", height: "55px" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/55?text=ABC";
                  }}
                />
                {effectiveUserRole === "teacher" && viewMode === 'modules' && (
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
          
          {/* View toggle buttons */}
          <div className="mb-3 d-flex justify-content-center">
            <ToggleButtonGroup type="radio" name="view-options" value={viewMode} onChange={handleViewModeChange}>
              <ToggleButton id="tbg-radio-1" value="modules" variant="outline-primary" size="sm">
                Moduler
              </ToggleButton>
              <ToggleButton id="tbg-radio-2" value="topics" variant="outline-primary" size="sm">
                Forløb
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          
          {/* Toggle to show all modules (for all users in module view) */}
          {viewMode === 'modules' && (
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="filterSwitch"
                  checked={!showAllModules}
                  onChange={() => setShowAllModules(!showAllModules)}
                />
                <label className="form-check-label" htmlFor="filterSwitch">
                  <small>Vis aktuelle moduler</small>
                </label>
              </div>
            </div>
          )}

          {/* Render content based on view mode */}
          {viewMode === 'modules' ? renderModulesList() : renderTopicsList()}

          {/* Create Module Button (only for teachers in module view) */}
          {effectiveUserRole === "teacher" && viewMode === 'modules' && (
            <div className="mt-3 mb-3">
              <Button
                variant="outline-primary"
                size="sm"
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={() => {
                  // Fetch topics to ensure we have the latest list
                  fetchTopics();
                  // Open the modal
                  setShowCreateModal(true);
                }}
              >
                <BsPlusCircle className="me-2" /> Opret nyt modul
              </Button>
            </div>
          )}
        </>
      )}

      {/* Icon Selection Modal */}
      <Modal show={showIconModal} onHide={() => setShowIconModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Vælg kursusikon</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="upload" title="Upload">
              <Form.Group className="mb-3">
                <Form.Label>Upload et billede</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleIconFileChange}
                />
                {iconPreview && (
                  <div className="mt-2">
                    <Image src={iconPreview} alt="Preview" fluid />
                  </div>
                )}
              </Form.Group>
            </Tab>
            <Tab eventKey="gallery" title="Galleri">
              <div className="icon-gallery">
                {predefinedIcons.map((icon, index) => (
                  <div
                    key={index}
                    className={`icon-item ${
                      selectedIcon === icon.url ? "selected" : ""
                    }`}
                    onClick={() => handleIconSelect(icon.url)}
                  >
                    <img src={icon.url} alt={icon.name} />
                  </div>
                ))}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowIconModal(false)}>
            Annuller
          </Button>
          <Button variant="primary" onClick={handleSaveIcon}>
            Gem
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Module Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Opret nyt modul</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titel</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={newModule.title}
                onChange={handleCreateModuleChange}
                placeholder="Indtast modultitel"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dato</Form.Label>
              <DatePicker
                selected={newModule.date}
                onChange={handleDateChange}
                dateFormat="dd. MMMM yyyy"
                locale="da"
                className="form-control"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Beskrivelse (valgfrit)</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={newModule.description}
                onChange={handleCreateModuleChange}
                placeholder="Indtast modulbeskrivelse"
                rows={3}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Forløb</Form.Label>
              <Form.Select
                name="topicId"
                value={newModule.topicId}
                onChange={handleCreateModuleChange}
              >
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
                {topics.length === 0 && (
                  <option value="topic-1">Romantikken</option>
                )}
              </Form.Select>
              <Form.Text className="text-muted">
                Vælg hvilket forløb modulet skal tilhøre
              </Form.Text>
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Annuller
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateModule}
            disabled={isCreating}
          >
            {isCreating ? "Opretter..." : "Opret modul"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Module Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Bekræft sletning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Er du sikker på, at du vil slette modulet "{moduleToDelete?.title}"?
          </p>
          <p className="text-danger">Denne handling kan ikke fortrydes.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuller
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Sletter..." : "Slet modul"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ModuleSidebar;
