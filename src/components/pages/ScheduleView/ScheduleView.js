i// src/components/pages/ScheduleView/ScheduleView.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Badge,
  Tooltip,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TodayIcon from '@mui/icons-material/Today';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FlagIcon from '@mui/icons-material/Flag';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useApp } from '../../../contexts/AppContext';
import { 
  formatDateJP, 
  formatDateWithDayOfWeekJP, 
  getIntervalTextJP,
  stripTime,
  addDays,
  getDaysBetween,
  isSameDay,
  isPast
} from '../../../utils/dateUtils';

// 一週間の日付を生成
const getWeekDates = (startDate) => {
  const dates = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// 表示モード
const VIEW_MODES = {
  LIST: 'list',
  CALENDAR: 'calendar'
};

const ScheduleView = () => {
  const navigate = useNavigate();
  const { 
    problems, 
    schedules, 
    subjects, 
    chapters,
    getProblemById,
    getChapterById,
    getSubjectById,
    updateScheduleDate,
    getHistoryForProblem,
    getTodayProblems
  } = useApp();
  
  // 基本的な状態
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(getWeekDates(stripTime(new Date())));
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  
  // フィルター状態
  const [filters, setFilters] = useState({
    subjects: [],
    searchText: '',
    dateRange: {
      startDate: addDays(new Date(), -7),
      endDate: addDays(new Date(), 30)
    }
  });
  
  // 週表示の日付更新
  useEffect(() => {
    setWeekDates(getWeekDates(stripTime(selectedDate)));
  }, [selectedDate]);
  
  // 問題ダイアログを開く
  const handleOpenProblemDialog = (problemId) => {
    const problem = getProblemById(problemId);
    const schedule = schedules.find(s => s.problemId === problemId);
    
    if (problem && schedule) {
      setSelectedProblem({ problem, schedule });
      setShowProblemDialog(true);
    }
  };
  
  // スケジュール日付の変更
  const handleChangeScheduleDate = (newDate) => {
    if (selectedProblem) {
      updateScheduleDate(selectedProblem.problem.id, newDate);
      setSelectedProblem({
        ...selectedProblem,
        schedule: {
          ...selectedProblem.schedule,
          nextReviewDate: newDate
        }
      });
    }
  };
  
  // 前の週へ移動
  const goToPreviousWeek = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };
  
  // 次の週へ移動
  const goToNextWeek = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };
  
  // 今日へ移動
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // 表示モードの切り替え
  const handleChangeViewMode = (event, newMode) => {
    setViewMode(newMode);
  };
  
  // フィルターの適用
  const applyFilters = () => {
    setShowFilterDialog(false);
  };
  
  // フィルターのリセット
  const resetFilters = () => {
    setFilters({
      subjects: [],
      searchText: '',
      dateRange: {
        startDate: addDays(new Date(), -7),
        endDate: addDays(new Date(), 30)
      }
    });
  };
  
  // フィルター付きの問題リスト取得
  const getFilteredSchedules = () => {
    return schedules.filter(schedule => {
      const problem = getProblemById(schedule.problemId);
      if (!problem) return false;
      
      // 日付範囲フィルター
      const scheduleDate = new Date(schedule.nextReviewDate);
      if (
        scheduleDate < filters.dateRange.startDate ||
        scheduleDate > filters.dateRange.endDate
      ) {
        return false;
      }
      
      // 科目フィルター
      if (
        filters.subjects.length > 0 &&
        !filters.subjects.includes(problem.subjectId)
      ) {
        return false;
      }
      
      // 検索テキストフィルター
      if (filters.searchText.trim() !== '') {
        const searchLower = filters.searchText.toLowerCase();
        const chapter = getChapterById(problem.chapterId);
        const subject = getSubjectById(problem.subjectId);
        
        const problemNumberMatch = problem.number.toLowerCase().includes(searchLower);
        const chapterMatch = chapter && chapter.name.toLowerCase().includes(searchLower);
        const subjectMatch = subject && subject.name.toLowerCase().includes(searchLower);
        
        if (!problemNumberMatch && !chapterMatch && !subjectMatch) {
          return false;
        }
      }
      
      return true;
    });
  };
  
  // 特定の日付のスケジュールを取得
  const getSchedulesForDate = (date) => {
    const filteredSchedules = getFilteredSchedules();
    
    return filteredSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.nextReviewDate);
      return isSameDay(scheduleDate, date);
    });
  };
  
  // 日付セルのレンダリング
  const renderDateCell = (date) => {
    const daySchedules = getSchedulesForDate(date);
    const isToday = isSameDay(date, new Date());
    const isPastDate = isPast(date);
    
    return (
      <TableCell 
        key={date.toISOString()} 
        sx={{ 
          width: '14.28%', 
          height: 120, 
          verticalAlign: 'top',
          bgcolor: isToday ? 'primary.50' : 'background.paper',
          border: isToday ? '2px solid #3f51b5' : '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography 
            variant="subtitle2" 
            color={isPastDate ? 'text.secondary' : 'text.primary'}
            sx={{ 
              fontWeight: isToday ? 'bold' : 'normal',
              display: 'inline-block',
              borderRadius: '50%',
              width: 24,
              height: 24,
              textAlign: 'center',
              lineHeight: '24px',
              bgcolor: isToday ? 'primary.main' : 'transparent',
              color: isToday ? 'white' : 'inherit'
            }}
          >
            {date.getDate()}
          </Typography>
          <Box sx={{ mt: 1 }}>
            {daySchedules.slice(0, 3).map(schedule => {
              const problem = getProblemById(schedule.problemId);
              if (!problem) return null;
              
              return (
                <Box 
                  key={schedule.problemId}
                  sx={{ 
                    p: 0.5, 
                    mb: 0.5, 
                    borderRadius: 1,
                    bgcolor: 'primary.50',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'primary.100'
                    }
                  }}
                  onClick={() => handleOpenProblemDialog(schedule.problemId)}
                >
                  {problem.number}
                </Box>
              );
            })}
            {daySchedules.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                + {daySchedules.length - 3} more
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>
    );
  };
  
  // 今日の問題数を取得
  const todayProblemsCount = getTodayProblems().length;
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            スケジュール一覧
          </Typography>
          
          <Box>
            <Tooltip title="今日の問題">
              <Badge badgeContent={todayProblemsCount} color="error" sx={{ mr: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<TodayIcon />}
                  onClick={() => navigate('/today')}
                  size="small"
                >
                  今日の問題
                </Button>
              </Badge>
            </Tooltip>
            
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilterDialog(true)}
              size="small"
            >
              フィルター
            </Button>
          </Box>
        </Box>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Tabs value={viewMode} onChange={handleChangeViewMode}>
                <Tab 
                  icon={<EventNoteIcon />} 
                  label="リスト表示" 
                  value={VIEW_MODES.LIST}
                />
                <Tab 
                  icon={<CalendarTodayIcon />} 
                  label="カレンダー表示" 
                  value={VIEW_MODES.CALENDAR}
                />
              </Tabs>
            </Box>
            
            <Box display="flex" alignItems="center">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                slotProps={{ textField: { size: 'small' } }}
              />
              
              <Box ml={1}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={goToToday}
                >
                  今日
                </Button>
              </Box>
            </Box>
          </Box>
          
          {viewMode === VIEW_MODES.LIST ? (
            // リスト表示
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>問題</TableCell>
                    <TableCell>科目・章</TableCell>
                    <TableCell>次回学習日</TableCell>
                    <TableCell>間隔</TableCell>
                    <TableCell>復習回数</TableCell>
                    <TableCell>アクション</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredSchedules().map(schedule => {
                    const problem = getProblemById(schedule.problemId);
                    if (!problem) return null;
                    
                    const chapter = getChapterById(problem.chapterId);
                    const subject = getSubjectById(problem.subjectId);
                    const isToday = isSameDay(schedule.nextReviewDate, new Date());
                    const isPastDue = isPast(schedule.nextReviewDate) && !isToday;
                    
                    return (
                      <TableRow 
                        key={schedule.problemId}
                        sx={{ 
                          bgcolor: isToday ? 'primary.50' : (isPastDue ? '#fff4f4' : 'inherit')
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2">
                            {problem.number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {subject ? subject.name : 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {chapter ? chapter.name : 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDateWithDayOfWeekJP(schedule.nextReviewDate)}
                          </Typography>
                          {isToday && (
                            <Chip 
                              size="small" 
                              label="今日" 
                              color="primary" 
                              sx={{ mt: 0.5 }}
                            />
                          )}
                          {isPastDue && (
                            <Chip 
                              size="small" 
                              label="期限超過" 
                              color="error" 
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {getIntervalTextJP(schedule.currentInterval)}
                        </TableCell>
                        <TableCell>
                          {schedule.reviewCount}回
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small"
                            onClick={() => handleOpenProblemDialog(problem.id)}
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
            // カレンダー表示
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={goToPreviousWeek}
                >
                  前の週
                </Button>
                <Typography variant="h6">
                  {formatDateJP(weekDates[0])} 〜 {formatDateJP(weekDates[6])}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={goToNextWeek}
                >
                  次の週
                </Button>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                        <TableCell key={day} align="center">
                          <Typography 
                            variant="subtitle2" 
                            color={index === 0 ? 'error.main' : (index === 6 ? 'primary.main' : 'text.primary')}
                          >
                            {day}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      {weekDates.map(date => renderDateCell(date))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
        
        {/* 問題詳細・編集ダイアログ */}
        <Dialog
          open={showProblemDialog}
          onClose={() => setShowProblemDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            問題スケジュールの詳細
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
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      復習回数
                    </Typography>
                    <Typography variant="body1">
                      {selectedProblem.schedule.reviewCount}回
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      現在の間隔
                    </Typography>
                    <Typography variant="body1">
                      {getIntervalTextJP(selectedProblem.schedule.currentInterval)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      前回の学習日
                    </Typography>
                    <Typography variant="body1">
                      {formatDateJP(selectedProblem.schedule.lastReviewDate)}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle1" gutterBottom>
                  次回学習日の変更
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <DatePicker
                    label="次回学習日"
                    value={selectedProblem.schedule.nextReviewDate}
                    onChange={handleChangeScheduleDate}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowProblemDialog(false)}>閉じる</Button>
          </DialogActions>
        </Dialog>
        
        {/* フィルターダイアログ */}
        <Dialog
          open={showFilterDialog}
          onClose={() => setShowFilterDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            スケジュールのフィルター
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="検索"
                  placeholder="問題番号、科目名、章名で検索"
                  value={filters.searchText}
                  onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>科目</InputLabel>
                  <Select
                    multiple
                    value={filters.subjects}
                    onChange={(e) => setFilters({...filters, subjects: e.target.value})}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={getSubjectById(value)?.name || value} 
                            size="small" 
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6}>
                <DatePicker
                  label="開始日"
                  value={filters.dateRange.startDate}
                  onChange={(newDate) => {
                    if (newDate) {
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          startDate: stripTime(newDate)
                        }
                      });
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <DatePicker
                  label="終了日"
                  value={filters.dateRange.endDate}
                  onChange={(newDate) => {
                    if (newDate) {
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          endDate: stripTime(newDate)
                        }
                      });
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetFilters} color="inherit">
              リセット
            </Button>
            <Button onClick={applyFilters} variant="contained" color="primary">
              適用
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default ScheduleView;
