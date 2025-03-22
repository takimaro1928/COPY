import React from 'react';
import { Container, Typography, Paper, Button, Divider, Box } from '@mui/material';
import { useApp } from '../../../contexts/AppContext';

const Settings = () => {
  const { initialSetupDone } = useApp();

  const handleInitialSetup = () => {
    // 初期設定を行うロジック（まだ実装されていない）
    alert('初期設定機能は実装中です');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        設定
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          初期設定
        </Typography>
        <Typography variant="body2" paragraph>
          {initialSetupDone 
            ? '初期設定は完了しています。設定をリセットして再度行うことができます。' 
            : '学習を始めるには、初期設定を完了してください。'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleInitialSetup}
        >
          {initialSetupDone ? '設定をリセット' : '初期設定を行う'}
        </Button>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          アプリ情報
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2">
          Study Scheduler v0.1.0
        </Typography>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Study Scheduler
        </Typography>
      </Paper>
    </Container>
  );
};

export default Settings;
