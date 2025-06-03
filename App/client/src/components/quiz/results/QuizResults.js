import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Table, Badge, Button, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { BsPencil } from 'react-icons/bs';

const QuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizResults, setQuizResults] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile image URLs (open source)
  const profileImages = {
    // Default profile images of young people (around 18) from randomuser.me
    default: [
      "https://randomuser.me/api/portraits/men/18.jpg", // Young male
      "https://randomuser.me/api/portraits/women/9.jpg", // Young female
      "https://randomuser.me/api/portraits/men/53.jpg", // Young male
      "https://randomuser.me/api/portraits/women/46.jpg", // Young female
      "https://randomuser.me/api/portraits/men/61.jpg", // Young male
      "https://randomuser.me/api/portraits/women/72.jpg", // Young female
    ],
    // Unique images for all 10 students matching their gender and appropriate age (high school)
    "1": "https://randomuser.me/api/portraits/men/18.jpg", // Christian Wu
    "2": "https://randomuser.me/api/portraits/women/9.jpg", // Maria Jensen
    "3": "https://randomuser.me/api/portraits/men/53.jpg", // Peter Nielsen
    "4": "https://randomuser.me/api/portraits/women/46.jpg", // Sofie Hansen
    "5": "https://randomuser.me/api/portraits/men/61.jpg", // Frederik Barba
    "6": "https://randomuser.me/api/portraits/women/72.jpg", // Emma Christensen
    "7": "https://randomuser.me/api/portraits/men/65.jpg", // Mikkel Pedersen
    "8": "https://randomuser.me/api/portraits/women/31.jpg", // Ida Larsen
    "9": "https://randomuser.me/api/portraits/men/19.jpg", // Alexander Schmidt
    "10": "https://randomuser.me/api/portraits/women/89.jpg", // Laura Andersen
  };

  // Get profile image for a student
  const getProfileImage = (studentId, index) => {
    // If we have a specific image for this student ID, use it
    if (profileImages[studentId]) {
      return profileImages[studentId];
    }
    // Otherwise use one from the default collection based on index
    return profileImages.default[index % profileImages.default.length];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all students
        const studentsResponse = await fetch(`/api/student/all`);
        if (!studentsResponse.ok) {
          throw new Error('Kunne ikke hente elever');
        }
        const studentsData = await studentsResponse.json();
        setAllStudents(studentsData.students || []);
        
        // Fetch quiz results - Always pass userRole=teacher for this page
        const resultsResponse = await fetch(`/api/student/quiz/${quizId}/results?userRole=teacher`);
        if (!resultsResponse.ok) {
          throw new Error('Kunne ikke hente quiz resultater');
        }
        const resultsData = await resultsResponse.json();
        
        // Fetch the quiz data directly from quizzes.json to get correct answers
        const quizResponse = await fetch(`/api/quizzes/${quizId}`);
        if (!quizResponse.ok) {
          throw new Error('Kunne ikke hente quiz detaljer');
        }
        const quizData = await quizResponse.json();
        setQuizDetails(quizData);
        
        // Create a map of question IDs to correct answers
        const correctAnswersMap = {};
        if (quizData && quizData.questions) {
          quizData.questions.forEach(question => {
            correctAnswersMap[question.id] = question.correctAnswer;
          });
        }
        
        // Update the results to include full question and answer data
        if (Array.isArray(resultsData)) {
          // Enhance the results with detailed info where available
          const enhancedResults = resultsData.map(result => {
            if (result.answers) {
              return {
                ...result,
                answers: result.answers.map(answer => {
                  // For each answer, add the question text and correct answer from quizzes.json if available
                  const questionId = answer.question_id;
                  const correctAnswer = correctAnswersMap[questionId] || 
                                        answer.correct_answer || 
                                        (answer.correct ? answer.answer : "Ukendt svar");
                  
                  return {
                    ...answer,
                    question_text: answer.question || `Spørgsmål ${answer.question_id}`,
                    student_answer: answer.answer || "Intet svar",
                    correct_answer: correctAnswer
                  };
                })
              };
            }
            return result;
          });
          setQuizResults(enhancedResults);
        } else {
          setQuizResults(resultsData);
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
    if (!timestamp) return "Ikke taget";
    const date = new Date(timestamp);
    return date.toLocaleString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time between start and end timestamps
  const calculateQuizDuration = (startTimestamp, endTimestamp) => {
    if (!startTimestamp || !endTimestamp) return "–";
    
    try {
      const start = new Date(startTimestamp);
      const end = new Date(endTimestamp);
      
      // Calculate duration in milliseconds
      const durationMs = end - start;
      
      if (durationMs < 0) return "–"; // Invalid duration
      
      // Convert to minutes and seconds
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      
      return `${minutes} min ${seconds} sek`;
    } catch (error) {
      console.error("Error calculating quiz duration:", error);
      return "–";
    }
  };

  // Get the quiz title from details or fall back to the ID or a default
  const quizTitle = quizDetails?.title || `Quiz ${quizId.replace('quiz_', '')}`;
  
  // Find the maximum number of questions among all results
  const maxQuestions = Math.max(...quizResults.map(result => result.answers?.length || 0), 0);
  
  // Create a map of student IDs to their quiz results
  const studentResultsMap = {};
  quizResults.forEach(result => {
    studentResultsMap[result.student_id] = result;
  });
  
  // Combine all students with their quiz results (if available)
  const combinedStudentData = allStudents.map(student => {
    const result = studentResultsMap[student.student_id];
    return {
      student_id: student.student_id,
      student_name: student.name,
      class: student.class,
      hasResult: !!result,
      ...result
    };
  });
  
  // Render question result indicator with tooltip
  const renderQuestionResult = (answer, questionIndex) => {
    if (!answer) return <span className="text-muted">-</span>;
    
    const isCorrect = answer.correct;
    
    // Get the question text from the answer object
    const questionText = answer.question_text || answer.question || `Spørgsmål ${questionIndex + 1}`;
    
    // Get the student's answer
    const studentAnswer = answer.student_answer || answer.answer || "Intet svar";
    
    // Get the correct answer from our enhanced data
    const correctAnswer = answer.correct_answer || "Se facitliste";
    
    return (
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id={`tooltip-question-${questionIndex}`}>
            <div style={{ 
              maxWidth: '300px',
              textAlign: 'left'
            }}>
              <div className="fw-bold mb-1">
                {questionText}
              </div>
              <div className="small">
                <div><strong>Elevens svar:</strong> {studentAnswer}</div>
                {!isCorrect && <div><strong>Korrekt svar:</strong> {correctAnswer}</div>}
              </div>
            </div>
          </Tooltip>
        }
      >
        <div 
          className={`d-inline-flex justify-content-center align-items-center rounded-circle ${
            isCorrect ? 'bg-success' : 'bg-danger'
          }`} 
          style={{ 
            width: '32px', 
            height: '32px', 
            color: 'white',
            cursor: 'help'
          }}
        >
          {isCorrect ? <FaCheck /> : <FaTimes />}
        </div>
      </OverlayTrigger>
    );
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quiz Resultater: {quizTitle}</h2>
        <div className="d-flex">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate(`/quiz/preview/${quizId}`)}
            className="d-flex align-items-center me-2"
          >
            <BsPencil className="me-2" /> Rediger Quiz
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => navigate("/platform")}
            className="d-flex align-items-center"
          >
            <FaArrowLeft className="me-2" /> Tilbage til platformen
          </Button>
        </div>
      </div>
      
      {allStudents.length === 0 ? (
        <Alert variant="info" className="text-center">
          Ingen elever fundet.
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="bg-light">
              <tr>
                <th>Elever</th>
                <th>Klasse</th>
                <th>Antal forsøg</th>
                <th className="text-center">Dato (sidste forsøg)</th>
                <th className="text-center">Besvarelsestid (sidste forsøg)</th>
                {Array.from({ length: maxQuestions }).map((_, i) => (
                  <th key={i} className="text-center" style={{ width: '70px' }}>
                    Spg. {i + 1}
                  </th>
                ))}
                <th className="text-center">Score</th>
              </tr>
            </thead>
            <tbody>
              {combinedStudentData.map((student, index) => (
                <tr key={`${student.student_id}-${index}`}>
                  <td className="align-middle">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <img 
                          src={getProfileImage(student.student_id, index)} 
                          alt={student.student_name}
                          className="rounded-circle"
                          width="40"
                          height="40"
                          style={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/40?text=?";
                          }}
                        />
                      </div>
                      <div className="fw-bold">{student.student_name}</div>
                    </div>
                  </td>
                  <td className="align-middle">
                    {student.class || "-"}
                  </td>
                  <td className="align-middle text-center">
                    <span className="fw-bold">
                      {student.hasResult ? student.attempts : "0"}
                    </span>
                  </td>
                  <td className="align-middle text-center">
                    {formatDate(student.timestamp)}
                  </td>
                  <td className="align-middle text-center">
                    {student.hasResult ? 
                      calculateQuizDuration(student.start_timestamp, student.timestamp) : "–"}
                  </td>
                  {Array.from({ length: maxQuestions }).map((_, i) => (
                    <td key={i} className="text-center align-middle">
                      {student.hasResult && student.answers && student.answers[i] ? 
                        renderQuestionResult(student.answers[i], i)
                       : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  ))}
                  <td className="align-middle text-center">
                    {student.hasResult ? (
                      <span 
                        className="fw-bold"
                        style={{ fontSize: '1rem' }}
                      >
                        {Math.round((student.score / student.total_questions) * 100)}%
                      </span>
                    ) : (
                      <span className="text-muted fw-bold">
                        -
                      </span>
                    )}
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