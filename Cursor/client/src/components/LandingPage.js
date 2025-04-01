import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Container, Row, Col } from 'react-bootstrap';
import { BsFileEarmarkPlus, BsCollection } from 'react-icons/bs';

const LandingPage = () => {
  return (
    <Container className="mt-5">
      <Row className="text-center mb-5">
        <Col>
          <h1 className="display-4">Quiz Generator</h1>
          <p className="lead text-muted">
            Generate quizzes from your content or explore previously saved quizzes
          </p>
        </Col>
      </Row>
      
      <Row className="justify-content-center">
        <Col md={5} className="mb-4">
          <Card className="h-100 shadow-sm hover-card">
            <Card.Body className="d-flex flex-column text-center p-4">
              <div className="icon-container mb-3">
                <BsCollection size={50} className="text-primary" />
              </div>
              <Card.Title>Saved Quizzes</Card.Title>
              <Card.Text>
                Browse and take quizzes you've previously created and saved.
              </Card.Text>
              <div className="mt-auto">
                <Link to="/saved-quizzes">
                  <Button variant="outline-primary" size="lg" className="w-100">
                    View Saved Quizzes
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={5} className="mb-4">
          <Card className="h-100 shadow-sm hover-card">
            <Card.Body className="d-flex flex-column text-center p-4">
              <div className="icon-container mb-3">
                <BsFileEarmarkPlus size={50} className="text-success" />
              </div>
              <Card.Title>Create a Quiz</Card.Title>
              <Card.Text>
                Generate a new quiz from a topic, text, webpage, or document.
              </Card.Text>
              <div className="mt-auto">
                <Link to="/create-quiz">
                  <Button variant="outline-success" size="lg" className="w-100">
                    Create New Quiz
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LandingPage; 