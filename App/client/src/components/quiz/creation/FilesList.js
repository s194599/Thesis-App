import React from "react";
import { useQuizContext } from "../../../context/QuizContext";
import {
  BsFileEarmarkPdf,
  BsFileEarmarkWord,
  BsFileEarmarkExcel,
  BsFileEarmarkPpt,
  BsFileEarmarkText,
  BsFileEarmarkPlay,
  BsYoutube,
} from "react-icons/bs";
import { Alert } from "react-bootstrap";

const FilesList = () => {
  const { formData, updateFormData } = useQuizContext();

  const renderFileIcon = (file) => {
    const fileType = file.type;
    if (fileType.includes("pdf")) {
      return <BsFileEarmarkPdf size={24} className="text-danger" />;
    } else if (fileType.includes("word") || fileType.includes("doc")) {
      return <BsFileEarmarkWord size={24} className="text-primary" />;
    } else if (fileType.includes("powerpoint") || fileType.includes("presentation")) {
      return <BsFileEarmarkPpt size={24} className="text-warning" />;
    } else if (fileType.includes("excel") || fileType.includes("spreadsheet")) {
      return <BsFileEarmarkExcel size={24} className="text-success" />;
    } else if (fileType.includes("video")) {
      return <BsFileEarmarkPlay size={24} className="text-success" />;
    } else if (fileType.includes("audio")) {
      return <BsFileEarmarkPlay size={24} className="text-warning" />;
    } else if (fileType === "youtube") {
      return <BsYoutube size={24} className="text-danger" />;
    } else {
      return <BsFileEarmarkText size={24} className="text-secondary" />;
    }
  };

  const removeFile = (fileIndex) => {
    const updatedFiles = [...formData.files];
    updatedFiles.splice(fileIndex, 1);
    updateFormData("files", updatedFiles.length ? updatedFiles : null);
  };

  // Only render if there are files
  if (!formData.files || formData.files.length === 0) {
    return null;
  }

  const totalFileSize = formData.files
    ? formData.files.filter(file => !file.isYoutubeVideo).reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)
    : 0;

  const hasVideoFiles =
    formData.files &&
    formData.files.some((file) => file.type.includes("video"));

  const hasYoutubeVideos =
    formData.files &&
    formData.files.some((file) => file.isYoutubeVideo);

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-bold">
          Valgte filer ({formData.files.length})
        </h6>
        <span className="text-muted small">
          Samlet størrelse: {totalFileSize.toFixed(2)} MB
        </span>
      </div>

      <div className="border rounded mb-3">
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
                  {file.isYoutubeVideo 
                    ? "YouTube Video" 
                    : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
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
              Fjern
            </button>
          </div>
        ))}
      </div>

      {/* {(hasVideoFiles || hasYoutubeVideos) && (
        <Alert variant="info" className="mb-3">
          <strong>Bemærk:</strong> {hasVideoFiles ? "Videoer vil blive transskriberet automatisk ved hjælp af AI-talegenkendelse." : ""} 
          {hasYoutubeVideos ? "YouTube videoer vil blive analyseret via undertekster og videoindhold." : ""}
          <br />
          <strong>Tips:</strong> Brug videoer med tydelig lyd eller undertekster for de bedste resultater.
        </Alert>
      )} */}
    </div>
  );
};

export default FilesList; 