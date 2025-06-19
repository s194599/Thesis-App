import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { saveFeedback } from '../../services/homeworkFeedbackService';

const HomeworkFeedbackModal = ({ show, onHide, activity, moduleId, studentId = "1" }) => {
  const [difficulty, setDifficulty] = useState(null);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (difficulty) {
      saveFeedback(studentId, activity.id, {
        difficulty,
        comment,
        moduleId,
        activityId: activity.id,
        activityTitle: activity.title
      });
      
      // Reset form and close modal
      setDifficulty(null);
      setComment('');
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Hvordan oplevede du denne lektie?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5 className="mb-3">{activity?.title}</h5>
        
        <div className="d-flex justify-content-center mb-4 gap-4">
          <Button 
            variant={difficulty === 'hard' ? 'danger' : 'outline-danger'} 
            onClick={() => setDifficulty('hard')}
            className="d-flex flex-column align-items-center p-3"
            style={{ width: '80px', height: '80px' }}
          >
            <span style={{ fontSize: '24px' }}>🔴</span>
            <span className="mt-1">Svær</span>
          </Button>
          
          <Button 
            variant={difficulty === 'medium' ? 'warning' : 'outline-warning'} 
            onClick={() => setDifficulty('medium')}
            className="d-flex flex-column align-items-center p-3"
            style={{ width: '80px', height: '80px' }}
          >
            <span style={{ fontSize: '24px' }}>🟡</span>
            <span className="mt-1">Mellem</span>
          </Button>
          
          <Button 
            variant={difficulty === 'easy' ? 'success' : 'outline-success'} 
            onClick={() => setDifficulty('easy')}
            className="d-flex flex-column align-items-center p-3"
            style={{ width: '80px', height: '80px' }}
          >
            <span style={{ fontSize: '24px' }}>🟢</span>
            <span className="mt-1">Let</span>
          </Button>
        </div>
        
        <Form.Group className="mb-3">
          <Form.Label>Kommentar (valgfri)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Du kan tilføje en kommentar hvis du vil..."
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Annuller
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!difficulty}>
          Indsend
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default HomeworkFeedbackModal; 