import React from 'react';
import { BeatLoader } from 'react-spinners';

const LoadingSpinner = ({ loading, message = 'Generating quiz...' }) => {
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
        <p className="mt-2 small text-muted">
          This may take up to a minute depending on the complexity and length of the content.
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
