import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuizContext } from '../context/QuizContext';
import { BsUpload, BsFileEarmarkPdf, BsFileEarmarkWord, BsFileEarmarkText, BsX } from 'react-icons/bs';

const FileUploader = () => {
  const { formData, updateFormData } = useQuizContext();

  const onDrop = useCallback((acceptedFiles) => {
    // Append new files to existing files
    updateFormData('files', [...formData.files, ...acceptedFiles]);
  }, [updateFormData, formData.files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: true, // Enable multiple file selection
  });

  const removeFile = (index) => {
    const updatedFiles = formData.files.filter((_, i) => i !== index);
    updateFormData('files', updatedFiles);
  };

  const renderFileIcon = (file) => {
    const fileType = file.type;
    if (fileType.includes('pdf')) {
      return <BsFileEarmarkPdf size={24} className="text-danger" />;
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return <BsFileEarmarkWord size={24} className="text-primary" />;
    } else {
      return <BsFileEarmarkText size={24} className="text-secondary" />;
    }
  };

  return (
    <div className="mb-3">
      <div
        {...getRootProps()}
        className={`border rounded p-4 text-center ${
          isDragActive ? 'bg-light border-primary' : ''
        }`}
        style={{ cursor: 'pointer', minHeight: '100px' }}
      >
        <input {...getInputProps()} />
        <BsUpload size={32} className="mb-2 text-primary" />
        <p className="mb-1">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag and drop files here, or click to select files'}
        </p>
        <p className="text-muted small">
          Accepted formats: PDF, DOC, DOCX, TXT (Max size: 10MB per file)
        </p>
      </div>

      {formData.files.length > 0 && (
        <div className="mt-3">
          <h6 className="mb-3">Selected Files ({formData.files.length})</h6>
          <div className="border rounded">
            {formData.files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className={`p-3 d-flex align-items-center justify-content-between ${
                  index !== formData.files.length - 1 ? 'border-bottom' : ''
                }`}
              >
                <div className="d-flex align-items-center">
                  {renderFileIcon(file)}
                  <div className="ms-3">
                    <p className="mb-1">{file.name}</p>
                    <p className="mb-0 text-muted small">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-link text-danger p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <BsX size={24} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-link text-danger p-0 mt-2"
            onClick={(e) => {
              e.stopPropagation();
              updateFormData('files', []);
            }}
          >
            Remove All Files
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
