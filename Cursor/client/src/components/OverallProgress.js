import React from 'react';
import { ProgressBar, Card } from 'react-bootstrap';
import { usePlatformContext } from '../context/PlatformContext';

const OverallProgress = () => {
  const { calculateOverallProgress } = usePlatformContext();
  const progress = calculateOverallProgress();

  return (
    <Card className="mt-4 border-0 shadow-sm">
      <Card.Body className="p-3">
        <h6 className="mb-2">Samlet fremgang</h6>
        <ProgressBar 
          now={progress.percentage} 
          variant="success" 
          className="mb-2"
          style={{ height: '8px' }}
        />
        <div className="d-flex justify-content-between">
          <span className="text-muted small">
            {progress.completed} ud af {progress.total} aktiviteter gennemført
          </span>
          <span className="fw-bold">
            {progress.percentage}%
          </span>
        </div>
      </Card.Body>
    </Card>
  );
};

export default OverallProgress; 