import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Spin, Alert, Tag, Empty } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { formatDistance } from 'date-fns';
import { da } from 'date-fns/locale';

const { Title, Text } = Typography;

const CompletionsList = ({ studentId }) => {
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompletions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/completions/${studentId}`);
        if (response.data.success) {
          setCompletions(response.data.completions);
        } else {
          setError('Kunne ikke hente fuldførelser');
        }
      } catch (err) {
        setError('Kunne ikke hente fuldførelser: ' + (err.message || 'Ukendt fejl'));
        console.error('Error fetching completions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchCompletions();
    }
  }, [studentId]);

  const formatTimeAgo = (timestamp) => {
    try {
      return formatDistance(new Date(timestamp), new Date(), {
        addSuffix: true,
        locale: da
      });
    } catch (error) {
      return 'Ukendt tidspunkt';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '10px' }}>Indlæser fuldførelser...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Fejl"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (completions.length === 0) {
    return (
      <Card>
        <Empty
          description="Ingen fuldførte aktiviteter endnu"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card title={<Title level={4}>Fuldførte Aktiviteter</Title>} className="completions-list">
      <List
        itemLayout="horizontal"
        dataSource={completions}
        renderItem={(completion) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                completion.score !== null ? (
                  <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                ) : (
                  <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                )
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Modul ID: {completion.moduleId}</Text>
                  <Text type="secondary">{formatTimeAgo(completion.timestamp)}</Text>
                </div>
              }
              description={
                <div>
                  <div>Aktivitet ID: {completion.activityId}</div>
                  {completion.score !== null && (
                    <div style={{ marginTop: '5px' }}>
                      <Tag color="blue">Score: {completion.score}</Tag>
                    </div>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default CompletionsList; 