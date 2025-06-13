import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { BsTrophy } from 'react-icons/bs';
import './TopBar.css'; // We'll create this CSS file next

const TopBar = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('student'); // Default to student

  useEffect(() => {
    // Get user role from localStorage if available
    const savedRole = localStorage.getItem('userRole');
    console.log('TopBar - userRole from localStorage:', savedRole);
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  // Add a listener for the custom userRoleChanged event
  useEffect(() => {
    const handleUserRoleChange = (e) => {
      console.log('TopBar - userRoleChanged event received:', e.detail);
      setUserRole(e.detail);
    };

    window.addEventListener('userRoleChanged', handleUserRoleChange);
    return () => window.removeEventListener('userRoleChanged', handleUserRoleChange);
  }, []);

  console.log('TopBar rendering with userRole:', userRole);

  return (
    <Navbar bg="white" className="border-bottom shadow-sm py-2">
      <Container fluid className="d-flex justify-content-between">
        <Link to="/" className="navbar-brand d-flex align-items-center text-decoration-none">
          <div className="lectio-brand me-2">
            <span className="lectio-text">Lectio</span>
          </div>
          <span className="classroom-text">Classroom</span>
        </Link>
        
        <Nav className="ml-auto">
          {userRole === 'student' && (
            <Nav.Link 
              as={Link} 
              to="/badges" 
              className="d-flex align-items-center text-decoration-none"
            >
              <BsTrophy className="me-1" /> Mine Badges
            </Nav.Link>
          )}
          {/* <Nav.Link as={Link} to="/platform">Platform</Nav.Link> */}
        </Nav>
      </Container>
    </Navbar>
  );
};

export default TopBar; 