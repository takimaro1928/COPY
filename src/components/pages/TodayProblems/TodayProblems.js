// src/components/pages/TodayProblems/TodayProblems.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Box,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ButtonGroup,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CheckIcon from '@mui/icons-material/Check';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpIcon from '@mui/icons-material/Help';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { UnderstandingLevel } from '../../../models/types';
import { useApp } from '../../../contexts/AppContext';
import { 
  formatDateJP, 
  getIntervalTextJP,
  formatDateWithDayOfWeekJP 
} from '../../../utils/dateUtils';

// 理解度レベルの定義
const understandingLevels = [
  { 
    level: UnderstandingLevel.FULL, 
    color: 'success', 
    icon: <CheckIcon />, 
    label: '理解○', 
    description: '完全に理解している' 
  },
  { 
    level: UnderstandingLevel.PARTIAL, 
    color: 'warning', 
    icon: <HelpOutlineIcon />, 
    label: '曖昧△', 
    description: '部分的に理解している' 
  },
  { 
    level: UnderstandingLevel.NONE, 
    color: 'error', 
    icon: <CloseIcon />, 
    label: '理解できていない×', 
    description: '理解していない' 
  }
];

const TodayProblems = () => {
  const navigate = useNavigate();
  const { 
    getTodayProblems, 
    recordAnswer, 
    getChapterById,
    getSubjectById,
    initialSetupDone,
    getHistoryForProblem,
    getProblemById
  } = useApp();
  
  // ステート
  const [answeredProblems, setAnsweredProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswerDialog, setShowAnswerDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [answerResult, setAnswerResult] = useState({
    isCorrect: false,
    understanding: null
  });
  const [problemHistory, setProblemHistory] = useState([]);
  
  // 今日解くべき問題の読み込み
  useEffect(() => {
    // データ読み込み完了を示すための短いタイムアウト
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 現在の問題の履歴を取得
  useEffect(() => {
    if (currentProblem) {
      const history = getHistoryForProblem(currentProblem.problem.id);
      setProblemHistory(history);
    }
  }, [currentProblem, getHistoryForProblem]);
  
  // 今日解くべき問題の取得（未回答のもののみ）
  const todayProblems = getTodayProblems().filter(
    item => !answeredProblems.includes(item.problem.id)
  );
  
  // 回答済み問題数
  const answeredCount = answeredProblems.length;
  // 合計問題数（回答済み + 未回答）
  const totalCount = answeredCount + todayProblems.length;
  // 進捗率
  const progressPercentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  
  // 問題への回答ダイアログを表示
  const handleOpenAnswerDialog = (problem) => {
    setCurrentProblem(problem);
    setShowAnswerDialog(true);
  };
  
  // 問題の情報ダイアログを表示
  const handleOpenInfoDialog = (problem) => {
    setCurrentProblem(problem);
    setShowInfoDialog(true);
  };
  
  // 理解度を選択
  const handleSelectUnderstanding = (understanding) => {
    setAnswerResult({
      ...answerResult,
      understanding
    });
  };
  
  // 正誤を選択
  const handleSelectCorrect = (isCorrect) => {
    setAnswerResult({
      ...answerResult,
      isCorrect
    });
  };
  
  // 回答を記録
  const handleRecordAnswer = () => {
    if (answerResult.understanding === null) return;
    
    recordAnswer(
      currentProblem.problem.id, 
      answerResult.isCorrect, 
      answerResult.understanding
    );
    
    setAnsweredProblems(prev => [...prev, currentProblem.problem.id]);
    setShowAnswerDialog(false);
    setAnswerResult({
      isCorrect: false,
      understanding: null
    });
  };
  
  // 問題の章と科目の情報を取得
  const getProblemInfo = (chapterId, subjectId) => {
    const chapter = getChapterById(chapterId);
    const subject = getSubjectById(subjectId);
    
    return {
      chapterName: chapter?.name || 'Unknown Chapter',
      subjectName: subject?.name || 'Unknown Subject'
    };
  };
  
  // 初期設定が完了していない場合は初期設定ページへリダイレクト
  if (!initialSetupDone) {
    navigate('/initial-setup');
    return null;
  }
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          問題を読み込んでいます...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        今日解く問題
      </Typography>
      
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box display="flex" alignItems="center">
          <AccessTimeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1">
            {formatDateWithDayOfWeekJP(new Date())}
          </Typography>
        </Box>
        <Box mt={1}>
          <Typography variant="body1">
            本日学習予定の問題: <strong>{totalCount}</strong>問
          </Typography>
          {answeredCount > 0 && (
            <Box mt={1}>
              <Typography variant="body2" color="success.main" gutterBottom>
                完了した問題: {answeredCount}/{totalCount}問
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage} 
                color="success"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </Box>
      </Paper>
      
      {todayProblems.length === 0 ? (
        <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                今日の学習は完了しました！
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                おめでとうございます！今日予定されていた問題をすべて解き終えました。
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/schedule')}
                sx={{ mt: 2 }}
              >
                スケジュール確認
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {todayProblems.map(({ problem, schedule }) => {
              const { chapterName, subjectName } = getProblemInfo(
                problem.chapterId,
                problem.subjectId
              );
              
              return (
                <Grid item xs={12} key={problem.id}>
                  <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="h6">
                          問題 {problem.number}
                        </Typography>
                        <Box>
                          <Tooltip title="問題の情報を表示">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenInfoDialog({ problem, schedule })}
                            >
                              <InfoOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                          <Chip 
                            label={`復習回数: ${schedule.reviewCount}`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {subjectName} &gt; {chapterName}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box display="flex" justifyContent="center" mt={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleOpenAnswerDialog({ problem, schedule })}
                          size="large"
                          sx={{ px: 4, py: 1 }}
                        >
                          解答結果を記録する
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          
          {answeredProblems.length > 0 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/schedule')}
              >
                スケジュール確認へ
              </Button>
            </Box>
          )}
        </>
      )}
      
      {/* 解答記録ダイアログ */}
      <Dialog
        open={showAnswerDialog}
        onClose={() => setShowAnswerDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          解答結果の記録
          <IconButton
            aria-label="close"
            onClick={() => setShowAnswerDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {currentProblem && (
            <>
              <Typography variant="h6" gutterBottom>
                問題 {currentProblem.problem.number}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {getSubjectById(currentProblem.problem.subjectId)?.name} &gt; {
                  getChapterById(currentProblem.problem.chapterId)?.name
                }
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <DialogContentText>
                正誤と理解度を選択してください。
              </DialogContentText>
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                正誤
              </Typography>
              
              <ButtonGroup variant="outlined" sx={{ mb: 3, display: 'flex' }}>
                <Button 
                  sx={{ flex: 1 }}
                  color="success"
                  variant={answerResult.isCorrect ? "contained" : "outlined"}
                  onClick={() => handleSelectCorrect(true)}
                >
                  <CheckIcon sx={{ mr: 1 }} /> 正解
                </Button>
                <Button 
                  sx={{ flex: 1 }}
                  color="error"
                  variant={answerResult.isCorrect === false ? "contained" : "outlined"}
                  onClick={() => handleSelectCorrect(false)}
                >
                  <CloseIcon sx={{ mr: 1 }} /> 不正解
                </Button>
              </ButtonGroup>
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                理解度
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {understandingLevels.map((item) => (
                  <Grid item xs={4} key={item.level}>
                    <Button
                      variant={answerResult.understanding === item.level ? "contained" : "outlined"}
                      color={item.color}
                      fullWidth
                      onClick={() => handleSelectUnderstanding(item.level)}
                      sx={{ height: '100%' }}
                    >
                      {item.icon}
                      <Box ml={1}>
                        <Typography variant="body2">{item.label}</Typography>
                        <Typography variant="caption" display="block">
                          {item.description}
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                ))}
              </Grid>
              
              <Alert severity="info">
                理解度に応じて次回の学習スケジュールが調整されます。
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnswerDialog(false)}>キャンセル</Button>
          <Button 
            onClick={handleRecordAnswer} 
            variant="contained" 
            color="primary"
            disabled={answerResult.understanding === null}
          >
            記録する
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 問題情報ダイアログ */}
      <Dialog
        open={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          問題の情報
          <IconButton
            aria-label="close"
            onClick={() => setShowInfoDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {currentProblem && (
            <>
              <Typography variant="h6" gutterBottom>
                問題 {currentProblem.problem.number}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {getSubjectById(currentProblem.problem.subjectId)?.name} &gt; {
                  getChapterById(currentProblem.problem.chapterId)?.name
                }
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    復習回数
                  </Typography>
                  <Typography variant="body1">
                    {currentProblem.schedule.reviewCount}回
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    現在の間隔
                  </Typography>
                  <Typography variant="body1">
                    {getIntervalTextJP(currentProblem.schedule.currentInterval)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    前回の学習日
                  </Typography>
                  <Typography variant="body1">
                    {formatDateJP(currentProblem.schedule.lastReviewDate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    次回の学習日
                  </Typography>
                  <Typography variant="body1">
                    {formatDateJP(currentProblem.schedule.nextReviewDate)}
                  </Typography>
                </Grid>
              </Grid>
              
              {problemHistory.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                    学習履歴
                  </Typography>
                  <Divider />
                  
                  {problemHistory.slice(0, 5).map((history) => (
                    <Box key={history.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                      <Grid container alignItems="center">
                        <Grid item xs={3}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateJP(history.date)}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Chip 
                            size="small"
                            color={history.isCorrect ? "success" : "error"}
                            label={history.isCorrect ? "正解" : "不正解"}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          {history.understandingLevel === UnderstandingLevel.FULL && (
                            <Chip 
                              size="small"
                              color="success"
                              icon={<CheckIcon />}
                              label="理解○"
                            />
                          )}
                          {history.understandingLevel === UnderstandingLevel.PARTIAL && (
                            <Chip 
                              size="small"
                              color="warning"
                              icon={<HelpOutlineIcon />}
                              label="曖昧△"
                            />
                          )}
                          {history.understandingLevel === UnderstandingLevel.NONE && (
                            <Chip 
                              size="small"
                              color="error"
                              icon={<CloseIcon />}
                              label="理解×"
                            />
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                  
                  {problemHistory.length > 5 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      他 {problemHistory.length - 5} 件の履歴があります
                    </Typography>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInfoDialog(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TodayProblems;
