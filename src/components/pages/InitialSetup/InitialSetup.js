// src/components/pages/InitialSetup/InitialSetup.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  TextField,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TuneIcon from '@mui/icons-material/Tune';
import { useApp } from '../../../contexts/AppContext';
import { 
  formatDateJP, 
  getIntervalTextJP,
  addDays,
  stripTime
} from '../../../utils/dateUtils';
import { INTERVALS } from '../../../services/scheduleService';

// ステップのラベル
const steps = [
  '初期設定開始',
  '科目選択',
  'スケジュール設定',
  '確認'
];

// 間隔の選択肢
const intervalOptions = [
  { value: 0, label: '初回（今日）' },
  { value: 1, label: '1日後（明日）' },
  { value: INTERVALS.FIRST, label: '3日後' },
  { value: INTERVALS.SECOND, label: '1週間後' },
  { value: INTERVALS.THIRD, label: '2週間後' },
  { value: INTERVALS.FOURTH, label: '1ヶ月後' },
  { value: INTERVALS.FIFTH, label: '2ヶ月後' }
];

const InitialSetup = () => {
  const navigate = useNavigate();
  const { 
    subjects, 
    chapters, 
    problems, 
    getChaptersBySubject, 
    setProblemsByChapter,
    setBulkSchedule,
    completeInitialSetup,
    initialSetupDone
  } = useApp();
  
  // ステップ管理
  const [activeStep, setActiveStep] = useState(0);
  
  // 選択状態の管理
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState({});
  const [bulkScheduleSettings, setBulkScheduleSettings] = useState({
    date: stripTime(new Date()),
    interval: INTERVALS.FIRST,
    reviewCount: 0
  });
  
  // 高度な設定
  const [advancedMode, setAdvancedMode] = useState(false);
  const [chapterSettings, setChapterSettings] = useState({});
  
  // 初期状態の設定
  useEffect(() => {
    // 科目ごとに章の設定を初期化
    const initialChapterSettings = {};
    subjects.forEach(subject => {
      const subjectChapters = getChaptersBySubject(subject.id);
      subjectChapters.forEach(chapter => {
        initialChapterSettings[chapter.id] = {
          date: bulkScheduleSettings.date,
          interval: bulkScheduleSettings.interval,
          reviewCount: bulkScheduleSettings.reviewCount
        };
      });
    });
    setChapterSettings(initialChapterSettings);
  }, [subjects, getChaptersBySubject, bulkScheduleSettings.date, bulkScheduleSettings.interval, bulkScheduleSettings.reviewCount]);
  
  // 科目ごとの章選択を管理
  const handleSubjectChange = (subjectId, checked) => {
    if (checked) {
      setSelectedSubjects(prev => [...prev, subjectId]);
      
      // 科目に属する全ての章を選択
      const subjectChapters = getChaptersBySubject(subjectId);
      setSelectedChapters(prev => ({
        ...prev,
        [subjectId]: subjectChapters.map(chapter => chapter.id)
      }));
    } else {
      setSelectedSubjects(prev => prev.filter(id => id !== subjectId));
      
      // 科目に属する全ての章の選択を解除
      setSelectedChapters(prev => {
        const newSelection = { ...prev };
        delete newSelection[subjectId];
        return newSelection;
      });
    }
  };
  
  // 章の選択を管理
  const handleChapterChange = (chapterId, subjectId, checked) => {
    if (checked) {
      // 章を選択
      setSelectedChapters(prev => ({
        ...prev,
        [subjectId]: [...(prev[subjectId] || []), chapterId]
      }));
      
      // 親の科目も選択
      if (!selectedSubjects.includes(subjectId)) {
        setSelectedSubjects(prev => [...prev, subjectId]);
      }
    } else {
      // 章の選択を解除
      setSelectedChapters(prev => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).filter(id => id !== chapterId)
      }));
      
      // 科目内の全ての章が選択解除された場合、科目も選択解除
      const remainingChapters = selectedChapters[subjectId]?.filter(id => id !== chapterId) || [];
      if (remainingChapters.length === 0) {
        setSelectedSubjects(prev => prev.filter(id => id !== subjectId));
      }
    }
  };
  
  // 章ごとの設定を更新
  const updateChapterSetting = (chapterId, field, value) => {
    setChapterSettings(prev => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        [field]: value
      }
    }));
  };
  
  // 選択された問題数を計算
  const getSelectedProblemCount = () => {
    let count = 0;
    
    Object.entries(selectedChapters).forEach(([subjectId, chapterIds]) => {
      chapterIds.forEach(chapterId => {
        const chapter = chapters.find(c => c.id === chapterId);
        if (chapter) {
          count += chapter.problemCount;
        }
      });
    });
    
    return count;
  };
  
  // 選択された問題のIDを取得
  const getSelectedProblemIds = () => {
    const selectedProblemIds = [];
    
    Object.entries(selectedChapters).forEach(([subjectId, chapterIds]) => {
      chapterIds.forEach(chapterId => {
        const chapterProblems = problems.filter(p => p.chapterId === chapterId);
        chapterProblems.forEach(problem => {
          selectedProblemIds.push(problem.id);
        });
      });
    });
    
    return selectedProblemIds;
  };
  
  // 章ごとの問題IDを取得
  const getProblemIdsByChapter = (chapterId) => {
    return problems
      .filter(p => p.chapterId === chapterId)
      .map(p => p.id);
  };
  
  // 次のステップへ進む
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // 最終ステップの場合、初期設定を完了して今日の問題ページへ移動
      if (advancedMode) {
        // 高度な設定: 章ごとに異なる設定でスケジュールを設定
        Object.entries(selectedChapters).forEach(([subjectId, chapterIds]) => {
          chapterIds.forEach(chapterId => {
            const setting = chapterSettings[chapterId];
            const problemIds = getProblemIdsByChapter(chapterId);
            
            setBulkSchedule(
              problemIds,
              setting.date,
              setting.interval
            );
          });
        });
      } else {
        // 標準設定: すべての問題に同じ設定を適用
        const selectedProblemIds = getSelectedProblemIds();
        
        setBulkSchedule(
          selectedProblemIds,
          bulkScheduleSettings.date,
          bulkScheduleSettings.interval
        );
      }
      
      // 初期設定完了フラグを設定
      completeInitialSetup();
      
      // 今日の問題ページへ移動
      navigate('/today');
    } else {
      // 次のステップへ
      setActiveStep(prev => prev + 1);
    }
  };
  
  // 前のステップへ戻る
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };
  
  // 初期設定をスキップ
  const handleSkip = () => {
    completeInitialSetup();
    navigate('/today');
  };
  
  // すでに初期設定が完了している場合
  if (initialSetupDone) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                初期設定はすでに完了しています
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                すでに初期設定は完了しています。問題を解くか、スケジュールを確認しましょう。
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/today')}
                >
                  今日の問題へ
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/schedule')}
                >
                  スケジュール確認
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Study Scheduler 初期設定
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          {/* ステップ1: 初期設定開始 */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                学習スケジュール設定を始めましょう
              </Typography>
              
              <Typography variant="body1" paragraph>
                このウィザードでは、Study Schedulerの初期設定を行います。あなたの現在の学習状況を反映させ、
                効率的な復習スケジュールを作成します。
              </Typography>
              
              <Typography variant="body1" paragraph>
                次のステップでは:
              </Typography>
              
              <Box component="ul" sx={{ pl: 4 }}>
                <Typography component="li" variant="body1" paragraph>
                  学習する科目と章を選択します
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  スケジュールの初期設定を行います
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  設定内容を確認して完了します
                </Typography>
              </Box>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                後からでも問題の追加や設定の変更は可能です。まずは基本的な設定から始めましょう。
              </Alert>
              
              <Box display="flex" justifyContent="space-between" mt={4}>
                <Button
                  variant="text"
                  color="primary"
                  onClick={handleSkip}
                >
                  初期設定をスキップ
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNext}
                >
                  次へ
                </Button>
              </Box>
            </Box>
          )}
          
          {/* ステップ2: 科目選択 */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                学習する科目と章を選択
              </Typography>
              
              <Typography variant="body1" paragraph>
                学習したい科目と章を選択してください。科目を選択すると、その科目の全ての章が自動的に選択されます。
                個別に章を選択することも可能です。
              </Typography>
              
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>
                  科目と章の選択
                </Typography>
                
                {subjects.map((subject) => (
                  <Accordion 
                    key={subject.id} 
                    defaultExpanded={selectedSubjects.includes(subject.id)}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`panel-${subject.id}-content`}
                      id={`panel-${subject.id}-header`}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedSubjects.includes(subject.id)}
                            onChange={(e) => handleSubjectChange(subject.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                        label={subject.name}
                        sx={{ width: '100%' }}
                      />
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
                        {getChaptersBySubject(subject.id).map((chapter) => (
                          <Grid item xs={12} sm={6} key={chapter.id}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedChapters[subject.id]?.includes(chapter.id) || false}
                                  onChange={(e) => handleChapterChange(chapter.id, subject.id, e.target.checked)}
                                />
                              }
                              label={<>
                                <Typography variant="body2">{chapter.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {chapter.problemCount}問
                                </Typography>
                              </>}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
              
              <Alert 
                severity={getSelectedProblemCount() > 0 ? "success" : "warning"}
                sx={{ mb: 3 }}
              >
                {getSelectedProblemCount() > 0 
                  ? `${getSelectedProblemCount()}問の問題が選択されています。`
                  : '少なくとも1つの章を選択してください。'}
              </Alert>
              
              <Divider sx={{ my: 3 }} />
              
              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                >
                  戻る
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNext}
                  disabled={getSelectedProblemCount() === 0}
                >
                  次へ
                </Button>
              </Box>
            </Box>
          )}
          
          {/* ステップ3: スケジュール設定 */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                スケジュール設定
              </Typography>
              
              <Typography variant="body1" paragraph>
                選択した問題の初期スケジュールを設定します。
              </Typography>
              
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={advancedMode}
                      onChange={(e) => setAdvancedMode(e.target.checked)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center">
                      <TuneIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">高度な設定を有効にする</Typography>
                    </Box>
                  }
                />
              </Box>
              
              {!advancedMode ? (
                // 基本設定モード
                <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <EventNoteIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      一括スケジュール設定
                    </Typography>
                    
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <DatePicker
                          label="開始日"
                          value={bulkScheduleSettings.date}
                          onChange={(newDate) => {
                            if (newDate) {
                              setBulkScheduleSettings(prev => ({
                                ...prev,
                                date: stripTime(newDate)
                              }));
                            }
                          }}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="interval-select-label">学習間隔</InputLabel>
                          <Select
                            labelId="interval-select-label"
                            id="interval-select"
                            value={bulkScheduleSettings.interval}
                            label="学習間隔"
                            onChange={(e) => {
                              setBulkScheduleSettings(prev => ({
                                ...prev,
                                interval: Number(e.target.value)
                              }));
                            }}
                          >
                            {intervalOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="すでに解いた回数"
                          type="number"
                          InputProps={{ inputProps: { min: 0 } }}
                          value={bulkScheduleSettings.reviewCount}
                          onChange={(e) => {
                            setBulkScheduleSettings(prev => ({
                              ...prev,
                              reviewCount: Number(e.target.value)
                            }));
                          }}
                          helperText="これまでに問題を解いた回数（初めて解く場合は0）"
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Alert severity="info">
                          選択した{getSelectedProblemCount()}問の問題すべてに、
                          {formatDateJP(bulkScheduleSettings.date)}から
                          間隔「{intervalOptions.find(o => o.value === bulkScheduleSettings.interval)?.label || '不明'}」
                          でスケジュールを設定します。
                        </Alert>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ) : (
                // 高度な設定モード
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    高度な設定モードでは、章ごとに異なるスケジュール設定が可能です。
                  </Alert>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>科目・章</TableCell>
                          <TableCell>問題数</TableCell>
                          <TableCell>開始日</TableCell>
                          <TableCell>学習間隔</TableCell>
                          <TableCell>解答回数</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(selectedChapters).map(([subjectId, chapterIds]) => {
                          const subject = subjects.find(s => s.id === subjectId);
                          if (!subject) return null;
                          
                          return chapterIds.map(chapterId => {
                            const chapter = chapters.find(c => c.id === chapterId);
                            if (!chapter) return null;
                            
                            const setting = chapterSettings[chapterId] || {
                              date: bulkScheduleSettings.date,
                              interval: bulkScheduleSettings.interval,
                              reviewCount: bulkScheduleSettings.reviewCount
                            };
                            
                            return (
                              <TableRow key={chapterId}>
                                <TableCell>
                                  <Typography variant="body2">{subject.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">{chapter.name}</Typography>
                                </TableCell>
                                <TableCell>{chapter.problemCount}問</TableCell>
                                <TableCell>
                                  <DatePicker
                                    slotProps={{
                                      textField: { 
                                        size: "small",
                                        fullWidth: true,
                                        sx: { width: 120 }
                                      }
                                    }}
                                    value={setting.date}
                                    onChange={(newDate) => {
                                      if (newDate) {
                                        updateChapterSetting(
                                          chapterId,
                                          'date',
                                          stripTime(newDate)
                                        );
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormControl size="small" sx={{ width: 120 }}>
                                    <Select
                                      value={setting.interval}
                                      onChange={(e) => {
                                        updateChapterSetting(
                                          chapterId,
                                          'interval',
                                          Number(e.target.value)
                                        );
                                      }}
                                    >
                                      {intervalOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    InputProps={{ inputProps: { min: 0 } }}
                                    value={setting.reviewCount}
                                    onChange={(e) => {
                                      updateChapterSetting(
                                        chapterId,
                                        'reviewCount',
                                        Number(e.target.value)
                                      );
                                    }}
                                    sx={{ width: 80 }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                >
                  戻る
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNext}
                >
                  次へ
                </Button>
              </Box>
            </Box>
          )}
          
          {/* ステップ4: 確認 */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                設定内容の確認
              </Typography>
              
              <Typography variant="body1" paragraph>
                以下の内容で初期設定を完了します。問題は後からいつでも追加や変更が可能です。
              </Typography>
              
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    選択した科目と章
                  </Typography>
                  
                  {selectedSubjects.map(subjectId => {
                    const subject = subjects.find(s => s.id === subjectId);
                    if (!subject) return null;
                    
                    return (
                      <Box key={subject.id} mb={2}>
                        <Typography variant="subtitle2">
                          {subject.name}
                        </Typography>
                        <Box component="ul" sx={{ pl: 4, mt: 1 }}>
                          {selectedChapters[subject.id]?.map(chapterId => {
                            const chapter = chapters.find(c => c.id === chapterId);
                            if (!chapter) return null;
                            
                            return (
                              <Typography component="li" variant="body2" key={chapter.id}>
                                {chapter.name} ({chapter.problemCount}問)
                              </Typography>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    スケジュール設定
                  </Typography>
                  
                  {!advancedMode ? (
                    // 基本設定モードの確認
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>開始日:</strong> {formatDateJP(bulkScheduleSettings.date)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>学習間隔:</strong> {intervalOptions.find(o => o.value === bulkScheduleSettings.interval)?.label || '不明'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>すでに解いた回数:</strong> {bulkScheduleSettings.reviewCount}回
                        </Typography>
                      </Grid>
                    </Grid>
                  ) : (
                    // 高度な設定モードの確認
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>科目・章</TableCell>
                            <TableCell>問題数</TableCell>
                            <TableCell>開始日</TableCell>
                            <TableCell>学習間隔</TableCell>
                            <TableCell>解答回数</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(selectedChapters).map(([subjectId, chapterIds]) => {
                            const subject = subjects.find(s => s.id === subjectId);
                            if (!subject) return null;
                            
                            return chapterIds.map(chapterId => {
                              const chapter = chapters.find(c => c.id === chapterId);
                              if (!chapter) return null;
                              
                              const setting = chapterSettings[chapterId] || {
                                date: bulkScheduleSettings.date,
                                interval: bulkScheduleSettings.interval,
                                reviewCount: bulkScheduleSettings.reviewCount
                              };
                              
                              return (
                                <TableRow key={chapterId}>
                                  <TableCell>
                                    <Typography variant="body2">{subject.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{chapter.name}</Typography>
                                  </TableCell>
                                  <TableCell>{chapter.problemCount}問</TableCell>
                                  <TableCell>{formatDateJP(setting.date)}</TableCell>
                                  <TableCell>
                                    {intervalOptions.find(o => o.value === setting.interval)?.label || '不明'}
                                  </TableCell>
                                  <TableCell>{setting.reviewCount}回</TableCell>
                                </TableRow>
                              );
                            });
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    設定される問題数
                  </Typography>
                  
                  <Typography variant="body2">
                    合計: <strong>{getSelectedProblemCount()}問</strong>
                  </Typography>
</CardContent>
              </Card>
              
              <Alert severity="success" sx={{ mb: 3 }}>
                上記の設定で初期設定を完了します。完了後は「今日の問題」ページへ移動します。
              </Alert>
              
              <Divider sx={{ my: 3 }} />
              
              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                >
                  戻る
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleNext}
                >
                  設定を完了する
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default InitialSetup;
