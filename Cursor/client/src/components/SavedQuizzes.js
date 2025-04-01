import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { BsArrowLeft, BsPlayFill, BsCalendar3 } from 'react-icons/bs';
import { getQuizzes } from '../services/api';

const SavedQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const data = await getQuizzes();
        // The API returns the quizzes directly as an array, sort them by timestamp (newest first)
        const sortedQuizzes = Array.isArray(data) 
          ? data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          : (data.quizzes ? data.quizzes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : []);
        
        setQuizzes(sortedQuizzes);
        setError(null);
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        setError('Failed to load saved quizzes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Saved Quizzes</h1>
        <Link to="/">
          <Button variant="outline-secondary">
            <BsArrowLeft className="me-2" /> Back to Home
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading quizzes...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : quizzes.length === 0 ? (
        <Alert variant="info">
          No quizzes found. Create a quiz first!
          <div className="mt-3">
            <Link to="/create-quiz">
              <Button variant="primary">Create a Quiz</Button>
            </Link>
          </div>
        </Alert>
      ) : (
        <Row>
          {quizzes.map((quiz) => (
            <Col key={quiz.id} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm quiz-card">
                <Card.Body>
                  <Card.Title className="mb-1">{quiz.title || 'Untitled Quiz'}</Card.Title>
                  
                  <div className="text-muted small mb-3">
                    <BsCalendar3 className="me-1" /> 
                    {quiz.timestamp ? formatDate(quiz.timestamp) : 'No date'}
                  </div>
                  
                  <Card.Text className="mb-2">
                    {quiz.description || 'No description'}
                  </Card.Text>
                  
                  <div className="small text-muted mb-3">
                    {quiz.questions ? `${quiz.questions.length} questions` : '0 questions'}
                  </div>
                  
                  <div className="d-grid">
                    <Link to={`/take-quiz/${quiz.id}`}>
                      <Button variant="primary" className="w-100">
                        <BsPlayFill className="me-1" /> Take Quiz
                      </Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default SavedQuizzes; 