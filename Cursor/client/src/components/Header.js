import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { BsBraces } from 'react-icons/bs';

const Header = () => {
  const location = useLocation();
  
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <BsBraces className="me-2" size={24} />
          <span>Quiz Generator</span>
        </Link>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Item>
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Home
              </Link>
            </Nav.Item>
            <Nav.Item>
              <Link 
                to="/saved-quizzes" 
                className={`nav-link ${location.pathname === '/saved-quizzes' ? 'active' : ''}`}
              >
                Saved Quizzes
              </Link>
            </Nav.Item>
            <Nav.Item>
              <Link 
                to="/create-quiz" 
                className={`nav-link ${location.pathname === '/create-quiz' ? 'active' : ''}`}
              >
                Create Quiz
              </Link>
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 