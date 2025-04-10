import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, ProgressBar, Badge, Button } from 'react-bootstrap';
import { FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';

const QuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizResults, setQuizResults] = useState([]);
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch quiz results
        const resultsResponse = await fetch(`/api/student/quiz/${quizId}/results`);
        if (!resultsResponse.ok) {
          throw new Error('Kunne ikke hente quiz resultater');
        }
        const resultsData = await resultsResponse.json();
        setQuizResults(resultsData);
        
        try {
          // Try to fetch quiz details, but continue if it fails
          const quizResponse = await fetch(`/api/quizzes/${quizId}`);
          if (quizResponse.ok) {
            const quizData = await quizResponse.json();
            setQuizDetails(quizData);
          }
        } catch (quizErr) {
          console.error('Error fetching quiz details:', quizErr);
          // We don't set an error here since we can still show results without quiz details
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError(err.message || 'Fejl ved indlæsning af quiz resultater');
        setLoading(false);
      }
    };

    fetchData();
  }, [quizId]);

  if (loading) return (
    <Container className="py-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Indlæser...</span>
      </div>
      <p className="mt-3">Indlæser quiz resultater...</p>
    </Container>
  );

  if (error) return (
    <Container className="py-5 text-center">
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
      <Button variant="primary" onClick={() => navigate("/platform")}>
        Tilbage til platformen
      </Button>
    </Container>
  );

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get the quiz title from details or fall back to the ID or a default
  const quizTitle = quizDetails?.title || `Quiz ${quizId.replace('quiz_', '')}`;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quiz Resultater: {quizTitle}</h2>
        <Button 
          variant="outline-primary" 
          onClick={() => navigate("/platform")}
          className="d-flex align-items-center"
        >
          <FaArrowLeft className="me-2" /> Tilbage til platformen
        </Button>
      </div>
      
      {quizResults.map((result) => (
        <Card key={`${result.student_id}-${result.timestamp}`} className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">{result.student_name}</h5>
              <small className="text-muted">
                {formatDate(result.timestamp)}
              </small>
            </div>
            <div className="text-end">
              <Badge bg="info" className="me-2">
                Forsøg: {result.attempts}
              </Badge>
              <Badge bg={result.score === result.total_questions ? "success" : "warning"}>
                {Math.round((result.score / result.total_questions) * 100)}%
              </Badge>
            </div>
          </Card.Header>
          
          <Card.Body>
            <div className="d-flex gap-2 mb-3">
              {result.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`flex-grow-1 p-2 text-center rounded ${
                    answer.correct ? 'bg-success' : 'bg-danger'
                  }`}
                  style={{ minWidth: '40px' }}
                >
                  {answer.correct ? <FaCheck /> : <FaTimes />}
                </div>
              ))}
            </div>
            
            <ProgressBar
              now={(result.score / result.total_questions) * 100}
              label={`${Math.round((result.score / result.total_questions) * 100)}%`}
              variant={result.score === result.total_questions ? "success" : "warning"}
            />
          </Card.Body>
        </Card>
      ))}
      
      {quizResults.length === 0 && (
        <div className="text-center mt-5">
          <p>Ingen resultater fundet for denne quiz.</p>
        </div>
      )}
    </Container>
  );
};

export default QuizResults; 