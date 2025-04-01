import React from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import ModuleSidebar from './ModuleSidebar';
import ModuleContent from './ModuleContent';
import OverallProgress from './OverallProgress';
import { usePlatformContext } from '../context/PlatformContext';

const PlatformOverview = () => {
  const { isLoading } = usePlatformContext();

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5>Indlæser læringsplatform...</h5>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      <Row className="g-0">
        {/* Sidebar for module navigation */}
        <Col md={3} lg={3} className="sidebar-column border-end" style={{ height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
          <div className="p-3">
            <ModuleSidebar />
            <OverallProgress />
          </div>
        </Col>
        
        {/* Main content area */}
        <Col md={9} lg={9} className="content-column" style={{ height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
          <div className="p-4">
            <ModuleContent />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default PlatformOverview; 