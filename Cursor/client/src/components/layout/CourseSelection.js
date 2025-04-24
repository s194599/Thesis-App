import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BsBook, BsBookHalf, BsGlobe, BsPeople } from 'react-icons/bs';

const CourseSelection = () => {
  const navigate = useNavigate();

  const courses = [
    { id: 'dansk', name: 'Dansk', icon: <BsBook size={48} />, color: '#4a90e2' },
    { id: 'historie', name: 'Historie', icon: <BsBookHalf size={48} />, color: '#e67e22' },
    { id: 'engelsk', name: 'Engelsk', icon: <BsGlobe size={48} />, color: '#27ae60' },
    { id: 'samfundsfag', name: 'Samfundsfag', icon: <BsPeople size={48} />, color: '#8e44ad' }
  ];

  const handleCourseSelect = (courseId) => {
    // Store the selected course in localStorage
    localStorage.setItem('selectedCourse', courseId);
    
    // Navigate to the platform view
    navigate('/platform');
  };

  return (
    <Container className="mt-5">
      <div className="mx-auto" style={{ maxWidth: '900px' }}>
        <Card className="shadow-sm border-0 rounded-3 mb-4">
          <Card.Header className="bg-white border-bottom py-3">
            <h4 className="mb-0 fw-bold">Mine fag</h4>
          </Card.Header>
          <Card.Body className="p-4">
            <Row className="g-4">
              {courses.map((course) => (
                <Col key={course.id} xs={12} sm={6} md={3}>
                  <Card 
                    className="h-100 shadow-sm course-card" 
                    onClick={() => handleCourseSelect(course.id)}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      borderTop: `4px solid ${course.color}`
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
                    }}
                  >
                    <Card.Body className="d-flex flex-column align-items-center text-center p-4">
                      <div className="mb-3" style={{ color: course.color }}>
                        {course.icon}
                      </div>
                      <Card.Title className="mb-0 fs-4">{course.name}</Card.Title>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default CourseSelection; 