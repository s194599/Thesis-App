import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuizContext } from '../context/QuizContext';
import { BsUpload, BsFileEarmarkPdf, BsFileEarmarkWord, BsFileEarmarkText, BsX } from 'react-icons/bs';

const FileUploader = () => {
  const { formData, updateFormData } = useQuizContext();
  const files = formData.files || [];

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      updateFormData('files', [...files, ...acceptedFiles]);
    }
  }, [updateFormData, files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    // Remove maxFiles limit to allow multiple files
  });

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    updateFormData('files', newFiles);
  };

  const renderFileIcon = (file) => {
    const fileType = file.type;
    if (fileType.includes('pdf')) {
      return <BsFileEarmarkPdf size={30} className="text-danger" />;
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return <BsFileEarmarkWord size={30} className="text-primary" />;
    } else {
      return <BsFileEarmarkText size={30} className="text-secondary" />;
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

      {files.length > 0 && (
        <div className="mt-3">
          <h6>Selected Files ({files.length})</h6>
          <div className="list-group">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`} 
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center">
                  {renderFileIcon(file)}
                  <div className="ms-3">
                    <p className="mb-1 fw-bold">{file.name}</p>
                    <p className="mb-0 text-muted small">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeFile(index)}
                >
                  <BsX size={20} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => updateFormData('files', [])}
            >
              Remove All Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
