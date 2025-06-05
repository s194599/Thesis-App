import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Tab, Tabs, Alert } from 'react-bootstrap';
import { BsTrophy } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import StudentBadges from './StudentBadges';
import '../../styles/badges.css';

const BadgeDashboard = () => {
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const navigate = useNavigate();

  useEffect(() => {
    // Get user role from localStorage
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
      
      // Redirect teachers away from this page
      if (savedRole === 'teacher') {
        console.log('Teacher attempted to access student badges page - redirecting');
        navigate('/platform');
      }
    }
    
    // Listen for role changes
    const handleUserRoleChange = (e) => {
      const newRole = e.detail;
      setUserRole(newRole);
      if (newRole === 'teacher') {
        console.log('Role changed to teacher while on badges page - redirecting');
        navigate('/platform');
      }
    };
    
    window.addEventListener('userRoleChanged', handleUserRoleChange);
    return () => window.removeEventListener('userRoleChanged', handleUserRoleChange);
  }, [navigate]);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/badges');
        
        if (!response.ok) {
          throw new Error('Failed to fetch badges');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.badges)) {
          setAllBadges(data.badges);
        } else {
          setAllBadges([]);
        }
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Kunne ikke hente badges. Prøv igen senere.');
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch badges if user is a student
    if (userRole === 'student') {
      fetchBadges();
    }
  }, [userRole]);
  
  if (userRole === 'teacher') {
    return (
      <Container className="text-center p-5">
        <Alert variant="warning">
          <Alert.Heading>Kun for elever</Alert.Heading>
          <p>Badge-systemet er kun tilgængeligt for elever.</p>
        </Alert>
      </Container>
    );
  }
  
  if (loading) {
    return (
      <Container className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Indlæser...</span>
        </Spinner>
      </Container>
    );
  }
  
  if (error) {
    return <Container><div className="alert alert-danger">{error}</div></Container>;
  }

  return (
    <Container className="badges-overview py-4">
      <h2 className="mb-4">Badges og Præstationer</h2>
      
      <Tabs defaultActiveKey="my-badges" className="mb-4">
        <Tab eventKey="my-badges" title="Mine Badges">
          <StudentBadges studentId="1" />
        </Tab>
        <Tab eventKey="available-badges" title="Tilgængelige Badges">
          <div className="badges-section">
            <div className="badges-section-title">Quiz Præstationer</div>
            <Row>
              {allBadges
                .filter(badge => badge.type === 'achievement')
                .map((badge, index) => (
                  <Col key={index} xs={6} sm={4} md={3} className="mb-3">
                    <Card className="badge-card text-center">
                      <Card.Body>
                        <div className="badge-icon mb-2">
                          {badge.icon}
                        </div>
                        <Card.Title className="badge-name">{badge.name}</Card.Title>
                        <Card.Text className="badge-description small text-muted">
                          {badge.description}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
            </Row>
          </div>
        </Tab>
      </Tabs>

      <div className="mt-5">
        <h4>Om Badges</h4>
        <p>
          Badges er en måde at anerkende og fejre dine præstationer i læringsplatformen.
          Fortsæt med at tage quizzer, udforske moduler og løse opgaver for at låse op for flere badges!
        </p>
      </div>
    </Container>
  );
};

export default BadgeDashboard; 