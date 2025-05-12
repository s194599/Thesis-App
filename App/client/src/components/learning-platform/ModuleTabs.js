import React from 'react';
import { Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ModuleTabs = ({ moduleId, activeTab = 'indhold', onTabChange, userRole = 'teacher' }) => {
  const navigate = useNavigate();
  const isTeacher = userRole === 'teacher';
  
  const handleOverviewTabClick = () => {
    // Navigate to the module overview page when Overblik tab is clicked
    if (moduleId) {
      navigate(`/module/${moduleId}/overview`);
    }
  };
  
  const handleTabChange = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };
  
  return (
    <Nav variant="tabs" className="module-tabs mb-4">
      <Nav.Item>
        <Nav.Link 
          active={activeTab === 'indhold'} 
          onClick={() => handleTabChange('indhold')}
        >
          Indhold
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link 
          active={activeTab === 'forum'} 
          onClick={() => handleTabChange('forum')}
        >
          Forum
        </Nav.Link>
      </Nav.Item>
      {isTeacher && (
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'overblik'} 
            onClick={handleOverviewTabClick}
          >
            Overblik
          </Nav.Link>
        </Nav.Item>
      )}
    </Nav>
  );
};

export default ModuleTabs; 