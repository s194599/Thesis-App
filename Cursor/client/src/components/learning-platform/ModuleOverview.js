import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Table, Badge, Button, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { 
  BsFileEarmarkPdf, 
  BsFileEarmarkWord, 
  BsYoutube,
  BsListCheck,
  BsFileEarmark,
  BsImage,
} from "react-icons/bs";

const ModuleOverview = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [module, setModule] = useState(null);
  const [activities, setActivities] = useState([]);
  const [students, setStudents] = useState([]);
  const [completions, setCompletions] = useState([]);

  // Profile image URLs (open source)
  const profileImages = {
    // Default profile images from UI Faces (open source)
    default: [
      "https://randomuser.me/api/portraits/men/1.jpg",
      "https://randomuser.me/api/portraits/women/2.jpg",
      "https://randomuser.me/api/portraits/men/3.jpg",
      "https://randomuser.me/api/portraits/women/4.jpg",
      "https://randomuser.me/api/portraits/men/5.jpg",
      "https://randomuser.me/api/portraits/women/6.jpg",
    ],
    // Known student IDs with specific images
    "1": "https://randomuser.me/api/portraits/men/41.jpg", // Christian Wu
  };

  // Get profile image for a student
  const getProfileImage = (studentId, index) => {
    // If we have a specific image for this student ID, use it
    if (profileImages[studentId]) {
      return profileImages[studentId];
    }
    // Otherwise use one from the default collection based on index
    return profileImages.default[index % profileImages.default.length];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Find the module from localStorage first
        const savedModules = localStorage.getItem("learningModules");
        let moduleData = null;
        
        if (savedModules) {
          const modules = JSON.parse(savedModules);
          moduleData = modules.find(m => m.id === moduleId);
        }
        
        if (moduleData) {
          setModule(moduleData);
        } else {
          // Set a default module object with at least the ID
          setModule({ id: moduleId, title: `Module ${moduleId}` });
        }
        
        // Fetch activities for this module
        const activitiesResponse = await fetch(`/api/module-activities/${moduleId}`);
        if (!activitiesResponse.ok) {
          throw new Error('Kunne ikke hente aktiviteter');
        }
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.activities || []);
        
        // Fetch all students
        const studentsResponse = await fetch(`/api/student/all`);
        if (!studentsResponse.ok) {
          throw new Error('Kunne ikke hente studerende');
        }
        const studentsData = await studentsResponse.json();
        const allStudents = studentsData.students || [];
        setStudents(allStudents);
        
        // For the prototype, we'll assume only Christian Wu has completions
        // In a real implementation, you would fetch completions for each student
        const completionsResponse = await fetch(`/api/student-activity-completions?studentId=1`);
        let allCompletions = [];
        
        try {
          // Also fetch the actual completion data with timestamps
          const detailedCompletionsResponse = await fetch(`/api/database/activity_completions.json`);
          if (detailedCompletionsResponse.ok) {
            const detailedData = await detailedCompletionsResponse.json();
            if (detailedData.completions && Array.isArray(detailedData.completions)) {
              allCompletions = detailedData.completions.filter(
                completion => completion.module_id === moduleId
              );
            }
          }
        } catch (err) {
          console.error("Error fetching detailed completions:", err);
          // Continue with basic completions data
        }
        
        // If we couldn't get the detailed completions, fall back to the basic list
        if (allCompletions.length === 0 && completionsResponse.ok) {
          const data = await completionsResponse.json();
          if (data.success && Array.isArray(data.completed_activities)) {
            // Convert to the format our component expects
            allCompletions = data.completed_activities.map(activityId => ({
              activity_id: activityId,
              module_id: moduleId, // Assume all completions are for this module
              student_id: "1", // Default to Christian Wu (ID: 1)
              timestamp: new Date().toISOString() // Use current time as fallback
            }));
          }
        }
        
        // Add some mock data for other students to show the table better
        // In a real implementation, this would be fetched from the backend for each student
        if (allStudents.length > 1 && activitiesData.activities && activitiesData.activities.length > 0) {
          // Make some random completions for other students
          allStudents.forEach(student => {
            if (student.student_id !== "1") { // Skip Christian Wu (we have his real data)
              // Only include activities for the current module
              const moduleActivities = activitiesData.activities.filter(
                activity => activity.moduleId === moduleId
              );
              
              const randomCompletedActivities = moduleActivities
                .filter(() => Math.random() > 0.5) // Randomly select about half of activities
                .map(activity => {
                  // Generate a random timestamp within the last 7 days
                  const daysAgo = Math.floor(Math.random() * 7); // 0-6 days ago
                  const hoursAgo = Math.floor(Math.random() * 24); // 0-23 hours ago
                  const minutesAgo = Math.floor(Math.random() * 60); // 0-59 minutes ago
                  
                  const date = new Date();
                  date.setDate(date.getDate() - daysAgo);
                  date.setHours(date.getHours() - hoursAgo);
                  date.setMinutes(date.getMinutes() - minutesAgo);
                  
                  return {
                    activity_id: activity.id,
                    module_id: moduleId,
                    student_id: student.student_id,
                    timestamp: date.toISOString()
                  };
                });
              allCompletions = [...allCompletions, ...randomCompletedActivities];
            }
          });
        }
        
        setCompletions(allCompletions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Fejl ved indlæsning af data');
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchData();
    }
  }, [moduleId]);
  
  if (loading) return (
    <Container className="py-5 text-center">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">Indlæser modul overblik...</p>
    </Container>
  );

  if (error) return (
    <Container className="py-5 text-center">
      <Alert variant="danger">
        {error}
      </Alert>
      <Button variant="primary" onClick={() => navigate("/platform")}>
        Tilbage til platformen
      </Button>
    </Container>
  );
  
  if (!module || activities.length === 0) return (
    <Container className="py-5 text-center">
      <Alert variant="info">
        Ingen aktiviteter fundet for dette modul.
      </Alert>
      <Button variant="primary" onClick={() => navigate("/platform")}>
        Tilbage til platformen
      </Button>
    </Container>
  );
  
  // Calculate student progress for each activity
  const studentProgress = students.map(student => {
    const studentId = student.student_id || student.id;
    
    // Get activity IDs this student has completed
    // Filter completions for this student and this module
    const studentCompletions = completions.filter(
      completion => 
        completion.student_id === studentId && 
        completion.module_id === moduleId
    );
    
    // Extract just the activity IDs
    const completedActivityIds = studentCompletions.map(
      completion => completion.activity_id
    );
    
    // Only count activities that belong to the current module
    const moduleActivityIds = activities.map(activity => activity.id);
    const completedModuleActivities = completedActivityIds.filter(id => 
      moduleActivityIds.includes(id)
    );
    
    // Calculate percentage based only on activities in the current module
    const completionPercentage = activities.length > 0
      ? Math.round((completedModuleActivities.length / activities.length) * 100)
      : 0;
    
    // Find the most recent completion timestamp
    let latestTimestamp = null;
    if (studentCompletions.length > 0) {
      // Sort completions by timestamp (newest first)
      const sortedCompletions = [...studentCompletions].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      latestTimestamp = sortedCompletions[0].timestamp;
    }
    
    return {
      student_id: studentId,
      student_name: student.name,
      completedActivities: completedModuleActivities,
      completionPercentage,
      latestTimestamp
    };
  });
  
  // Function to format timestamp in a readable way
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "–";
    
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('da-DK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "–";
    }
  };
  
  // Render activity completion square with tooltip
  const renderActivitySquare = (activity, isCompleted) => {
    // Get icon based on activity type
    const getIconForType = (type, url = null) => {
      switch (type) {
        case "pdf":
          return <BsFileEarmarkPdf className="text-danger" size={20} />;
        case "youtube":
          return <BsYoutube className="text-danger" size={20} />;
        case "word":
          return <BsFileEarmarkWord className="text-primary" size={20} />;
        case "quiz":
          return <BsListCheck className="text-warning" size={20} />;
        case "image":
          return <BsImage className="text-success" size={20} />;
        default:
          return <BsFileEarmark className="text-secondary" size={20} />;
      }
    };

    return (
      <OverlayTrigger
        key={activity.id}
        placement="top"
        overlay={
          <Tooltip id={`tooltip-${activity.id}`}>
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '24px' }}>
                {getIconForType(activity.type, activity.url)}
              </div>
              <div className="ms-2" style={{ 
                maxWidth: '200px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {activity.title || 'Aktivitet'}
                {isCompleted ? ' (Gennemført)' : ' (Ikke gennemført)'}
              </div>
            </div>
          </Tooltip>
        }
      >
        <div
          className="d-inline-block"
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: isCompleted ? '#28a745' : '#dc3545',
            margin: '0 2px',
            borderRadius: '2px'
          }}
        />
      </OverlayTrigger>
    );
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Modul Overblik: {module.title}</h2>
        <Button 
          variant="outline-primary" 
          onClick={() => navigate("/platform")}
          className="d-flex align-items-center"
        >
          <FaArrowLeft className="me-2" /> Tilbage til platformen
        </Button>
      </div>
      
      {students.length === 0 ? (
        <Alert variant="info" className="text-center">
          Ingen studerende fundet.
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="bg-light">
              <tr>
                <th>Studerende</th>
                <th>Sidste aktivitet gennemført</th>
                <th>Aktiviteter status</th>
                <th className="text-center">Gennemført</th>
              </tr>
            </thead>
            <tbody>
              {studentProgress.map((student, index) => (
                <tr key={student.student_id}>
                  <td className="align-middle">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <img 
                          src={getProfileImage(student.student_id, index)} 
                          alt={student.student_name}
                          className="rounded-circle"
                          width="40"
                          height="40"
                          style={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/40?text=?";
                          }}
                        />
                      </div>
                      <div className="fw-bold">{student.student_name}</div>
                    </div>
                  </td>
                  <td className="align-middle text-center">
                    {formatTimestamp(student.latestTimestamp)}
                  </td>
                  <td className="align-middle">
                    <div className="d-flex flex-wrap gap-1">
                      {activities.map(activity => 
                        renderActivitySquare(
                          activity, 
                          student.completedActivities.includes(activity.id)
                        )
                      )}
                    </div>
                  </td>
                  <td className="align-middle text-center">
                    <span 
                      className="fw-bold"
                      style={{ fontSize: '1rem' }}
                    >
                      {student.completionPercentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
};

export default ModuleOverview; 