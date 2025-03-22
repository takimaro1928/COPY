// src/components/pages/AllProblems/AllProblems.js

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Grid,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Divider,
  Card,
  CardContent,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useApp } from '../../../contexts/AppContext';
import { 
  formatDate, 
  formatDateWithDayOfWeekJP, 
  getIntervalTextJP,
  stripTime,
  isToday,
  isPast,
  isFuture,
  formatDateJP
} from '../../../utils/dateUtils';
import { UnderstandingLevel } from '../../../models/types';

const AllProblems = () => {
  const { 
    problems, 
    schedules, 
    subjects, 
    chapters, 
    history,
    getProblemById,
    getChapterById,
    getSubjectById,
    updateSchedule,
    updateScheduleDate,
    getHistoryForProblem,
    setBulkSchedule
  } = useApp();

  // 状態管理
  const [expandedSubjects, setExpandedSubjects] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [problemHistory, setProblemHistory] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    subjects: [],
    chapters: [],
    understandingLevels: [],
    reviewedOnly: false
  });

  // 科目の展開状態を切り替え
  const handleToggleSubject = (subjectId) => {
    if (expandedSubjects.includes(subjectId)) {
      setExpandedSubjects(expandedSubjects.filter(id => id !== subjectId));
    } else {
      setExpandedSubjects([...expandedSubjects, subjectId]);
    }
  };

  // 章の展開状態を切り替え
  const handleToggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  // 問題編集ダイアログを開く
  const handleOpenEditDialog = (problemId) => {
    const problem = getProblemById(problemId);
    const schedule = schedules.find(s => s.problemId === problemId);
    
    if (problem) {
      // 問題履歴の取得
      const history = getHistoryForProblem(problemId);
      setProblemHistory(history);
      
      setSelectedProblem({
        problem,
        schedule: schedule || {
          problemId,
          nextReviewDate: new Date(),
          currentInterval: 0,
          reviewCount: 0,
          lastReviewDate: new Date()
        }
      });
      setEditDialogOpen(true);
    }
  };

  // スケジュール更新
  const handleUpdateSchedule = () => {
    if (selectedProblem && selectedProblem.schedule) {
      updateSchedule(selectedProblem.schedule);
      setEditDialogOpen(false);
    }
  };

  // 次回学習日の変更
  const handleDateChange = (newDate) => {
    if (selectedProblem) {
      setSelectedProblem({
        ...selectedProblem,
        schedule: {
          ...selectedProblem.schedule,
          nextReviewDate: newDate
        }
      });
    }
  };

  // 現在の間隔の変更
  const handleIntervalChange = (e) => {
    if (selectedProblem) {
      setSelectedProblem({
        ...selectedProblem,
        schedule: {
          ...selectedProblem.schedule,
          currentInterval: Number(e.target.value)
        }
      });
    }
  };

  // 復習回数の変更
  const handleReviewCountChange = (e) => {
    if (selectedProblem) {
      setSelectedProblem({
        ...selectedProblem,
        schedule: {
          ...selectedProblem.schedule,
          reviewCount: Number(e.target.value)
        }
      });
    }
  };

  // 検索とフィルタリング
  const getFilteredProblems = () => {
    return problems.filter(problem => {
      // 検索テキストフィルタリング
      if (searchText.trim() !== '') {
        const searchLower = searchText.toLowerCase();
        const problemNumber = problem.number.toLowerCase();
        const chapter = getChapterById(problem.chapterId);
        const subject = getSubjectById(problem.subjectId);
        
        const numberMatch = problemNumber.includes(searchLower);
        const chapterMatch = chapter && chapter.name.toLowerCase().includes(searchLower);
        const subjectMatch = subject && subject.name.toLowerCase().includes(searchLower);
        
        if (!numberMatch && !chapterMatch && !subjectMatch) {
          return false;
        }
      }
      
      // 科目フィルタリング
      if (filters.subjects.length > 0 && !filters.subjects.includes(problem.subjectId)) {
        return false;
      }
      
      // 章フィルタリング
      if (filters.chapters.length > 0 && !filters.chapters.includes(problem.chapterId)) {
        return false;
      }
      
      // 理解度フィルタリング
      if (filters.understandingLevels.length > 0) {
        const problemHistory = getHistoryForProblem(problem.id);
        
        // 履歴がない場合はフィルターに合致しない
        if (problemHistory.length === 0) {
          return !filters.reviewedOnly;
        }
        
        // 最新の履歴を取得
        const latestHistory = problemHistory.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        
        if (!filters.understandingLevels.includes(latestHistory.understandingLevel)) {
          return false;
        }
      } else if (filters.reviewedOnly) {
        // 解答済みのみ表示設定の場合
        const problemHistory = getHistoryForProblem(problem.id);
        if (problemHistory.length === 0) {
          return false;
        }
      }
      
      return true;
    });
  };

  // 最新の理解度を取得する関数
  const getLatestUnderstandingLevel = (problemId) => {
    const problemHistory = getHistoryForProblem(problemId);
    
    if (problemHistory.length === 0) {
      return null;
    }
    
    const latestHistory = problemHistory.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    return latestHistory.understandingLevel;
  };

  // 正答率を計算する関数
  const calculateCorrectRate = (problemId) => {
    const problemHistory = getHistoryForProblem(problemId);
    
    if (problemHistory.length === 0) {
      return null;
    }
    
    const correctCount = problemHistory.filter(h => h.isCorrect).length;
    return (correctCount / problemHistory.length) * 100;
  };

  // フィルターのリセット
  const handleResetFilters = () => {
    setFilters({
      subjects: [],
      chapters: [],
      understandingLevels: [],
      reviewedOnly: false
    });
    setSearchText('');
  };

  // フィルターを適用
  const handleApplyFilters = () => {
    setFilterDialogOpen(false);
  };

  // 科目ごとの問題数とフィルタリング後の問題数を計算
  const calculateSubjectStats = () => {
    const stats = {};
    
    subjects.forEach(subject => {
      const subjectProblems = problems.filter(p => p.subjectId === subject.id);
      const filteredSubjectProblems = getFilteredProblems().filter(p => p.subjectId === subject.id);
      
      stats[subject.id] = {
        total: subjectProblems.length,
        filtered: filteredSubjectProblems.length
      };
    });
    
    return stats;
  };

  // 章ごとの問題数とフィルタリング後の問題数を計算
  const calculateChapterStats = () => {
    const stats = {};
    
    chapters.forEach(chapter => {
      const chapterProblems = problems.filter(p => p.chapterId === chapter.id);
      const filteredChapterProblems = getFilteredProblems().filter(p => p.chapterId === chapter.id);
      
      stats[chapter.id] = {
        total: chapterProblems.length,
        filtered: filteredChapterProblems.length
      };
    });
    
    return stats;
  };

  const subjectStats = calculateSubjectStats();
  const chapterStats = calculateChapterStats();
  const filteredProblems = getFilteredProblems();
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            全問題一覧
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            フィルター
          </Button>
        </Box>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="問題番号、科目名、章名で検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchText('')}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              表示中: <strong>{filteredProblems.length}</strong> / {problems.length} 問
            </Typography>
            
            {filters.subjects.length > 0 && (
              <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                {filters.subjects.map(subjectId => {
                  const subject = getSubjectById(subjectId);
                  return subject && (
                    <Chip
                      key={subject.id}
                      label={subject.name}
                      onDelete={() => setFilters({
                        ...filters,
                        subjects: filters.subjects.filter(id => id !== subject.id)
                      })}
                      size="small"
                    />
                  );
                })}
              </Box>
            )}
            
            {(filters.chapters.length > 0 || filters.understandingLevels.length > 0 || filters.reviewedOnly) && (
              <Box display="flex" flexWrap="wrap" gap={1}>
                {filters.chapters.map(chapterId => {
                  const chapter = getChapterById(chapterId);
                  return chapter && (
                    <Chip
                      key={chapter.id}
                      label={chapter.name}
                      onDelete={() => setFilters({
                        ...filters,
                        chapters: filters.chapters.filter(id => id !== chapter.id)
                      })}
                      size="small"
                    />
                  );
                })}
                
                {filters.understandingLevels.map(level => {
                  let label = '';
                  let color = 'default';
                  
                  switch (level) {
                    case UnderstandingLevel.FULL:
                      label = '理解○';
                      color = 'success';
                      break;
                    case UnderstandingLevel.PARTIAL:
                      label = '曖昧△';
                      color = 'warning';
                      break;
                    case UnderstandingLevel.NONE:
                      label = '理解×';
                      color = 'error';
                      break;
                    default:
                      label = level;
                  }
                  
                  return (
                    <Chip
                      key={level}
                      label={label}
                      color={color}
                      onDelete={() => setFilters({
                        ...filters,
                        understandingLevels: filters.understandingLevels.filter(l => l !== level)
                      })}
                      size="small"
                    />
                  );
                })}
                
                {filters.reviewedOnly && (
                  <Chip
                    label="解答済みのみ"
                    onDelete={() => setFilters({
                      ...filters,
                      reviewedOnly: false
                    })}
                    size="small"
                  />
                )}
              </Box>
            )}
          </Box>
          
          {searchText || filters.subjects.length > 0 || filters.chapters.length > 0 || 
           filters.understandingLevels.length > 0 || filters.reviewedOnly ? (
            <Box>
              {filteredProblems.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>問題番号</TableCell>
                        <TableCell>科目・章</TableCell>
                        <TableCell>次回学習日</TableCell>
                        <TableCell align="center">理解度</TableCell>
                        <TableCell align="center">正答率</TableCell>
                        <TableCell align="center">復習回数</TableCell>
                        <TableCell align="center">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredProblems.map(problem => {
                        const schedule = schedules.find(s => s.problemId === problem.id);
                        const understandingLevel = getLatestUnderstandingLevel(problem.id);
                        const correctRate = calculateCorrectRate(problem.id);
                        
                        return (
                          <TableRow key={problem.id}>
                            <TableCell>{problem.number}</TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {getSubjectById(problem.subjectId)?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getChapterById(problem.chapterId)?.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {schedule ? formatDateWithDayOfWeekJP(schedule.nextReviewDate) : '未設定'}
                            </TableCell>
                            <TableCell align="center">
                              {understandingLevel === UnderstandingLevel.FULL && (
                                <Chip label="理解○" size="small" color="success" />
                              )}
                              {understandingLevel === UnderstandingLevel.PARTIAL && (
                                <Chip label="曖昧△" size="small" color="warning" />
                              )}
                              {understandingLevel === UnderstandingLevel.NONE && (
                                <Chip label="理解×" size="small" color="error" />
                              )}
                              {understandingLevel === null && (
                                <Typography variant="caption" color="text.secondary">
                                  未解答
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {correctRate !== null ? (
                                <Typography
                                  variant="body2"
                                  color={correctRate >= 80 ? 'success.main' : 
                                        (correctRate >= 50 ? 'warning.main' : 'error.main')}
                                >
                                  {correctRate.toFixed(0)}%
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {schedule ? schedule.reviewCount : 0}回
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditDialog(problem.id)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Card variant="outlined" sx={{ textAlign: 'center', py: 3 }}>
                  <CardContent>
                    <Typography color="text.secondary">
                      該当する問題はありません
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            // 科目別の階層表示
            <Box>
              {subjects.map(subject => {
                const subjectProblemCount = subjectStats[subject.id]?.total || 0;
                const filteredSubjectProblemCount = subjectStats[subject.id]?.filtered || 0;
                
                // この科目の問題がフィルターで除外されている場合は表示しない
                if (filteredSubjectProblemCount === 0) {
                  return null;
                }
                
                return (
                  <Accordion 
                    key={subject.id} 
                    expanded={expandedSubjects.includes(subject.id)}
                    onChange={() => handleToggleSubject(subject.id)}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">
                        {subject.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        {filteredSubjectProblemCount}問
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        {chapters
                          .filter(chapter => chapter.subjectId === subject.id)
                          .map(chapter => {
                            const chapterProblemCount = chapterStats[chapter.id]?.total || 0;
                            const filteredChapterProblemCount = chapterStats[chapter.id]?.filtered || 0;
                            
                            // この章の問題がフィルターで除外されている場合は表示しない
                            if (filteredChapterProblemCount === 0) {
                              return null;
                            }
                            
                            return (
                              <Accordion 
                                key={chapter.id} 
                                expanded={expandedChapters[chapter.id] || false}
                                onChange={() => handleToggleChapter(chapter.id)}
                                sx={{ ml: 2, mb: 1 }}
                              >
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography variant="subtitle2">
                                    {chapter.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    {filteredChapterProblemCount}問
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>問題番号</TableCell>
                                          <TableCell>次回学習日</TableCell>
                                          <TableCell align="center">理解度</TableCell>
                                          <TableCell align="center">正答率</TableCell>
                                          <TableCell align="center">復習回数</TableCell>
                                          <TableCell align="center">操作</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {problems
                                          .filter(p => p.chapterId === chapter.id && 
                                                   filteredProblems.some(fp => fp.id === p.id))
                                          .map(problem => {
                                            const schedule = schedules.find(s => s.problemId === problem.id);
                                            const understandingLevel = getLatestUnderstandingLevel(problem.id);
                                            const correctRate = calculateCorrectRate(problem.id);
                                            
                                            return (
                                              <TableRow key={problem.id}>
                                                <TableCell>{problem.number}</TableCell>
                                                <TableCell>
                                                  {schedule ? formatDateWithDayOfWeekJP(schedule.nextReviewDate) : '未設定'}
                                                </TableCell>
                                                <TableCell align="center">
                                                  {understandingLevel === UnderstandingLevel.FULL && (
                                                    <Chip label="理解○" size="small" color="success" />
                                                  )}
                                                  {understandingLevel === UnderstandingLevel.PARTIAL && (
                                                    <Chip label="曖昧△" size="small" color="warning" />
                                                  )}
                                                  {understandingLevel === UnderstandingLevel.NONE && (
                                                    <Chip label="理解×" size="small" color="error" />
                                                  )}
                                                  {understandingLevel === null && (
                                                    <Typography variant="caption" color="text.secondary">
                                                      未解答
                                                    </Typography>
                                                  )}
                                                </TableCell>
                                                <TableCell align="center">
                                                  {correctRate !== null ? (
                                                    <Typography
                                                      variant="body2"
                                                      color={correctRate >= 80 ? 'success.main' : 
                                                            (correctRate >= 50 ? 'warning.main' : 'error.main')}
                                                    >
                                                      {correctRate.toFixed(0)}%
                                                    </Typography>
                                                  ) : (
                                                    <Typography variant="caption" color="text.secondary">
                                                      -
                                                    </Typography>
                                                  )}
                                                </TableCell>
                                                <TableCell align="center">
                                                  {schedule ? schedule.reviewCount : 0}回
                                                </TableCell>
                                                <TableCell align="center">
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenEditDialog(problem.id)}
                                                  >
                                                    <EditIcon fontSize="small" />
                                                  </IconButton>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </Paper>
        
        {/* 問題編集ダイアログ */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            問題詳細の編集
            <IconButton
              aria-label="close"
              onClick={() => setEditDialogOpen(false)}
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
            {selectedProblem && (
              <>
                <Typography variant="h6" gutterBottom>
                  問題 {selectedProblem.problem.number}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {getSubjectById(selectedProblem.problem.subjectId)?.name} &gt; {
                    getChapterById(selectedProblem.problem.chapterId)?.name
                  }
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  スケジュール設定
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <DatePicker
                      label="次回学習日"
                      value={selectedProblem.schedule.nextReviewDate}
                      onChange={handleDateChange}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel id="interval-select-label">学習間隔</InputLabel>
                      <Select
                        labelId="interval-select-label"
                        value={selectedProblem.schedule.currentInterval}
                        label="学習間隔"
                        onChange={handleIntervalChange}
                      >
                        <MenuItem value={0}>初回（今日）</MenuItem>
                        <MenuItem value={1}>1日後（明日）</MenuItem>
                        <MenuItem value={3}>3日後</MenuItem>
                        <MenuItem value={7}>1週間後</MenuItem>
                        <MenuItem value={14}>2週間後</MenuItem>
                        <MenuItem value={30}>1ヶ月後</MenuItem>
                        <MenuItem value={60}>2ヶ月後</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="復習回数"
                      type="number"
                      InputProps={{ inputProps: { min: 0 } }}
                      value={selectedProblem.schedule.reviewCount}
                      onChange={handleReviewCountChange}
                    />
                  </Grid>
                </Grid>
                
                {problemHistory.length > 0 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      学習履歴
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>日付</TableCell>
                            <TableCell align="center">結果</TableCell>
                            <TableCell align="center">理解度</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {problemHistory
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(history => (
                              <TableRow key={history.id}>
                                <TableCell>
                                  {formatDateJP(history.date)}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={history.isCorrect ? "正解" : "不正解"}
                                    color={history.isCorrect ? "success" : "error"}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  {history.understandingLevel === UnderstandingLevel.FULL && (
                                    <Chip label="理解○" size="small" color="success" />
                                  )}
                                  {history.understandingLevel === UnderstandingLevel.PARTIAL && (
                                    <Chip label="曖昧△" size="small" color="warning" />
                                  )}
                                  {history.understandingLevel === UnderstandingLevel.NONE && (
                                    <Chip label="理解×" size="small" color="error" />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleUpdateSchedule}
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* フィルターダイアログ */}
        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            問題のフィルター
            <IconButton
              aria-label="close"
              onClick={() => setFilterDialogOpen(false)}
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
            <Typography variant="subtitle1" gutterBottom>
              科目でフィルター
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
              {subjects.map(subject => (
                <Chip
                  key={subject.id}
                  label={subject.name}
                  onClick={() => {
                    const newSubjects = filters.subjects.includes(subject.id)
                      ? filters.subjects.filter(id => id !== subject.id)
                      : [...filters.subjects, subject.id];
                    
                    setFilters({
                      ...filters,
                      subjects: newSubjects
                    });
                  }}
                  color={filters.subjects.includes(subject.id) ? "primary" : "default"}
                  variant={filters.subjects.includes(subject.id) ? "filled" : "outlined"}
                />
              ))}
            </Box>
            
            <Typography variant="subtitle1" gutterBottom>
              理解度でフィルター
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
              <Chip
                label="理解○"
                onClick={() => {
                  const newLevels = filters.understandingLevels.includes(UnderstandingLevel.FULL)
                    ? filters.understandingLevels.filter(level => level !== UnderstandingLevel.FULL)
                    : [...filters.understandingLevels, UnderstandingLevel.FULL];
                  
                  setFilters({
                    ...filters,
                    understandingLevels: newLevels
                  });
                }}
                color={filters.understandingLevels.includes(UnderstandingLevel.FULL) ? "success" : "default"}
                variant={filters.understandingLevels.includes(UnderstandingLevel.FULL) ? "filled" : "outlined"}
              />
              
              <Chip
                label="曖昧△"
                onClick={() => {
                  const newLevels = filters.understandingLevels.includes(UnderstandingLevel.PARTIAL)
                    ? filters.understandingLevels.filter(level => level !== UnderstandingLevel.PARTIAL)
                    : [...filters.understandingLevels, UnderstandingLevel.PARTIAL];
                  
                  setFilters({
                    ...filters,
                    understandingLevels: newLevels
                  });
                }}
                color={filters.understandingLevels.includes(UnderstandingLevel.PARTIAL) ? "warning" : "default"}
                variant={filters.understandingLevels.includes(UnderstandingLevel.PARTIAL) ? "filled" : "outlined"}
              />
              
              <Chip
                label="理解×"
                onClick={() => {
                  const newLevels = filters.understandingLevels.includes(UnderstandingLevel.NONE)
                    ? filters.understandingLevels.filter(level => level !== UnderstandingLevel.NONE)
                    : [...filters.understandingLevels, UnderstandingLevel.NONE];
                  
                  setFilters({
                    ...filters,
                    understandingLevels: newLevels
                  });
                }}
                color={filters.understandingLevels.includes(UnderstandingLevel.NONE) ? "error" : "default"}
                variant={filters.understandingLevels.includes(UnderstandingLevel.NONE) ? "filled" : "outlined"}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.reviewedOnly}
                  onChange={(e) => setFilters({
                    ...filters,
                    reviewedOnly: e.target.checked
                  })}
                />
              }
              label="解答済みの問題のみ表示"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleResetFilters} color="inherit">
              リセット
            </Button>
            <Button onClick={handleApplyFilters} variant="contained" color="primary">
              適用
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default AllProblems;
