import React from 'react';
import { Container, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './TopBar.css'; // We'll create this CSS file next

const TopBar = () => {
  return (
    <Navbar bg="white" className="border-bottom shadow-sm py-2">
      <Container fluid className="ps-6">
        <Link to="/" className="navbar-brand d-flex align-items-center text-decoration-none">
          <div className="lectio-brand me-2">
            <span className="lectio-text">Lectio</span>
          </div>
          <span className="classroom-text">Classroom</span>
        </Link>
      </Container>
    </Navbar>
  );
};

export default TopBar; 