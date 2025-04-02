import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuizContext } from "../../../context/QuizContext";
import {
  BsUpload,
  BsFileEarmarkPdf,
  BsFileEarmarkWord,
  BsFileEarmarkText,
  BsFileEarmarkPlay,
} from "react-icons/bs";
import { Alert } from "react-bootstrap";

const FileUploader = () => {
  const { formData, updateFormData } = useQuizContext();

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const currentFiles = formData.files || [];

        const uniqueFiles = new Map();

        currentFiles.forEach((file) => {
          uniqueFiles.set(file.name + file.size, file);
        });

        acceptedFiles.forEach((file) => {
          uniqueFiles.set(file.name + file.size, file);
        });

        const updatedFiles = Array.from(uniqueFiles.values());

        updateFormData("files", updatedFiles);
      }
    },
    [updateFormData, formData.files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-msvideo": [".avi"],
      "video/webm": [".webm"],
    },
    multiple: true,
  });

  const renderFileIcon = (file) => {
    const fileType = file.type;
    if (fileType.includes("pdf")) {
      return <BsFileEarmarkPdf size={24} className="text-danger" />;
    } else if (fileType.includes("word") || fileType.includes("doc")) {
      return <BsFileEarmarkWord size={24} className="text-primary" />;
    } else if (fileType.includes("video")) {
      return <BsFileEarmarkPlay size={24} className="text-success" />;
    } else {
      return <BsFileEarmarkText size={24} className="text-secondary" />;
    }
  };

  const removeFile = (fileIndex) => {
    const updatedFiles = [...formData.files];
    updatedFiles.splice(fileIndex, 1);
    updateFormData("files", updatedFiles.length ? updatedFiles : null);
  };

  const totalFileSize = formData.files
    ? formData.files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)
    : 0;

  const hasVideoFiles =
    formData.files &&
    formData.files.some((file) => file.type.includes("video"));

  return (
    <div className="mb-3">
      <div
        {...getRootProps()}
        className={`border rounded p-4 text-center ${
          isDragActive ? "bg-light border-primary" : ""
        }`}
        style={{ cursor: "pointer", minHeight: "120px" }}
      >
        <input {...getInputProps()} />
        <BsUpload size={32} className="mb-2 text-primary" />
        <p className="mb-1">
          {isDragActive
            ? "Drop the files here..."
            : "Drag and drop files here, or click to select files"}
        </p>
        <p className="text-muted small">
          Accepted formats: PDF, DOC, DOCX, TXT, MP4, MOV, AVI, WEBM (Max size:
          50MB per file)
        </p>
      </div>

      {formData.files && formData.files.length > 0 && (
        <div className="mt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Selected Files ({formData.files.length})</h6>
            <span className="text-muted small">
              Total size: {totalFileSize.toFixed(2)} MB
            </span>
          </div>

          {hasVideoFiles && (
            <div className="mt-3">
              <Alert variant="info">
                <strong>Video Upload</strong>
                <p>
                  Video files will be transcribed automatically using AI speech
                  recognition. This process requires FFmpeg to be installed on
                  the server. If you encounter transcription errors, ask your
                  administrator to install FFmpeg.
                </p>
                <ul>
                  <li>Use videos with clear audio</li>
                  <li>Shorter videos (under 10 minutes) work best</li>
                  <li>
                    Consider providing additional context in the topic field
                  </li>
                </ul>
              </Alert>
            </div>
          )}

          <div className="border rounded">
            {formData.files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className={`p-2 d-flex align-items-center justify-content-between ${
                  index !== formData.files.length - 1 ? "border-bottom" : ""
                }`}
              >
                <div className="d-flex align-items-center">
                  {renderFileIcon(file)}
                  <div className="ms-2">
                    <p className="mb-0 small">{file.name}</p>
                    <p className="mb-0 text-muted small">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
