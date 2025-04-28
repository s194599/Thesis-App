import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-light py-4 mt-5">
      <Container>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p className="mb-0 text-muted">
              &copy; {new Date().getFullYear()} Quiz Generator App
            </p>
          </div>
          <div>
            <p className="mb-0 text-muted">
              Created with <span className="text-danger">♥</span> for learning
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer; 