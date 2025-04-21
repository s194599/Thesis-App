import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
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
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">Indlæser quiz resultater...</p>
    </Container>
  );

  if (error) return (
    <Container className="py-5 text-center">
      <Alert variant="danger">
        {error}
      </Alert>
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
  
  // Find the maximum number of questions among all results
  const maxQuestions = Math.max(...quizResults.map(result => result.answers?.length || 0));
  
  return (
    <Container fluid className="py-4">
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
      
      {quizResults.length === 0 ? (
        <Alert variant="info" className="text-center">
          Ingen resultater fundet for denne quiz.
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="bg-light">
              <tr>
                <th>Studerende</th>
                <th>Forsøg</th>
                <th>Dato</th>
                {Array.from({ length: maxQuestions }).map((_, i) => (
                  <th key={i} className="text-center" style={{ width: '60px' }}>
                    Spg. {i + 1}
                  </th>
                ))}
                <th className="text-center">Score</th>
              </tr>
            </thead>
            <tbody>
              {quizResults.map((result, resultIndex) => (
                <tr key={`${result.student_id}-${result.timestamp}-${resultIndex}`}>
                  <td className="align-middle">
                    <div className="fw-bold">{result.student_name}</div>
                  </td>
                  <td className="align-middle text-center">
                    <Badge bg="info">{result.attempts}</Badge>
                  </td>
                  <td className="align-middle">
                    {formatDate(result.timestamp)}
                  </td>
                  {Array.from({ length: maxQuestions }).map((_, i) => (
                    <td key={i} className="text-center align-middle">
                      {result.answers && result.answers[i] ? (
                        <div 
                          className={`d-inline-flex justify-content-center align-items-center rounded-circle ${
                            result.answers[i].correct ? 'bg-success' : 'bg-danger'
                          }`} 
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            color: 'white'
                          }}
                        >
                          {result.answers[i].correct ? <FaCheck /> : <FaTimes />}
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  ))}
                  <td className="align-middle text-center">
                    <Badge 
                      bg={result.score === result.total_questions ? "success" : "warning"} 
                      style={{ fontSize: '1rem', padding: '8px 12px' }}
                    >
                      {Math.round((result.score / result.total_questions) * 100)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
};

export default QuizResults; 