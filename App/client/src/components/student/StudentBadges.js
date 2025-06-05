import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BsTrophy } from 'react-icons/bs';

const StudentBadges = ({ studentId = "1" }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/student/${studentId}/badges`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch badges');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.badges)) {
          setBadges(data.badges);
        } else {
          setBadges([]);
        }
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Kunne ikke hente badges. Prøv igen senere.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBadges();
  }, [studentId]);
  
  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Indlæser...</span>
        </Spinner>
      </div>
    );
  }
  
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  
  if (badges.length === 0) {
    return (
      <div className="text-center p-3">
        <BsTrophy size={30} className="mb-2 text-muted" />
        <p className="text-muted">Du har ikke optjent nogen badges endnu.</p>
      </div>
    );
  }

  return (
    <Container className="badges-container">
      <Row>
        {badges.map((badge, index) => (
          <Col key={index} xs={6} sm={4} md={3} className="mb-3">
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip>
                  <strong>{badge.badge_name}</strong><br />
                  {badge.badge_description}<br />
                  Optjent: {new Date(badge.earned_timestamp).toLocaleString('da-DK', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Tooltip>
              }
            >
              <Card className="badge-card text-center">
                <Card.Body>
                  <div className="badge-icon mb-2" style={{ fontSize: '2rem' }}>
                    {badge.badge_icon}
                  </div>
                  <Card.Title className="badge-name">{badge.badge_name}</Card.Title>
                </Card.Body>
              </Card>
            </OverlayTrigger>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default StudentBadges;