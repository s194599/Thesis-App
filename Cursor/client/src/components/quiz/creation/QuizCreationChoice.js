import React from "react";
import { Container, Card, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsRobot, BsPencilSquare, BsArrowLeft } from "react-icons/bs";
import { Link } from "react-router-dom";

const QuizCreationChoice = () => {
  const navigate = useNavigate();

  return (
    <Container className="mt-5">
      <div className="mb-4">
        <Link to="/platform" className="text-decoration-none text-dark">
          <BsArrowLeft className="me-2" />
          Tilbage til Modul
        </Link>
      </div>

      <h2 className="mb-4 text-center">Hvordan vil du oprette din quiz?</h2>

      <Row className="justify-content-center">
        <Col md={5} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center text-center p-4">
              <BsRobot size={48} className="text-primary mb-3" />
              <Card.Title>Generer med AI</Card.Title>
              <Card.Text>
                Lad kunstig intelligens oprette en quiz baseret på emne, tekst eller filer.
                Perfekt til at spare tid og få inspiration.
              </Card.Text>
              <div className="mt-auto pt-3">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="px-4"
                  onClick={() => navigate("/quiz/create")}
                >
                  Generer med AI
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center text-center p-4">
              <BsPencilSquare size={48} className="text-primary mb-3" />
              <Card.Title>Opret manuelt</Card.Title>
              <Card.Text>
                Opret og tilpas din egen quiz med dine egne spørgsmål og svarmuligheder.
                Fuld kontrol over indholdet.
              </Card.Text>
              <div className="mt-auto pt-3">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="px-4"
                  onClick={() => navigate("/quiz/manual-create")}
                >
                  Opret manuelt
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default QuizCreationChoice; 