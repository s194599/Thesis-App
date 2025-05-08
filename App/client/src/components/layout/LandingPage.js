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
            Generer quizzer fra dit indhold eller udforsk tidligere gemte quizzer
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
              <Card.Title>Gemte quizzer</Card.Title>
              <Card.Text>
                Gennemse og tag quizzer, du tidligere har oprettet og gemt.
              </Card.Text>
              <div className="mt-auto">
                <Link to="/saved-quizzes">
                  <Button variant="outline-primary" size="lg" className="w-100">
                    Se Gemte Quizzer
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
              <Card.Title>Opret en Quiz</Card.Title>
              <Card.Text>
                Generer en ny quiz fra et emne, tekst, hjemmeside eller dokument.
              </Card.Text>
              <div className="mt-auto">
                <Link to="/create-quiz">
                  <Button variant="outline-success" size="lg" className="w-100">
                    Opret Ny Quiz
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