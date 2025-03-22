// src/components/pages/Search/SearchPage.js

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  IconButton,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useApp } from '../../../contexts/AppContext';
import { 
  formatDateJP, 
  formatDateWithDayOfWeekJP, 
  getIntervalTextJP,
  stripTime,
  addDays
} from '../../../utils/dateUtils';
import { UnderstandingLevel } from '../../../models/types';

// 問題ステータスのオプション
const PROBLEM_STATUS = {
  ALL: 'all',
  ANSWERED: 'answered',
  UNANSWERED: 'unanswered',
  SCHEDULED_TODAY: 'today',
  SCHEDULED_UPCOMING: 'upcoming',
  SCHEDULED_OVERDUE: 'overdue'
};

// 理解度のオプション
const UNDERSTANDING_LEVELS = [
  { value: UnderstandingLevel.FULL, label: '理解○', color: 'success' },
  { value: UnderstandingLevel.PARTIAL, label: '曖昧△', color: 'warning' },
  { value: UnderstandingLevel.NONE, label: '理解×', color: 'error' }
];

// ソートのオプション
const SORT_OPTIONS = [
  { value: 'subjectChapter', label: '科目・章順' },
  { value: 'number', label: '問題番号順' },
  { value: 'nextReviewDate', label: '次回学習日順' },
  { value: 'reviewCount', label: '復習回数順' },
  { value: 'correctRate', label: '正答率順' }
];

const SearchPage = () => {
  const {
    problems,
    schedules,
    subjects,
    chapters,
    history,
    getProblemById,
    getChapterById,
    getSubjectById,
    getHistoryForProblem,
    updateScheduleDate
  } = useApp();

  // 状態管理
  const [searchText, setSearchText] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [understandingLevels, setUnderstandingLevels] = useState([]);
  const [problemStatus, setProblemStatus] = useState(PROBLEM_STATUS.ALL);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [correctRateRange, setCorrectRateRange] = useState([0, 100]);
  const [reviewCountRange, setReviewCountRange] = useState([0, 10]);
  const [sortBy, setSortBy] = useState('subjectChapter');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [showFilterSummary, setShowFilterSummary] = useState(false);
  
  // 詳細ダイアログの状態
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // 初期化時にフィルター範囲を設定
  useEffect(() => {
    // 復習回数の最大値を取得
    const maxReviewCount = Math.max(
      1,
      ...schedules.map(schedule => schedule.reviewCount)
    );
    setReviewCountRange([0, maxReviewCount]);
  }, [schedules]);

  // 検索実行
  const handleSearch = () => {
    setIsSearching(true);
    setPage(0); // 検索実行時にページをリセット
    
    // 検索ロジックを非同期で実行（UI応答性を保つため）
    setTimeout(() => {
      const results = performSearch();
      setSearchResults(results);
      setIsSearching(false);
      
      // フィルター条件のサマリーを表示
      setShowFilterSummary(true);
    }, 100);
  };

  // 検索をリセット
  const handleResetSearch = () => {
    setSearchText('');
    setSelectedSubjects([]);
    setSelectedChapters([]);
    setUnderstandingLevels([]);
    setProblemStatus(PROBLEM_STATUS.ALL);
    setDateRange({ start: null, end: null });
    setCorrectRateRange([0, 100]);
    setReviewCountRange([0, Math.max(1, ...schedules.map(schedule => schedule.reviewCount))]);
    setSortBy('subjectChapter');
    setSortDirection('asc');
    setSearchResults([]);
    setShowFilterSummary(false);
    setAdvancedFiltersOpen(false);
  };

  // 検索ロジックの実装
  const performSearch = () => {
    let results = [...problems];
    
    // テキスト検索
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      results = results.filter(problem => {
        // 問題番号の検索
        if (problem.number.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // 科目名の検索
        const subject = getSubjectById(problem.subjectId);
        if (subject && subject.name.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // 章名の検索
        const chapter = getChapterById(problem.chapterId);
        if (chapter && chapter.name.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // タグの検索
        if (problem.tags && problem.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
          return true;
        }
        
        return false;
      });
    }
    
    // 科目フィルター
    if (selectedSubjects.length > 0) {
      results = results.filter(problem => selectedSubjects.includes(problem.subjectId));
    }
    
    // 章フィルター
    if (selectedChapters.length > 0) {
      results = results.filter(problem => selectedChapters.includes(problem.chapterId));
    }
    
    // 理解度フィルター
    if (understandingLevels.length > 0) {
      results = results.filter(problem => {
        const problemHistory = getHistoryForProblem(problem.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 履歴がない場合は除外
        if (problemHistory.length === 0) {
          return false;
        }
        
        // 最新の理解度を取得
        const latestUnderstanding = problemHistory[0].understandingLevel;
        return understandingLevels.includes(latestUnderstanding);
      });
    }
    
    // 問題ステータスフィルター
    if (problemStatus !== PROBLEM_STATUS.ALL) {
      const today = stripTime(new Date());
      
      switch (problemStatus) {
        case PROBLEM_STATUS.ANSWERED:
          results = results.filter(problem => {
            return getHistoryForProblem(problem.id).length > 0;
          });
          break;
        case PROBLEM_STATUS.UNANSWERED:
          results = results.filter(problem => {
            return getHistoryForProblem(problem.id).length === 0;
          });
          break;
        case PROBLEM_STATUS.SCHEDULED_TODAY:
          results = results.filter(problem => {
            const schedule = schedules.find(s => s.problemId === problem.id);
            if (!schedule) return false;
            
            const scheduleDate = stripTime(new Date(schedule.nextReviewDate));
            return scheduleDate.getTime() === today.getTime();
          });
          break;
        case PROBLEM_STATUS.SCHEDULED_UPCOMING:
          results = results.filter(problem => {
            const schedule = schedules.find(s => s.problemId === problem.id);
            if (!schedule) return false;
            
            const scheduleDate = stripTime(new Date(schedule.nextReviewDate));
            return scheduleDate > today;
          });
          break;
        case PROBLEM_STATUS.SCHEDULED_OVERDUE:
          results = results.filter(problem => {
            const schedule = schedules.find(s => s.problemId === problem.id);
            if (!schedule) return false;
            
            const scheduleDate = stripTime(new Date(schedule.nextReviewDate));
            return scheduleDate < today;
          });
          break;
        default:
          break;
      }
    }
    
    // 日付範囲フィルター
    if (dateRange.start || dateRange.end) {
      results = results.filter(problem => {
        const schedule = schedules.find(s => s.problemId === problem.id);
        if (!schedule) return false;
        
        const scheduleDate = stripTime(new Date(schedule.nextReviewDate));
        
        if (dateRange.start && dateRange.end) {
          return scheduleDate >= dateRange.start && scheduleDate <= dateRange.end;
        } else if (dateRange.start) {
          return scheduleDate >= dateRange.start;
        } else if (dateRange.end) {
          return scheduleDate <= dateRange.end;
        }
        
        return true;
      });
    }
    
    // 正答率範囲フィルター
    if (correctRateRange[0] > 0 || correctRateRange[1] < 100) {
      results = results.filter(problem => {
        const problemHistory = getHistoryForProblem(problem.id);
        
        if (problemHistory.length === 0) {
          return correctRateRange[0] === 0; // 解答履歴がない場合、最小値が0の場合のみ含める
        }
        
        const correctCount = problemHistory.filter(h => h.isCorrect).length;
        const correctRate = (correctCount / problemHistory.length) * 100;
        
        return correctRate >= correctRateRange[0] && correctRate <= correctRateRange[1];
      });
    }
    
    // 復習回数範囲フィルター
    if (reviewCountRange[0] > 0 || reviewCountRange[1] < Math.max(1, ...schedules.map(s => s.reviewCount))) {
      results = results.filter(problem => {
        const schedule = schedules.find(s => s.problemId === problem.id);
        
        if (!schedule) {
          return reviewCountRange[0] === 0; // スケジュールがない場合、最小値が0の場合のみ含める
        }
        
        return schedule.reviewCount >= reviewCountRange[0] && schedule.reviewCount <= reviewCountRange[1];
      });
    }
    
    // ソート
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'subjectChapter':
          // 科目名でソート
          const subjectA = getSubjectById(a.subjectId)?.name || '';
          const subjectB = getSubjectById(b.subjectId)?.name || '';
          comparison = subjectA.localeCompare(subjectB);
          
          // 科目名が同じ場合は章名でソート
          if (comparison === 0) {
            const chapterA = getChapterById(a.chapterId)?.name || '';
            const chapterB = getChapterById(b.chapterId)?.name || '';
            comparison = chapterA.localeCompare(chapterB);
          }
          
          // 章名も同じ場合は問題番号でソート
          if (comparison === 0) {
            comparison = a.number.localeCompare(b.number, undefined, { numeric: true });
          }
          break;
        
        case 'number':
          comparison = a.number.localeCompare(b.number, undefined, { numeric: true });
          break;
        
        case 'nextReviewDate':
          const scheduleA = schedules.find(s => s.problemId === a.id);
          const scheduleB = schedules.find(s => s.problemId === b.id);
          
          // スケジュールがない場合は最後に表示
          if (!scheduleA && !scheduleB) comparison = 0;
          else if (!scheduleA) comparison = 1;
          else if (!scheduleB) comparison = -1;
          else comparison = new Date(scheduleA.nextReviewDate) - new Date(scheduleB.nextReviewDate);
          break;
        
        case 'reviewCount':
          const countA = schedules.find(s => s.problemId === a.id)?.reviewCount || 0;
          const countB = schedules.find(s => s.problemId === b.id)?.reviewCount || 0;
          comparison = countA - countB;
          break;
        
        case 'correctRate':
          const historyA = getHistoryForProblem(a.id);
          const historyB = getHistoryForProblem(b.id);
          
          const rateA = historyA.length ? 
            (historyA.filter(h => h.isCorrect).length / historyA.length) * 100 : 0;
          
          const rateB = historyB.length ? 
            (historyB.filter(h => h.isCorrect).length / historyB.length) * 100 : 0;
            
          comparison = rateA - rateB;
          break;
        
        default:
          break;
      }
      
      // ソート方向の適用
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return results;
  };

  // 問題詳細ダイアログを開く
  const handleOpenDetailDialog = (problemId) => {
    const problem = getProblemById(problemId);
    const schedule = schedules.find(s => s.problemId === problemId);
    
    if (problem) {
      setSelectedProblem({
        problem,
        schedule,
        history: getHistoryForProblem(problemId)
      });
      setDetailDialogOpen(true);
    }
  };

  // 問題編集ダイアログを開く
  const handleOpenEditDialog = (problemId) => {
    const problem = getProblemById(problemId);
    const schedule = schedules.find(s => s.problemId === problemId);
    
    if (problem) {
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

  // 次回学習日の変更
  const handleUpdateScheduleDate = (newDate) => {
    if (selectedProblem && selectedProblem.problem) {
      updateScheduleDate(selectedProblem.problem.id, newDate);
      
      // 選択中の問題データを更新
      setSelectedProblem(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          nextReviewDate: newDate
        }
      }));
      
      // 検索結果を更新
      handleSearch();
    }
  };

  // ページング処理
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 1ページあたりの行数変更
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 実際に表示する行を取得
  const visibleRows = searchResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 正答率の計算
  const calculateCorrectRate = (problemId) => {
    const problemHistory = getHistoryForProblem(problemId);
    
    if (problemHistory.length === 0) {
      return null;
    }
    
    const correctCount = problemHistory.filter(h => h.isCorrect).length;
    return (correctCount / problemHistory.length) * 100;
  };

  // 最新の理解度を取得
  const getLatestUnderstanding = (problemId) => {
    const problemHistory = getHistoryForProblem(problemId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (problemHistory.length === 0) {
      return null;
    }
    
    return problemHistory[0].understandingLevel;
  };

  // フィルター条件のサマリーを生成
  const getFilterSummary = () => {
    const conditions = [];
    
    if (searchText.trim()) {
      conditions.push(`キーワード: "${searchText}"`);
    }
    
    if (selectedSubjects.length > 0) {
      const subjectNames = selectedSubjects.map(id => getSubjectById(id)?.name || id).join(', ');
      conditions.push(`科目: ${subjectNames}`);
    }
    
    if (selectedChapters.length > 0) {
      const chapterNames = selectedChapters.map(id => getChapterById(id)?.name || id).join(', ');
      conditions.push(`章: ${chapterNames}`);
    }
    
    if (understandingLevels.length > 0) {
      const levelNames = understandingLevels.map(level => {
        switch (level) {
          case UnderstandingLevel.FULL: return '理解○';
          case UnderstandingLevel.PARTIAL: return '曖昧△';
          case UnderstandingLevel.NONE: return '理解×';
          default: return level;
        }
      }).join(', ');
      conditions.push(`理解度: ${levelNames}`);
    }
    
    if (problemStatus !== PROBLEM_STATUS.ALL) {
      let statusText = '';
      switch (problemStatus) {
        case PROBLEM_STATUS.ANSWERED: statusText = '解答済み'; break;
        case PROBLEM_STATUS.UNANSWERED: statusText = '未解答'; break;
        case PROBLEM_STATUS.SCHEDULED_TODAY: statusText = '今日予定'; break;
        case PROBLEM_STATUS.SCHEDULED_UPCOMING: statusText = '今後予定'; break;
        case PROBLEM_STATUS.SCHEDULED_OVERDUE: statusText = '期限超過'; break;
        default: break;
      }
      conditions.push(`ステータス: ${statusText}`);
    }
    
    if (dateRange.start || dateRange.end) {
      let dateText = '';
      if (dateRange.start && dateRange.end) {
        dateText = `${formatDateJP(dateRange.start)} 〜 ${formatDateJP(dateRange.end)}`;
      } else if (dateRange.start) {
        dateText = `${formatDateJP(dateRange.start)} 以降`;
      } else if (dateRange.end) {
        dateText = `${formatDateJP(dateRange.end)} 以前`;
      }
      conditions.push(`学習予定日: ${dateText}`);
    }
    
    if (correctRateRange[0] > 0 || correctRateRange[1] < 100) {
      conditions.push(`正答率: ${correctRateRange[0]}% 〜 ${correctRateRange[1]}%`);
    }
    
    if (reviewCountRange[0] > 0 || reviewCountRange[1] < Math.max(1, ...schedules.map(s => s.reviewCount))) {
      conditions.push(`復習回数: ${reviewCountRange[0]}回 〜 ${reviewCountRange[1]}回`);
    }
    
    return conditions;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          問題検索
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="キーワード検索"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="問題番号、科目名、章名、タグなどで検索..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="problem-status-label">問題ステータス</InputLabel>
                  <Select
                    labelId="problem-status-label"
                    value={problemStatus}
                    onChange={(e) => setProblemStatus(e.target.value)}
                    label="問題ステータス"
                  >
                    <MenuItem value={PROBLEM_STATUS.ALL}>すべての問題</MenuItem>
                    <MenuItem value={PROBLEM_STATUS.ANSWERED}>解答済みの問題</MenuItem>
                    <MenuItem value={PROBLEM_STATUS.UNANSWERED}>未解答の問題</MenuItem>
                    <MenuItem value={PROBLEM_STATUS.SCHEDULED_TODAY}>今日解く問題</MenuItem>
                    <MenuItem value={PROBLEM_STATUS.SCHEDULED_UPCOMING}>今後予定の問題</MenuItem>
                    <MenuItem value={PROBLEM_STATUS.SCHEDULED_OVERDUE}>期限超過の問題</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                    fullWidth
                    startIcon={<SearchIcon />}
                  >
                    検索
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
                    fullWidth
                  >
                    詳細
                  </Button>
                </Box>
              </Grid>
            </Grid>
            
            <Accordion 
              expanded={advancedFiltersOpen} 
              onChange={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
              sx={{ mt: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>詳細検索オプション</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>科目</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {subjects.map(subject => (
                        <Chip
                          key={subject.id}
                          label={subject.name}
                          onClick={() => {
                            if (selectedSubjects.includes(subject.id)) {
                              setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                            } else {
                              setSelectedSubjects([...selectedSubjects, subject.id]);
                            }
                          }}
                          color={selectedSubjects.includes(subject.id) ? "primary" : "default"}
                          variant={selectedSubjects.includes(subject.id) ? "filled" : "outlined"}
                        />
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>理解度</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {UNDERSTANDING_LEVELS.map(level => (
                        <Chip
                          key={level.value}
                          label={level.label}
                          onClick={() => {
                            if (understandingLevels.includes(level.value)) {
                              setUnderstandingLevels(understandingLevels.filter(l => l !== level.value));
                            } else {
                              setUnderstandingLevels([...understandingLevels, level.value]);
                            }
                          }}
                          color={understandingLevels.includes(level.value) ? level.color : "default"}
                          variant={understandingLevels.includes(level.value) ? "filled" : "outlined"}
                        />
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>学習予定日</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <DatePicker
                          label="開始日"
                          value={dateRange.start}
                          onChange={(newDate) => {
                            setDateRange(prev => ({
                              ...prev,
                              start: newDate ? stripTime(newDate) : null
                            }));
                          }}
                          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <DatePicker
                          label="終了日"
                          value={dateRange.end}
                          onChange={(newDate) => {
                            setDateRange(prev => ({
                              ...prev,
                              end: newDate ? stripTime(newDate) : null
                            }));
                          }}
                          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      章
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      <FormGroup>
                        {chapters
                          .filter(chapter => !selectedSubjects.length || 
                                  selectedSubjects.includes(chapter.subjectId))
                          .map(chapter => (
                            <FormControlLabel
                              key={chapter.id}
                              control={
                                <Checkbox
                                  checked={selectedChapters.includes(chapter.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedChapters([...selectedChapters, chapter.id]);
                                    } else {
                                      setSelectedChapters(selectedChapters.filter(id => id !== chapter.id));
                                    }
                                  }}
                                  size="small"
                                />
                              }
                              label={
                                <Typography variant="body2">
                                  {getSubjectById(chapter.subjectId)?.name}: {chapter.name}
                                </Typography>
                              }
                            />
                          ))}
                      </FormGroup>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      正答率 ({correctRateRange[0]}% - {correctRateRange[1]}%)
                    </Typography>
                    <Slider
                      value={correctRateRange}
                      onChange={(e, newValue) => setCorrectRateRange(newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      復習回数 ({reviewCountRange[0]} - {reviewCountRange[1]}回)
                    </Typography>
                    <Slider
                      value={reviewCountRange}
                      onChange={(e, newValue) => setReviewCountRange(newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={Math.max(10, ...schedules.map(s => s.reviewCount))}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="sort-by-label">並び替え</InputLabel>
                      <Select
                        labelId="sort-by-label"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        label="並び替え"
                      >
                        {SORT_OPTIONS.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="sort-direction-label">並び順</InputLabel>
                      <Select
                        labelId="sort-direction-label"
                        value={sortDirection}
                        onChange={(e) => setSortDirection(e.target.value)}
                        label="並び順"
                      >
                        <MenuItem value="asc">昇順 (A→Z, 0→9)</MenuItem>
                        <MenuItem value="desc">降順 (Z→A, 9→0)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleResetSearch}
                    sx={{ mr: 1 }}
                  >
                    リセット
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                  >
                    検索
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Paper>
        
        {isSearching ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {showFilterSummary && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>
                  検索条件
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {getFilterSummary().map((condition, index) => (
                    <Chip key={index} label={condition} variant="outlined" />
                  ))}
                  {getFilterSummary().length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      条件なし（すべての問題）
                    </Typography>
                  )}
                </Box>
                <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {searchResults.length}件の結果
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleResetSearch}
                  >
                    クリア
                  </Button>
                </Box>
              </Box>
            )}
            
            {searchResults.length > 0 ? (
              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>問題番号</TableCell>
                        <TableCell>科目・章</TableCell>
                        <TableCell>学習予定日</TableCell>
                        <TableCell align="center">理解度</TableCell>
                        <TableCell align="center">正答率</TableCell>
                        <TableCell align="center">復習回数</TableCell>
                        <TableCell align="center">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visibleRows.map((problem) => {
                        const schedule = schedules.find(s => s.problemId === problem.id);
                        const understanding = getLatestUnderstanding(problem.id);
                        const correctRate = calculateCorrectRate(problem.id);
                        
                        return (
                          <TableRow 
                            key={problem.id}
                            sx={{ 
                              '&:hover': { bgcolor: 'action.hover' },
                              cursor: 'pointer'
                            }}
                            onClick={() => handleOpenDetailDialog(problem.id)}
                          >
                            <TableCell>
                              {problem.number}
                              {problem.tags && problem.tags.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {problem.tags.map((tag, index) => (
                                    <Chip 
                                      key={index} 
                                      label={tag} 
                                      size="small" 
                                      variant="outlined" 
                                      sx={{ height: 20, fontSize: '0.7rem' }} 
                                    />
                                  ))}
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {getSubjectById(problem.subjectId)?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getChapterById(problem.chapterId)?.name || 'Unknown'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {schedule ? (
                                <>
                                  {formatDateWithDayOfWeekJP(schedule.nextReviewDate)}
                                  {isSameDay(schedule.nextReviewDate, new Date()) && (
                                    <Chip 
                                      label="今日" 
                                      size="small" 
                                      color="primary" 
                                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                    />
                                  )}
                                  {isPast(schedule.nextReviewDate) && !isSameDay(schedule.nextReviewDate, new Date()) && (
                                    <Chip 
                                      label="期限超過" 
                                      size="small" 
                                      color="error" 
                                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                    />
                                  )}
                                </>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  未設定
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {understanding === UnderstandingLevel.FULL && (
                                <Chip label="理解○" size="small" color="success" />
                              )}
                              {understanding === UnderstandingLevel.PARTIAL && (
                                <Chip label="曖昧△" size="small" color="warning" />
                              )}
                              {understanding === UnderstandingLevel.NONE && (
                                <Chip label="理解×" size="small" color="error" />
                              )}
                              {understanding === null && (
                                <Typography variant="caption" color="text.secondary">
                                  未解答
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {correctRate !== null ? (
                                <Typography
                                  variant="body2"
                                  color={
                                    correctRate >= 80 ? 'success.main' : 
                                    correctRate >= 50 ? 'warning.main' : 'error.main'
                                  }
                                >
                                  {correctRate.toFixed(1)}%
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
                              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Tooltip title="詳細を表示">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDetailDialog(problem.id);
                                    }}
                                  >
                                    <InfoOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="学習日を変更">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditDialog(problem.id);
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  component="div"
                  count={searchResults.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="表示件数:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                />
              </Paper>
            ) : (
              showFilterSummary && (
                <Box textAlign="center" py={5}>
                  <Typography variant="body1" color="text.secondary">
                    検索条件に一致する問題はありません。
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={handleResetSearch}
                  >
                    検索条件をリセット
                  </Button>
                </Box>
              )
            )}
          </>
        )}
        
        {/* 問題詳細ダイアログ */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            問題詳細
            <IconButton
              aria-label="close"
              onClick={() => setDetailDialogOpen(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedProblem && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom>
                    問題 {selectedProblem.problem.number}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {getSubjectById(selectedProblem.problem.subjectId)?.name} &gt; {
                      getChapterById(selectedProblem.problem.chapterId)?.name
                    }
                  </Typography>
                  
                  {selectedProblem.problem.tags && selectedProblem.problem.tags.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {selectedProblem.problem.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" />
                      ))}
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="スケジュール情報" />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            次回学習日
                          </Typography>
                          <Typography variant="body1">
                            {selectedProblem.schedule ? formatDateWithDayOfWeekJP(selectedProblem.schedule.nextReviewDate) : '未設定'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            現在の間隔
                          </Typography>
                          <Typography variant="body1">
                            {selectedProblem.schedule ? getIntervalTextJP(selectedProblem.schedule.currentInterval) : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            前回の学習日
                          </Typography>
                          <Typography variant="body1">
                            {selectedProblem.schedule ? formatDateJP(selectedProblem.schedule.lastReviewDate) : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            復習回数
                          </Typography>
                          <Typography variant="body1">
                            {selectedProblem.schedule ? selectedProblem.schedule.reviewCount : 0}回
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Button
                        variant="outlined"
                        startIcon={<CalendarTodayIcon />}
                        onClick={() => {
                          setDetailDialogOpen(false);
                          handleOpenEditDialog(selectedProblem.problem.id);
                        }}
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        学習日を変更
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="解答状況" />
                    <CardContent>
                      {selectedProblem.history && selectedProblem.history.length > 0 ? (
                        <>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                解答回数
                              </Typography>
                              <Typography variant="body1">
                                {selectedProblem.history.length}回
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                正答率
                              </Typography>
                              <Typography 
                                variant="body1" 
                                color={
                                  calculateCorrectRate(selectedProblem.problem.id) >= 80 ? 'success.main' : 
                                  calculateCorrectRate(selectedProblem.problem.id) >= 50 ? 'warning.main' : 'error.main'
                                }
                              >
                                {calculateCorrectRate(selectedProblem.problem.id)?.toFixed(1) || 0}%
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                最新の解答日
                              </Typography>
                              <Typography variant="body1">
                                {formatDateJP(selectedProblem.history[0].date)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                最新の理解度
                              </Typography>
                              <Box sx={{ mt: 0.5 }}>
                                {getLatestUnderstanding(selectedProblem.problem.id) === UnderstandingLevel.FULL && (
                                  <Chip label="理解○" size="small" color="success" />
                                )}
                                {getLatestUnderstanding(selectedProblem.problem.id) === UnderstandingLevel.PARTIAL && (
                                  <Chip label="曖昧△" size="small" color="warning" />
                                )}
                                {getLatestUnderstanding(selectedProblem.problem.id) === UnderstandingLevel.NONE && (
                                  <Chip label="理解×" size="small" color="error" />
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                          
                          {/* 理解度の変化パターン分析 */}
                          {selectedProblem.history.length >= 2 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                理解度の変化
                              </Typography>
                              
                              {(() => {
                                const history = [...selectedProblem.history].sort((a, b) => 
                                  new Date(a.date) - new Date(b.date)
                                );
                                
                                // 理解度の変化を解析
                                let improvementCount = 0;
                                let declineCount = 0;
                                let stableCount = 0;
                                
                                for (let i = 1; i < history.length; i++) {
                                  const prev = history[i-1].understandingLevel;
                                  const curr = history[i].understandingLevel;
                                  
                                  if (
                                    (prev === UnderstandingLevel.NONE && curr === UnderstandingLevel.PARTIAL) ||
                                    (prev === UnderstandingLevel.PARTIAL && curr === UnderstandingLevel.FULL) ||
                                    (prev === UnderstandingLevel.NONE && curr === UnderstandingLevel.FULL)
                                  ) {
                                    improvementCount++;
                                  } else if (
                                    (prev === UnderstandingLevel.FULL && curr === UnderstandingLevel.PARTIAL) ||
                                    (prev === UnderstandingLevel.PARTIAL && curr === UnderstandingLevel.NONE) ||
                                    (prev === UnderstandingLevel.FULL && curr === UnderstandingLevel.NONE)
                                  ) {
                                    declineCount++;
                                  } else {
                                    stableCount++;
                                  }
                                }
                                
                                const total = improvementCount + declineCount + stableCount;
                                const improvementRate = total > 0 ? (improvementCount / total) * 100 : 0;
                                const declineRate = total > 0 ? (declineCount / total) * 100 : 0;
                                
                                let analysisText = '';
                                let severityColor = 'success.main';
                                
                                if (improvementRate > 50) {
                                  analysisText = '改善傾向';
                                  severityColor = 'success.main';
                                } else if (declineRate > 50) {
                                  analysisText = '後退傾向';
                                  severityColor = 'error.main';
                                } else if (history[history.length-1].understandingLevel === UnderstandingLevel.PARTIAL) {
                                  analysisText = '停滞傾向';
                                  severityColor = 'warning.main';
                                } else {
                                  analysisText = '混在パターン';
                                  severityColor = 'text.secondary';
                                }
                                
                                return (
                                  <Box>
                                    <Box display="flex" alignItems="center">
                                      <Typography variant="body2" color={severityColor} fontWeight="bold">
                                        {analysisText}
                                      </Typography>
                                      
                                      {improvementRate > 50 && (
                                        <TrendingUpIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                                      )}
                                      {declineRate > 50 && (
                                        <TrendingDownIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                                      )}
                                    </Box>
                                    
                                    <Box display="flex" alignItems="center" mt={1}>
                                      <Box sx={{ width: '100%', mr: 1 }}>
                                        <LinearProgress
                                          variant="buffer"
                                          value={improvementRate}
                                          valueBuffer={improvementRate + declineRate}
                                          sx={{ height: 8, borderRadius: 5 }}
                                        />
                                      </Box>
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">
                                          {Math.round(improvementRate)}%
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                );
                              })()}
                            </Box>
                          )}
                        </>
                      ) : (
                        <Alert severity="info">
                          この問題はまだ解答履歴がありません。
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {selectedProblem.history && selectedProblem.history.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      解答履歴
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>日付</TableCell>
                            <TableCell align="center">結果</TableCell>
                            <TableCell align="center">理解度</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedProblem.history
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map(entry => (
                              <TableRow key={entry.id}>
                                <TableCell>{formatDateJP(entry.date)}</TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={entry.isCorrect ? "正解" : "不正解"} 
                                    color={entry.isCorrect ? "success" : "error"} 
                                    size="small" 
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  {entry.understandingLevel === UnderstandingLevel.FULL && (
                                    <Chip label="理解○" size="small" color="success" />
                                  )}
                                  {entry.understandingLevel === UnderstandingLevel.PARTIAL && (
                                    <Chip label="曖昧△" size="small" color="warning" />
                                  )}
                                  {entry.understandingLevel === UnderstandingLevel.NONE && (
                                    <Chip label="理解×" size="small" color="error" />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>閉じる</Button>
          </DialogActions>
        </Dialog>
        
        {/* 問題編集ダイアログ */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            次回学習日の変更
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
                
                <Box sx={{ my: 3 }}>
                  <DatePicker
                    label="次回学習日"
                    value={selectedProblem.schedule?.nextReviewDate || new Date()}
                    onChange={handleUpdateScheduleDate}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>閉じる</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default SearchPage;
