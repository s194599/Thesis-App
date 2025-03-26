import React from 'react';
import { BeatLoader } from 'react-spinners';
import { Button } from 'react-bootstrap';
import { useQuizContext } from '../context/QuizContext';

const LoadingSpinner = ({ loading, message = 'Generating quiz...' }) => {
  const { cancelQuizGeneration } = useQuizContext();
  
  if (!loading) return null;

  return (
    <div id="loading-spinner-section" className="text-center my-4 py-4">
      <BeatLoader color="#0d6efd" size={15} margin={5} loading={loading} />
      <p className="mt-3 text-muted">{message}</p>
      <div className="mt-4">
        <div className="progress" style={{ height: '6px' }}>
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            style={{ width: '100%' }}
          ></div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <p className="small text-muted mb-0">
            This may take up to a minute depending on the complexity and length of the content.
          </p>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={cancelQuizGeneration}
            className="ms-3"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
