// src/components/pages/ScheduleView/ScheduleView.js

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
  Alert,
  Snackbar,
  useMediaQuery,
  Zoom,
  Grow,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  Slide
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useApp } from '../../../contexts/AppContext';
import { 
  formatDateJP, 
  formatDateWithDayOfWeekJP, 
  getIntervalTextJP,
  stripTime,
  addDays,
  getDaysBetween,
  isSameDay,
  isPast,
  getFirstDayOfMonth,
  getLastDayOfMonth
} from '../../../utils/dateUtils';
import { generateProgressReport } from '../../../services/scheduleService';
import { UnderstandingLevel } from '../../../models/types';

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

// 月の全日付を生成（週ごとのグループ化）
const getMonthDates = (date) => {
  const firstDay = getFirstDayOfMonth(date);
  const lastDay = getLastDayOfMonth(date);
  
  // 最初の週の開始日（月曜日から始めるため、前の月の日を追加）
  const startDate = new Date(firstDay);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  // 最後の週の終了日
  const endDate = new Date(lastDay);
  const lastDayOfWeek = endDate.getDay();
  endDate.setDate(endDate.getDate() + (lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek));
  
  // 週ごとに日付をグループ化
  const weeks = [];
  let currentWeek = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    currentWeek.push(new Date(currentDate));
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  return weeks;
};

// 表示モード
const VIEW_MODES = {
  LIST: 'list',
  WEEK: 'week',
  MONTH: 'month'
};

const ScheduleView = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { 
    problems, 
    schedules, 
    subjects, 
    chapters,
    history,
    getProblemById,
    getChapterById,
    getSubjectById,
    updateScheduleDate,
    getHistoryForProblem,
    getTodayProblems
  } = useApp();
  
  // 基本的な状態
  const [viewMode, setViewMode] = useState(isMobile ? VIEW_MODES.LIST : VIEW_MODES.WEEK);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(getWeekDates(stripTime(new Date())));
  const [monthDates, setMonthDates] = useState(getMonthDates(stripTime(new Date())));
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('right');
  
  // フィルター状態
  const [filters, setFilters] = useState({
    subjects: [],
    searchText: '',
    dateRange: {
      startDate: addDays(new Date(), -7),
      endDate: addDays(new Date(), 30)
    }
  });
  
  // モバイル表示用状態
  const [expandedDay, setExpandedDay] = useState(null);
  
  // 週表示と月表示の日付更新
  useEffect(() => {
    setWeekDates(getWeekDates(stripTime(selectedDate)));
    setMonthDates(getMonthDates(stripTime(selectedDate)));
  }, [selectedDate]);
  
  // スナックバーを表示
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage({ open: true, message, severity });
  };
  
  // スナックバーを閉じる
  const handleCloseSnackbar = () => {
    setSnackbarMessage({ ...snackbarMessage, open: false });
  };
  
  // 問題ダイアログを開く
  const handleOpenProblemDialog = (problemId) => {
    const problem = getProblemById(problemId);
    const schedule = schedules.find(s => s.problemId === problemId);
    
    if (problem && schedule) {
      setSelectedProblem({ 
        problem, 
        schedule,
        history: getHistoryForProblem(problemId)
      });
      setShowProblemDialog(true);
    }
  };
  
  // スケジュール日付の変更
  const handleChangeScheduleDate = (newDate) => {
    if (selectedProblem) {
      setIsLoading(true);
      
      setTimeout(() => {
        updateScheduleDate(selectedProblem.problem.id, newDate);
        setSelectedProblem({
          ...selectedProblem,
          schedule: {
            ...selectedProblem.schedule,
            nextReviewDate: newDate
          }
        });
        
        setIsLoading(false);
        showSnackbar('学習日を更新しました', 'success');
      }, 300);
    }
  };
  
  // 前の週/月へ移動
  const goToPrevious = () => {
    setAnimationDirection('left');
    
    if (viewMode === VIEW_MODES.WEEK) {
      setSelectedDate(prev => addDays(prev, -7));
    } else if (viewMode === VIEW_MODES.MONTH) {
      setSelectedDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() - 1);
        return newDate;
      });
    }
  };
  
  // 次の週/月へ移動
  const goToNext = () => {
    setAnimationDirection('right');
    
    if (viewMode === VIEW_MODES.WEEK) {
      setSelectedDate(prev => addDays(prev, 7));
    } else if (viewMode === VIEW_MODES.MONTH) {
      setSelectedDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
      });
    }
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
    showSnackbar('フィルターを適用しました', 'success');
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
  
  // ドラッグアンドドロップ処理
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    
    // ドロップ先がない場合は処理終了
    if (!destination) return;
    
    // 同じ位置にドロップされた場合は何もしない
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // 日付の取得（droppableIdが日付形式）
    const newDate = new Date(destination.droppableId);
    
    // スケジュール更新
    const schedule = schedules.find(s => s.problemId === draggableId);
    if (schedule) {
      // ロード中表示
      setIsLoading(true);
      
      // UIのレスポンシブ性を維持するために非同期で処理
      setTimeout(() => {
        updateScheduleDate(draggableId, newDate);
        
        // 詳細ダイアログが開いていて、同じ問題の場合は内容を更新
        if (selectedProblem && selectedProblem.problem.id === draggableId) {
          setSelectedProblem({
            ...selectedProblem,
            schedule: {
              ...selectedProblem.schedule,
              nextReviewDate: newDate
            }
          });
        }
        
        setIsLoading(false);
        
        // 通知
        showSnackbar(`問題の学習日を${formatDateJP(newDate)}に変更しました`, 'success');
      }, 300);
    }
  };
  
  // 日付セルのレンダリング（週表示）
  const renderWeekDateCell = (date) => {
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
          border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0'
        }}
      >
        <Droppable droppableId={date.toISOString()}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{ 
                height: '100%',
                minHeight: 100,
                p: 1,
                backgroundColor: snapshot.isDraggingOver ? 'rgba(0, 0, 255, 0.05)' : 'transparent',
                transition: 'background-color 0.2s ease'
              }}
            >
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
                {daySchedules.slice(0, 4).map((schedule, index) => {
                  const problem = getProblemById(schedule.problemId);
                  if (!problem) return null;
                  
                  return (
                    <Draggable 
                      key={schedule.problemId} 
                      draggableId={schedule.problemId} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{ 
                            p: 0.5, 
                            mb: 0.5, 
                            borderRadius: 1,
                            bgcolor: snapshot.isDragging ? 'primary.200' : 'primary.50',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                            boxShadow: snapshot.isDragging ? 2 : 0,
                            '&:hover': {
                              bgcolor: 'primary.100'
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProblemDialog(schedule.problemId);
                          }}
                        >
                          <Typography variant="caption" noWrap sx={{ maxWidth: '90%' }}>
                            {problem.number}
                          </Typography>
                          <DragIndicatorIcon fontSize="inherit" sx={{ opacity: 0.5 }} />
                        </Box>
                      )}
                    </Draggable>
                  );
                })}
                {daySchedules.length > 4 && (
                  <Typography variant="caption" color="text.secondary">
                    + {daySchedules.length - 4} more
                  </Typography>
                )}
                {provided.placeholder}
              </Box>
            </Box>
          )}
        </Droppable>
      </TableCell>
    );
  };
  
  // 月表示の日付セルレンダリング
  const renderMonthDateCell = (date, isCurrentMonth) => {
    const daySchedules = getSchedulesForDate(date);
    const isToday = isSameDay(date, new Date());
    const isPastDate = isPast(date);
    
    return (
      <TableCell 
        key={date.toISOString()} 
        sx={{ 
          width: '14.28%', 
          height: 80, 
          verticalAlign: 'top',
          bgcolor: isToday ? 'primary.50' : isCurrentMonth ? 'background.paper' : 'grey.50',
          border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
          opacity: isCurrentMonth ? 1 : 0.5
        }}
      >
        <Droppable droppableId={date.toISOString()}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{ 
                height: '100%',
                minHeight: 70,
                p: 0.5,
                backgroundColor: snapshot.isDraggingOver ? 'rgba(0, 0, 255, 0.05)' : 'transparent'
              }}
            >
              <Typography 
                variant="caption" 
                color={isPastDate ? 'text.secondary' : 'text.primary'}
                sx={{ 
                  fontWeight: isToday ? 'bold' : 'normal',
                  display: 'inline-block',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  textAlign: 'center',
                  lineHeight: '20px',
                  bgcolor: isToday ? 'primary.main' : 'transparent',
                  color: isToday ? 'white' : 'inherit'
                }}
              >
                {date.getDate()}
              </Typography>
              
              {daySchedules.length > 0 && (
                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                  {daySchedules.slice(0, 2).map((schedule, index) => (
                    <Draggable 
                      key={schedule.problemId} 
                      draggableId={schedule.problemId} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{ 
                            width: '100%',
                            p: 0.3, 
                            borderRadius: 0.5,
                            bgcolor: snapshot.isDragging ? 'primary.200' : 'primary.50',
                            fontSize: '0.65rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            '&:hover': {
                              bgcolor: 'primary.100'
                            }
                          }}
                          onClick={() => handleOpenProblemDialog(schedule.problemId)}
                        >
                          {getProblemById(schedule.problemId)?.number}
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  
                  {daySchedules.length > 2 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      +{daySchedules.length - 2}
                    </Typography>
                  )}
                </Box>
              )}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </TableCell>
    );
  };
  
  // モバイル用の日別リストアイテム
  const renderMobileDayItem = (date) => {
    const daySchedules = getSchedulesForDate(date);
    const isToday = isSameDay(date, new Date());
    const isPastDate = isPast(date) && !isToday;
    const isExpanded = expandedDay && isSameDay(expandedDay, date);
    
    return (
      <Box key={date.toISOString()} sx={{ mb: 1 }}>
        <Paper
          elevation={isExpanded ? 3 : 1}
          sx={{
            borderLeft: isToday ? `4px solid ${theme.palette.primary.main}` : 
                      isPastDate ? `4px solid ${theme.palette.error.main}` : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <ListItem 
            button 
            onClick={() => setExpandedDay(isExpanded ? null : date)}
            sx={{ 
              bgcolor: isToday ? 'primary.50' : 'background.paper',
              transition: 'background-color 0.2s ease'
            }}
          >
            <ListItemText
              primary={
                <Box display="flex" alignItems="center">
                  <Typography variant="subtitle1" sx={{ fontWeight: isToday ? 'bold' : 'normal' }}>
                    {formatDateWithDayOfWeekJP(date)}
                  </Typography>
                  {isToday && (
                    <Chip 
                      label="今日" 
                      color="primary" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                  {isPastDate && (
                    <Chip 
                      label="期限超過" 
                      color="error" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              }
              secondary={`${daySchedules.length}問`}
            />
            <ListItemSecondaryAction>
              {isExpanded ? <KeyboardArrowRightIcon /> : <KeyboardArrowLeftIcon />}
            </ListItemSecondaryAction>
          </ListItem>
          
          <Collapse in={isExpanded} timeout="auto">
            <Droppable droppableId={date.toISOString()}>
              {(provided) => (
                <List 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  dense
                  sx={{ 
                    p: 0,
                    bgcolor: 'background.paper',
                  }}
                >
                  {daySchedules.map((schedule, index) => {
                    const problem = getProblemById(schedule.problemId);
                    if (!problem) return null;
                    
                    return (
                      <Draggable 
                        key={schedule.problemId} 
                        draggableId={schedule.problemId} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <ListItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{ 
                              pl: 2,
                              pr: 6,
                              bgcolor: snapshot.isDragging ? 'primary.50' : 'transparent',
                              borderBottom: '1px solid #f0f0f0',
                              transition: 'background-color 0.2s ease'
                            }}
                            button
                            onClick={() => handleOpenProblemDialog(schedule.problemId)}
                          >
                            <ListItemText
                              primary={problem.number}
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {getSubjectById(problem.subjectId)?.name} / {getChapterById(problem.chapterId)?.name}
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                size="small"
                                {...provided.dragHandleProps}
                              >
                                <DragIndicatorIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </Collapse>
        </Paper>
      </Box>
    );
  };
  
  // 今日の問題数を取得
  const todayProblemsCount = getTodayProblems().length;
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap">
              <Tabs 
                value={viewMode} 
                onChange={handleChangeViewMode}
                variant={isMobile ? "fullWidth" : "standard"}
              >
                <Tab 
                  icon={<EventNoteIcon />} 
                  label="リスト" 
                  value={VIEW_MODES.LIST}
                />
                <Tab 
                  icon={<CalendarTodayIcon />} 
                  label="週表示" 
                  value={VIEW_MODES.WEEK}
                />
                {!isMobile && (
                  <Tab 
                    icon={<CalendarTodayIcon />} 
                    label="月表示" 
                    value={VIEW_MODES.MONTH}
                  />
                )}
              </Tabs>
              
              <Box display="flex" alignItems="center" mt={isMobile ? 2 : 0}>
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
            
            {isLoading && (
              <LinearProgress sx={{ mb: 2 }} />
            )}
            
            {/* リスト表示 */}
            {viewMode === VIEW_MODES.LIST && (
              <Box>
                {isMobile ? (
                  // モバイル用リスト表示
                  <Box>
                    {weekDates.map(date => renderMobileDayItem(date))}
                    
                    <Box display="flex" justifyContent="space-between" mt={2}>
                      <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={goToPrevious}
                      >
                        前の週
                      </Button>
                      <Button
                        endIcon={<ArrowForwardIcon />}
                        onClick={goToNext}
                      >
                        次の週
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  // デスクトップ用リスト表示
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>問題</TableCell>
                          <TableCell>科目・章</TableCell>
                          <TableCell>次回学習日</TableCell>
                          <TableCell align="center">間隔</TableCell>
                          <TableCell align="center">復習回数</TableCell>
                          <TableCell align="center">操作</TableCell>
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
                            <Draggable
                              key={schedule.problemId}
                              draggableId={schedule.problemId}
                              index={0} // リスト表示ではインデックスは重要ではない
                            >
                              {(provided, snapshot) => (
                                <TableRow 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  sx={{ 
                                    bgcolor: isToday ? 'primary.50' : 
                                            (isPastDue ? '#fff4f4' : 
                                            (snapshot.isDragging ? 'primary.100' : 'inherit')),
                                    transition: 'background-color 0.2s ease',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.hover' }
                                  }}
                                  onClick={() => handleOpenProblemDialog(problem.id)}
                                >
                                  <TableCell>
                                    <Box display="flex" alignItems="center">
                                      <Box {...provided.dragHandleProps} sx={{ mr: 1, cursor: 'grab' }}>
                                        <DragIndicatorIcon color="action" fontSize="small" />
                                      </Box>
                                      <Typography variant="body2">
                                        {problem.number}
                                      </Typography>
                                    </Box>
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
                                  <TableCell align="center">
                                    {getIntervalTextJP(schedule.currentInterval)}
                                  </TableCell>
                                  <TableCell align="center">
                                    {schedule.reviewCount}回
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton 
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenProblemDialog(problem.id);
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Draggable>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
            
            {/* 週表示 */}
            {viewMode === VIEW_MODES.WEEK && (
              <Box>
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center" 
                  mb={2}
                >
                  <Button 
                    variant="outlined" 
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={goToPrevious}
                  >
                    前の週
                  </Button>
                  <Typography variant="h6">
                    {formatDateJP(weekDates[0])} 〜 {formatDateJP(weekDates[6])}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={goToNext}
                  >
                    次の週
                  </Button>
                </Box>
                
                {isMobile ? (
                  // モバイル用週表示
                  <Box>
                    {weekDates.map(date => renderMobileDayItem(date))}
                  </Box>
                ) : (
                  // デスクトップ用週表示
                  <Zoom in={true} style={{ transitionDelay: '150ms' }}>
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
                            {weekDates.map(date => renderWeekDateCell(date))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Zoom>
                )}
              </Box>
            )}
            
            {/* 月表示 */}
            {viewMode === VIEW_MODES.MONTH && (
              <Box>
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center" 
                  mb={2}
                >
                  <Button 
                    variant="outlined" 
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={goToPrevious}
                  >
                    前月
                  </Button>
                  <Typography variant="h6">
                    {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={goToNext}
                  >
                    翌月
                  </Button>
                </Box>
                
                <Grow in={true} style={{ transformOrigin: '0 0 0' }}>
                  <TableContainer>
                    <Table size="small">
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
                        {monthDates.map((week, weekIndex) => (
                          <TableRow key={weekIndex}>
                            {week.map(date => {
                              const currentMonth = date.getMonth() === selectedDate.getMonth();
                              return renderMonthDateCell(date, currentMonth);
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grow>
              </Box>
            )}
          </Paper>
          
          {/* 問題編集ダイアログ */}
          <Dialog
            open={showProblemDialog}
            onClose={() => setShowProblemDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              問題スケジュールの詳細
              <IconButton
                aria-label="close"
                onClick={() => setShowProblemDialog(false)}
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
                  
                  {/* 進捗分析の表示 */}
                  {selectedProblem.history && selectedProblem.history.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle1" gutterBottom>
                        学習進捗分析
                      </Typography>
                      
                      {(() => {
                        const progressReport = generateProgressReport(
                          selectedProblem.problem.id, 
                          selectedProblem.history
                        );
                        
                        // トレンドに基づくカラーとアイコンを設定
                        let statusColor, trendText;
                        
                        switch (progressReport.trend) {
                          case 'improving':
                            statusColor = 'success.main';
                            trendText = '改善傾向';
                            break;
                          case 'declining':
                            statusColor = 'error.main';
                            trendText = '後退傾向';
                            break;
                          case 'stable':
                            statusColor = 'info.main';
                            trendText = '安定傾向';
                            break;
                          default:
                            statusColor = 'warning.main';
                            trendText = '不安定';
                        }
                        
                        return (
                          <Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" color={statusColor} fontWeight="bold">
                                {trendText}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={progressReport.understandingProgress}
                                sx={{ 
                                  flexGrow: 1, 
                                  height: 8, 
                                  borderRadius: 4
                                }}
                              />
                              <Typography variant="body2">
                                {progressReport.understandingProgress}%
                              </Typography>
                            </Box>
                            
                            <Alert 
                              severity={
                                progressReport.trend === 'improving' ? 'success' : 
                                progressReport.trend === 'declining' ? 'error' : 
                                'info'
                              }
                              sx={{ mt: 2 }}
                            >
                              {progressReport.recommendedAction}
                            </Alert>
                            
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2">
                                正答率: <strong>{progressReport.correctRate.toFixed(1)}%</strong>
                              </Typography>
                              <Typography variant="body2">
                                難易度: <strong>{Math.round(progressReport.difficulty * 100)}%</strong>
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })()}
                    </>
                  )}
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
              <IconButton
                aria-label="close"
                onClick={() => setShowFilterDialog(false)}
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
          
          {/* スナックバー通知 */}
          <Snackbar
            open={snackbarMessage.open}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSnackbar} severity={snackbarMessage.severity}>
              {snackbarMessage.message}
            </Alert>
          </Snackbar>
        </Container>
      </LocalizationProvider>
    </DragDropContext>
  );
};

export default ScheduleView;
