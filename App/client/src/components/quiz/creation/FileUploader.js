import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useQuizContext } from "../../../context/QuizContext";
import {
  BsUpload,
  BsFileEarmarkPdf,
  BsFileEarmarkWord,
  BsFileEarmarkText,
  BsFileEarmarkPlay,
  BsYoutube,
  BsPlus,
} from "react-icons/bs";
import { Alert, Form, Button, InputGroup } from "react-bootstrap";

const FileUploader = () => {
  const { formData, updateFormData } = useQuizContext();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState("");

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
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/ogg": [".ogg"],
      "audio/mp4": [".m4a"],
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

  // Function to validate YouTube URL
  const validateYoutubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  // Function to extract video ID from URL
  const extractYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Function to add YouTube link
  const addYoutubeLink = () => {
    if (!validateYoutubeUrl(youtubeUrl)) {
      setYoutubeError("Ugyldig YouTube URL. Prøv igen.");
      return;
    }

    setYoutubeError("");
    const videoId = extractYoutubeVideoId(youtubeUrl);
    
    if (!videoId) {
      setYoutubeError("Kunne ikke udtrække video-ID fra URL.");
      return;
    }

    // Creating a "virtual" file object for the YouTube URL
    const youtubeFile = {
      name: `YouTube Video (${videoId})`,
      size: 0,
      type: "youtube",
      youtubeUrl: youtubeUrl,
      videoId: videoId,
      isYoutubeVideo: true
    };

    const currentFiles = formData.files || [];
    const updatedFiles = [...currentFiles, youtubeFile];
    updateFormData("files", updatedFiles);
    setYoutubeUrl("");
  };

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
            ? "Slip filerne her..."
            : "Træk og slip filer her, eller klik for at vælge filer"}
        </p>
        <p className="text-muted small">
          Accepterede formater: PDF, DOC, DOCX, TXT, MP4, MOV, AVI, WEBM, MP3, WAV, M4A
          (Maksimal størrelse: 50MB per fil)
        </p>
      </div>

      {/* YouTube URL input section */}
      <div className="mt-3">
        <Form.Label className="fw-bold">YouTube video URL</Form.Label>
        <InputGroup className="mb-2">
          <Form.Control
            type="text"
            placeholder="Indtast YouTube video URL"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            isInvalid={!!youtubeError}
          />
          <Button 
            variant="primary" 
            onClick={addYoutubeLink}
            disabled={!youtubeUrl}
          >
            <BsPlus size={20} /> Tilføj
          </Button>
        </InputGroup>
        {youtubeError && <div className="text-danger small mb-2">{youtubeError}</div>}
        {/* <p className="text-muted small">
          Tilføj YouTube videoer til at generere quiz-spørgsmål baseret på videoindholdet.
        </p> */}
      </div>

      {formData.files && formData.files.length > 0 && (
        <div className="mt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0 fw-bold">
              Valgte filer ({formData.files.length})
            </h6>
            <span className="text-muted small">
              Samlet størrelse: {totalFileSize.toFixed(2)} MB
            </span>
          </div>

          {/* {(hasVideoFiles || hasYoutubeVideos) && (
            <div className="mt-3">
              <Alert variant="info">
                <strong>Bemærk:</strong> {hasVideoFiles ? "Videoer vil blive transskriberet automatisk ved hjælp af AI-talegenkendelse." : ""} 
                {hasYoutubeVideos ? "YouTube videoer vil blive analyseret via undertekster og videoindhold." : ""}
                <br />
                <strong>Tips:</strong> Brug videoer med tydelig lyd eller undertekster for de bedste resultater.
              </Alert>
            </div>
          )} */}

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
        </div>
      )}
    </div>
  );
};

export default FileUploader;
