import React from 'react';
import { Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ModuleTabs = ({ moduleId, activeTab = 'indhold', onTabChange }) => {
  const navigate = useNavigate();
  
  const handleQuizTabClick = () => {
    // Navigate to the saved quizzes page when Quiz tab is clicked
    navigate('/saved-quizzes');
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
      <Nav.Item>
        <Nav.Link 
          active={activeTab === 'quiz'} 
          onClick={handleQuizTabClick}
        >
          Quiz
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

export default ModuleTabs; 