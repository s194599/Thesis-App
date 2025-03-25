import React from 'react';
import { Form } from 'react-bootstrap';
import { useQuizContext } from '../context/QuizContext';

const StudentLevelSelector = () => {
  const { formData, updateFormData } = useQuizContext();

  const studentLevels = [
    { value: 'elementary', label: 'Elementary (1-5. klasse)' },
    { value: 'middleSchool', label: 'Middle School (6-9. klasse)' },
    { value: 'highSchool', label: 'High School (Gymnasium)' },
    { value: 'university', label: 'University (Universitet)' }
  ];

  return (
    <div className="mb-4">
      <Form.Group>
        <Form.Label className="fw-bold">Student Level (Optional)</Form.Label>
        <Form.Select
          value={formData.studentLevel}
          onChange={(e) => updateFormData('studentLevel', e.target.value)}
        >
          {studentLevels.map(level => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="text-muted">
          Select the educational level for which the quiz is intended.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default StudentLevelSelector;
