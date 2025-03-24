import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuizContext } from '../context/QuizContext';
import { BsUpload, BsFileEarmarkPdf, BsFileEarmarkWord, BsFileEarmarkText } from 'react-icons/bs';

const FileUploader = () => {
  const { formData, updateFormData } = useQuizContext();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      updateFormData('file', acceptedFiles[0]);
    }
  }, [updateFormData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const renderFileIcon = (file) => {
    const fileType = file.type;
    if (fileType.includes('pdf')) {
      return <BsFileEarmarkPdf size={40} className="text-danger" />;
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return <BsFileEarmarkWord size={40} className="text-primary" />;
    } else {
      return <BsFileEarmarkText size={40} className="text-secondary" />;
    }
  };

  return (
    <div className="mb-3">
      {!formData.file ? (
        <div
          {...getRootProps()}
          className={`border rounded p-4 text-center ${
            isDragActive ? 'bg-light border-primary' : ''
          }`}
          style={{ cursor: 'pointer', minHeight: '150px' }}
        >
          <input {...getInputProps()} />
          <BsUpload size={32} className="mb-2 text-primary" />
          <p className="mb-1">
            {isDragActive
              ? 'Drop the file here...'
              : 'Drag and drop a file here, or click to select a file'}
          </p>
          <p className="text-muted small">
            Accepted formats: PDF, DOC, DOCX, TXT (Max size: 10MB)
          </p>
        </div>
      ) : (
        <div className="p-3 border rounded d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            {renderFileIcon(formData.file)}
            <div className="ms-3">
              <p className="mb-1 fw-bold">{formData.file.name}</p>
              <p className="mb-0 text-muted small">
                {(formData.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => updateFormData('file', null)}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
