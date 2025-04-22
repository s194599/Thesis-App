import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Statistic, Tabs, Spin } from 'antd';
import { BookOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import axios from 'axios';
import CompletionsList from './CompletionsList';

const { Title } = Typography;
const { TabPane } = Tabs;

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizStats, setQuizStats] = useState({
    totalQuizzes: 0,
    averageScore: 0
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        // Get current student data
        const studentResponse = await axios.get('/api/current-student');
        if (studentResponse.data.success) {
          setStudent(studentResponse.data.student);
          
          // Get quiz history for statistics
          const historyResponse = await axios.get('/api/quiz-history');
          if (historyResponse.data.success) {
            const quizzes = historyResponse.data.quizHistory || [];
            const totalQuizzes = quizzes.length;
            const scores = quizzes.map(quiz => quiz.score || 0);
            const averageScore = totalQuizzes > 0 
              ? scores.reduce((acc, curr) => acc + curr, 0) / totalQuizzes 
              : 0;
            
            setQuizStats({
              totalQuizzes,
              averageScore: Math.round(averageScore * 10) / 10
            });
          }
        } else {
          setError('Kunne ikke hente studerende data');
        }
      } catch (err) {
        setError('Fejl ved indlæsning af data: ' + (err.message || 'Ukendt fejl'));
        console.error('Error fetching student data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>Indlæser dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Card>
          <Title level={4}>Fejl</Title>
          <p>{error}</p>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: '20px' }}>
        <Card>
          <Title level={4}>Ingen studerende fundet</Title>
          <p>Venligst log ind for at se dit dashboard.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="student-dashboard" style={{ padding: '20px' }}>
      <Title level={2}>Velkommen, {student.name}</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title="Fuldførte Aktiviteter" 
              value={student.completedActivities || 0} 
              prefix={<CheckCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title="Gennemførte Quizzer" 
              value={quizStats.totalQuizzes} 
              prefix={<BookOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title="Gennemsnitlig Score" 
              value={quizStats.averageScore} 
              suffix="%" 
              precision={1} 
              prefix={<TrophyOutlined />} 
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: '20px' }}>
        <Tabs defaultActiveKey="completions">
          <TabPane tab="Fuldførelser" key="completions">
            <CompletionsList studentId={student.id} />
          </TabPane>
          <TabPane tab="Quiz Historik" key="quizHistory">
            <Card>
              <p>Quiz historik vil blive vist her...</p>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard; 