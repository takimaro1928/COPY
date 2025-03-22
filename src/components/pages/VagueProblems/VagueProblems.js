// src/components/pages/VagueProblems/VagueProblems.js

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
  Divider,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap,
  LineChart,
  Line
} from 'recharts';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TimelineIcon from '@mui/icons-material/Timeline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useApp } from '../../../contexts/AppContext';
import {
  formatDateJP,
  formatDateWithDayOfWeekJP,
  getIntervalTextJP,
  addDays,
  getDaysBetween
} from '../../../utils/dateUtils';
import { UnderstandingLevel } from '../../../models/types';

// タブのインデックス定義
const TABS = {
  OVERVIEW: 0,
  PROBLEM_LIST: 1,
  TREND: 2,
  RECOMMENDATIONS: 3
};

// 色の定義
const COLORS = {
  UNDERSTANDING: {
    [UnderstandingLevel.FULL]: '#4caf50',
    [UnderstandingLevel.PARTIAL]: '#ff9800',
    [UnderstandingLevel.NONE]: '#f44336'
  },
  SUBJECTS: ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57']
};

const VagueProblems = () => {
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
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [timeRange, setTimeRange] = useState(30); // デフォルトは30日間
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // タブ切り替え
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 期間フィルター変更
  const handleTimeRangeChange = (event) => {
    setTimeRange(Number(event.target.value));
  };

  // 科目フィルター変更
  const handleSubjectChange = (event) => {
    setSelectedSubjectId(event.target.value);
  };

  // 編集ダイアログを開く
  const handleOpenEditDialog = (problemId) => {
    const problem = getProblemById(problemId);
    const schedule = schedules.find(s => s.problemId === problemId);
    
    if (problem && schedule) {
      setSelectedProblem({ problem, schedule });
      setEditDialogOpen(true);
    }
  };

  // 詳細ダイアログを開く
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
    }
  };

  // 曖昧な問題を抽出する
  const getVagueProblems = () => {
    const result = [];
    const cutoffDate = timeRange > 0 ? addDays(new Date(), -timeRange) : new Date(0);
    
    problems.forEach(problem => {
      const problemHistory = getHistoryForProblem(problem.id)
        .filter(h => new Date(h.date) >= cutoffDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // 履歴がある問題のみ対象
      if (problemHistory.length > 0) {
        const latestHistory = problemHistory[0];
        
        // 最新の理解度が「曖昧△」の問題を抽出
        if (latestHistory.understandingLevel === UnderstandingLevel.PARTIAL) {
          // 科目フィルタリング
          if (selectedSubjectId === 'all' || problem.subjectId === selectedSubjectId) {
            const schedule = schedules.find(s => s.problemId === problem.id);
            
            result.push({
              problem,
              schedule,
              latestHistory,
              allHistory: problemHistory
            });
          }
        }
      }
    });
    
    return result;
  };

  // 科目別の曖昧問題数を計算
  const calculateSubjectVagueStats = () => {
    const stats = {};
    const vagueProblems = getVagueProblems();
    
    subjects.forEach(subject => {
      const subjectProblems = problems.filter(p => p.subjectId === subject.id);
      const vagueSubjectProblems = vagueProblems.filter(item => item.problem.subjectId === subject.id);
      
      const answeredProblems = subjectProblems.filter(problem => {
        const problemHistory = getHistoryForProblem(problem.id);
        return problemHistory.length > 0;
      });
      
      stats[subject.id] = {
        total: subjectProblems.length,
        answered: answeredProblems.length,
        vague: vagueSubjectProblems.length,
        vagueRate: answeredProblems.length > 0 
          ? (vagueSubjectProblems.length / answeredProblems.length) * 100 
          : 0
      };
    });
    
    return stats;
  };

  // 章別の曖昧問題数を計算
  const calculateChapterVagueStats = () => {
    const stats = {};
    const vagueProblems = getVagueProblems();
    
    chapters.forEach(chapter => {
      // 科目フィルタリング
      if (selectedSubjectId === 'all' || chapter.subjectId === selectedSubjectId) {
        const chapterProblems = problems.filter(p => p.chapterId === chapter.id);
        const vagueChapterProblems = vagueProblems.filter(item => item.problem.chapterId === chapter.id);
        
        const answeredProblems = chapterProblems.filter(problem => {
          const problemHistory = getHistoryForProblem(problem.id);
          return problemHistory.length > 0;
        });
        
        stats[chapter.id] = {
          total: chapterProblems.length,
          answered: answeredProblems.length,
          vague: vagueChapterProblems.length,
          vagueRate: answeredProblems.length > 0 
            ? (vagueChapterProblems.length / answeredProblems.length) * 100 
            : 0
        };
      }
    });
    
    return stats;
  };

  // 曖昧問題の時系列変化を計算
  const calculateVagueTrends = () => {
    const trends = {};
    const endDate = new Date();
    const startDate = timeRange > 0 ? addDays(endDate, -timeRange) : new Date(Math.min(...history.map(h => new Date(h.date))));
    
    // 日付範囲を生成
    const dateRange = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = formatDateJP(currentDate);
      dateRange.push(dateStr);
      trends[dateStr] = {
        date: dateStr,
        vagueCount: 0,
        fullCount: 0,
        noneCount: 0,
        totalCount: 0
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 日付ごとに理解度を集計
    history.forEach(entry => {
      const dateStr = formatDateJP(new Date(entry.date));
      if (trends[dateStr]) {
        trends[dateStr].totalCount++;
        
        switch (entry.understandingLevel) {
          case UnderstandingLevel.FULL:
            trends[dateStr].fullCount++;
            break;
          case UnderstandingLevel.PARTIAL:
            trends[dateStr].vagueCount++;
            break;
          case UnderstandingLevel.NONE:
            trends[dateStr].noneCount++;
            break;
          default:
            break;
        }
      }
    });
    
    // 割合に変換
    Object.keys(trends).forEach(date => {
      const data = trends[date];
      data.vagueRate = data.totalCount > 0 ? (data.vagueCount / data.totalCount) * 100 : 0;
      data.fullRate = data.totalCount > 0 ? (data.fullCount / data.totalCount) * 100 : 0;
      data.noneRate = data.totalCount > 0 ? (data.noneCount / data.totalCount) * 100 : 0;
    });
    
    return Object.values(trends);
  };

  // 復習推奨リストを生成
  const getRecommendedReviewList = () => {
    const vagueProblems = getVagueProblems();
    
    // 以下の条件で問題をソート
    // 1. 長期間「曖昧△」状態が続いている問題（複数回「曖昧△」と評価されている）
    // 2. 次回復習日が近いもの
    // 3. 理解度が低いもの
    
    const scoredProblems = vagueProblems.map(item => {
      // 「曖昧△」評価の回数
      const vagueCount = item.allHistory.filter(h => 
        h.understandingLevel === UnderstandingLevel.PARTIAL
      ).length;
      
      // 「理解×」評価の回数
      const noneCount = item.allHistory.filter(h => 
        h.understandingLevel === UnderstandingLevel.NONE
      ).length;
      
      // 初めて「曖昧△」と評価されてからの経過日数
      const firstVagueEntry = item.allHistory
        .filter(h => h.understandingLevel === UnderstandingLevel.PARTIAL)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      
      const daysSinceFirstVague = firstVagueEntry 
        ? getDaysBetween(new Date(firstVagueEntry.date), new Date()) 
        : 0;
      
      // 次回復習日までの日数（負の値なら過去の日付）
      const daysToNextReview = item.schedule 
        ? getDaysBetween(new Date(), new Date(item.schedule.nextReviewDate)) * (new Date() > new Date(item.schedule.nextReviewDate) ? -1 : 1)
        : 0;
      
      // スコア計算（値が大きいほど優先度が高い）
      const score = (vagueCount * 5) + (noneCount * 3) + (daysSinceFirstVague / 10) - (daysToNextReview * 2);
      
      return {
        ...item,
        vagueCount,
        noneCount,
        daysSinceFirstVague,
        daysToNextReview,
        score
      };
    });
    
    // スコアの降順にソート
    return scoredProblems.sort((a, b) => b.score - a.score);
  };

  // データ計算
  const vagueProblems = getVagueProblems();
  const subjectStats = calculateSubjectVagueStats();
  const chapterStats = calculateChapterVagueStats();
  const trendData = calculateVagueTrends();
  const recommendedProblems = getRecommendedReviewList();

  // ツリーマップ用データ
  const treeMapData = Object.entries(subjectStats).map(([subjectId, stats]) => {
    const subject = getSubjectById(subjectId);
    return {
      name: subject ? subject.name : 'Unknown',
      size: stats.vague,
      vagueRate: stats.vagueRate,
      color: stats.vagueRate > 50 ? '#f44336' : 
             stats.vagueRate > 30 ? '#ff9800' : '#4caf50'
    };
  }).filter(item => item.size > 0);

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, boxShadow: 2 }}>
          <Typography variant="subtitle2">{label}</Typography>
          {payload.map((entry, index) => (
            <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  mr: 1,
                  borderRadius: '50%'
                }}
              />
              <Typography variant="body2">
                {entry.name}: {entry.value.toFixed(1)}%
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          曖昧な問題
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<InfoIcon />} label="概要" value={TABS.OVERVIEW} />
            <Tab icon={<CalendarTodayIcon />} label="曖昧問題一覧" value={TABS.PROBLEM_LIST} />
            <Tab icon={<TimelineIcon />} label="推移" value={TABS.TREND} />
            <Tab icon={<PriorityHighIcon />} label="復習推奨" value={TABS.RECOMMENDATIONS} />
          </Tabs>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="time-range-select-label">期間</InputLabel>
                <Select
                  labelId="time-range-select-label"
                  id="time-range-select"
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  label="期間"
                >
                  <MenuItem value={7}>直近7日間</MenuItem>
                  <MenuItem value={30}>直近30日間</MenuItem>
                  <MenuItem value={90}>直近3ヶ月</MenuItem>
                  <MenuItem value={0}>すべての期間</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="subject-select-label">科目</InputLabel>
                <Select
                  labelId="subject-select-label"
                  id="subject-select"
                  value={selectedSubjectId}
                  onChange={handleSubjectChange}
                  label="科目"
                >
                  <MenuItem value="all">すべての科目</MenuItem>
                  {subjects.map(subject => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* 概要タブ */}
        {activeTab === TABS.OVERVIEW && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="曖昧と評価された問題数" />
                  <CardContent>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Typography variant="h3" color="warning.main">
                        {vagueProblems.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        問題
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" paragraph>
                      科目別の曖昧問題数上位:
                    </Typography>
                    
                    {Object.entries(subjectStats)
                      .sort((a, b) => b[1].vague - a[1].vague)
                      .slice(0, 3)
                      .map(([subjectId, stats]) => {
                        const subject = getSubjectById(subjectId);
                        if (!subject || stats.vague === 0) return null;
                        
                        return (
                          <Box key={subjectId} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              {subject.name}: <strong>{stats.vague}</strong>問
                              {stats.answered > 0 && (
                                <Typography 
                                  component="span" 
                                  variant="body2" 
                                  color={stats.vagueRate > 50 ? 'error.main' : 'text.secondary'}
                                  sx={{ ml: 1 }}
                                >
                                  ({stats.vagueRate.toFixed(1)}%)
                                </Typography>
                              )}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={stats.vagueRate} 
                              color="warning"
                              sx={{ height: 6, borderRadius: 3, mt: 0.5 }} 
                            />
                          </Box>
                        );
                      })}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="科目別曖昧問題分布" />
                  <CardContent>
                    {treeMapData.length > 0 ? (
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <Treemap
                            data={treeMapData}
                            dataKey="size"
                            ratio={4/3}
                            stroke="#fff"
                            fill="#8884d8"
                            content={({ root, depth, x, y, width, height, index, payload, colors, rank, name }) => {
                              return (
                                <g>
                                  <rect
                                    x={x}
                                    y={y}
                                    width={width}
                                    height={height}
                                    style={{
                                      fill: treeMapData[index].color,
                                      stroke: '#fff',
                                      strokeWidth: 2 / (depth + 1e-10),
                                      strokeOpacity: 1 / (depth + 1e-10),
                                    }}
                                  />
                                  {width > 50 && height > 30 && (
                                    <text
                                      x={x + width / 2}
                                      y={y + height / 2 + 7}
                                      textAnchor="middle"
                                      fill="#fff"
                                      fontSize={14}
                                    >
                                      {name}
                                    </text>
                                  )}
                                  {width > 50 && height > 50 && (
                                    <text
                                      x={x + width / 2}
                                      y={y + height / 2 - 7}
                                      textAnchor="middle"
                                      fill="#fff"
                                      fontSize={16}
                                      fontWeight="bold"
                                    >
                                      {payload.size}
                                    </text>
                                  )}
                                </g>
                              );
                            }}
                          />
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Typography color="text.secondary" align="center" sx={{ py: 5 }}>
                        データがありません
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="曖昧問題の推移" />
                  <CardContent>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trendData.filter((_, index) => index % Math.max(1, Math.floor(trendData.length / 30)) === 0)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            angle={-45} 
                            textAnchor="end" 
                            height={60}
                            interval={Math.max(1, Math.floor(trendData.length / 10) - 1)}
                          />
                          <YAxis domain={[0, 100]} label={{ value: '割合 (%)', angle: -90, position: 'insideLeft' }} />
                          <RechartsTooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="vagueRate" 
                            name="曖昧△" 
                            stroke={COLORS.UNDERSTANDING[UnderstandingLevel.PARTIAL]} 
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="fullRate" 
                            name="理解○" 
                            stroke={COLORS.UNDERSTANDING[UnderstandingLevel.FULL]} 
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="noneRate" 
                            name="理解×" 
                            stroke={COLORS.UNDERSTANDING[UnderstandingLevel.NONE]} 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* 曖昧問題一覧タブ */}
        {activeTab === TABS.PROBLEM_LIST && (
          <Box>
            <Card>
              <CardHeader 
                title="曖昧と評価された問題一覧" 
                action={
                  <Typography variant="body2" color="text.secondary">
                    {vagueProblems.length}問
                  </Typography>
                }
              />
              <CardContent>
                {vagueProblems.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>問題番号</TableCell>
                          <TableCell>科目・章</TableCell>
                          <TableCell>次回学習日</TableCell>
                          <TableCell align="center">解答回数</TableCell>
                          <TableCell align="center">操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {vagueProblems.map(item => {
                          const { problem, schedule, latestHistory } = item;
                          const chapter = getChapterById(problem.chapterId);
                          const subject = getSubjectById(problem.subjectId);
                          
                          return (
                            <TableRow key={problem.id}>
                              <TableCell>{problem.number}</TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {subject ? subject.name : 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {chapter ? chapter.name : 'Unknown'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {schedule ? formatDateWithDayOfWeekJP(schedule.nextReviewDate) : '未設定'}
                              </TableCell>
                              <TableCell align="center">
                                {schedule ? schedule.reviewCount : 0}回
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <Tooltip title="詳細を表示">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleOpenDetailDialog(problem.id)}
                                    >
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="次回学習日を変更">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleOpenEditDialog(problem.id)}
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
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 5 }}>
                    「曖昧△」と評価された問題はありません
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardHeader title="科目・章別の曖昧問題分布" />
              <CardContent>
                {Object.entries(subjectStats)
                  .filter(([subjectId, stats]) => stats.vague > 0)
                  .sort((a, b) => b[1].vague - a[1].vague)
                  .map(([subjectId, stats]) => {
                    const subject = getSubjectById(subjectId);
                    if (!subject) return null;
                    
                    // この科目に属する章
                    const subjectChapters = chapters.filter(c => c.subjectId === subjectId);
                    const hasVagueChapters = subjectChapters.some(
                      chapter => chapterStats[chapter.id]?.vague > 0
                    );
                    
                    return (
                      <Box key={subjectId} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {subject.name} 
                          <Typography 
                            component="span" 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ ml: 1 }}
                          >
                            ({stats.vague}問 / {stats.vagueRate.toFixed(1)}%)
                          </Typography>
                        </Typography>
                        
                        {hasVagueChapters ? (
                          subjectChapters
                            .filter(chapter => chapterStats[chapter.id]?.vague > 0)
                            .sort((a, b) => (chapterStats[b.id]?.vague || 0) - (chapterStats[a.id]?.vague || 0))
                            .map(chapter => {
                              const chapterStat = chapterStats[chapter.id];
                              if (!chapterStat || chapterStat.vague === 0) return null;
                              
                              return (
                                <Box key={chapter.id} sx={{ ml: 2, mb: 1 }}>
                                  <Typography variant="body2">
                                    {chapter.name}: <strong>{chapterStat.vague}</strong>問
                                    {chapterStat.answered > 0 && (
                                      <Typography 
                                        component="span" 
                                        variant="body2" 
                                        color={chapterStat.vagueRate > 50 ? 'error.main' : 'text.secondary'}
                                        sx={{ ml: 1 }}
                                      >
                                        ({chapterStat.vagueRate.toFixed(1)}%)
                                      </Typography>
                                    )}
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={chapterStat.vagueRate} 
                                    color={chapterStat.vagueRate > 50 ? "error" : "warning"}
                                    sx={{ height: 4, borderRadius: 2, mt: 0.5, mb: 1 }} 
                                  />
                                </Box>
                              );
                            })
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            詳細データなし
                          </Typography>
                        )}
                        
                        <Divider sx={{ mt: 1, mb: 2 }} />
                      </Box>
                    );
                  })}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* 推移タブ */}
        {activeTab === TABS.TREND && (
          <Box>
            <Card>
              <CardHeader title="理解度の推移" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData.filter((_, index) => index % Math.max(1, Math.floor(trendData.length / 30)) === 0)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        interval={Math.max(1, Math.floor(trendData.length / 10) - 1)}
                      />
                      <YAxis domain={[0, 100]} label={{ value: '割合 (%)', angle: -90, position: 'insideLeft' }} />
                      <RechartsTooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="vagueRate" 
                        name="曖昧△" 
                        stroke={COLORS.UNDERSTANDING[UnderstandingLevel.PARTIAL]} 
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="fullRate" 
                        name="理解○" 
                        stroke={COLORS.UNDERSTANDING[UnderstandingLevel.FULL]} 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="noneRate" 
                        name="理解×" 
                        stroke={COLORS.UNDERSTANDING[UnderstandingLevel.NONE]} 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
            
            <Card sx={{ mt: 3 }}>
              <CardHeader title="解答数と曖昧△評価の推移" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trendData.filter((_, index) => index % Math.max(1, Math.floor(trendData.length / 30)) === 0)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        interval={Math.max(1, Math.floor(trendData.length / 10) - 1)}
                      />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalCount" name="解答数" fill="#8884d8" />
                      <Bar yAxisId="left" dataKey="vagueCount" name="曖昧△の数" fill="#ff9800" />
                      <Line yAxisId="right" type="monotone" dataKey="vagueRate" name="曖昧△の割合 (%)" stroke="#ff9800" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
            
            <Card sx={{ mt: 3 }}>
              <CardHeader title="曖昧から理解への変化率" />
              <CardContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                  曖昧と評価された問題が次回学習時に「理解○」に変わった割合を表示します。
                  この割合が高いほど、効果的に学習できていることを示します。
                </Alert>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                  {vagueProblems.length > 0 ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4">
                        {Math.round(
                          vagueProblems.filter(item => {
                            const histories = item.allHistory;
                            if (histories.length < 2) return false;
                            
                            // 過去に「曖昧△」から「理解○」に変わった回数を計算
                            let changes = 0;
                            let totalVague = 0;
                            
                            for (let i = 1; i < histories.length; i++) {
                              const prev = histories[i];
                              const curr = histories[i-1];
                              
                              if (prev.understandingLevel === UnderstandingLevel.PARTIAL) {
                                totalVague++;
                                if (curr.understandingLevel === UnderstandingLevel.FULL) {
                                  changes++;
                                }
                              }
                            }
                            
                            return totalVague > 0 && changes > 0;
                          }).length / Math.max(1, vagueProblems.length) * 100
                        )}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        曖昧△から理解○への変化率
                      </Typography>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">
                      データがありません
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* 復習推奨タブ */}
        {activeTab === TABS.RECOMMENDATIONS && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              長期間「曖昧△」状態が続いている問題を優先順に表示しています。
              効率的な復習のため、これらの問題を優先的に学習することをお勧めします。
            </Alert>
            
            <Card>
              <CardHeader title="復習推奨リスト" />
              <CardContent>
                {recommendedProblems.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>問題番号</TableCell>
                          <TableCell>科目・章</TableCell>
                          <TableCell align="center">優先度</TableCell>
                          <TableCell align="center">曖昧回数</TableCell>
                          <TableCell>次回学習日</TableCell>
                          <TableCell align="center">操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recommendedProblems.map((item, index) => {
                          const { problem, schedule, vagueCount, daysSinceFirstVague } = item;
                          const chapter = getChapterById(problem.chapterId);
                          const subject = getSubjectById(problem.subjectId);
                          
                          // 優先度を計算（0-100のスケール）
                          const priority = Math.min(100, Math.round(item.score * 5));
                          
                          return (
                            <TableRow key={problem.id}>
                              <TableCell>{problem.number}</TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {subject ? subject.name : 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {chapter ? chapter.name : 'Unknown'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ width: '100%', mr: 1 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={priority} 
                                      color={priority > 70 ? "error" : priority > 40 ? "warning" : "primary"}
                                      sx={{ height: 8, borderRadius: 5 }} 
                                    />
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {priority}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={vagueCount} 
                                  color={vagueCount > 3 ? "error" : "warning"} 
                                  size="small" 
                                />
                                {daysSinceFirstVague > 30 && (
                                  <Tooltip title={`${daysSinceFirstVague}日間 曖昧状態`}>
                                    <Chip 
                                      icon={<TimelineIcon />} 
                                      label="長期" 
                                      color="error" 
                                      size="small" 
                                      sx={{ ml: 0.5 }} 
                                    />
                                  </Tooltip>
                                )}
                              </TableCell>
                              <TableCell>
                                {schedule ? formatDateWithDayOfWeekJP(schedule.nextReviewDate) : '未設定'}
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <Tooltip title="詳細を表示">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleOpenDetailDialog(problem.id)}
                                    >
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="次回学習日を変更">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleOpenEditDialog(problem.id)}
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
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 5 }}>
                    「曖昧△」と評価された問題はありません
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

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

        {/* 問題詳細ダイアログ */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            問題の詳細
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
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      復習回数
                    </Typography>
                    <Typography variant="body1">
                      {selectedProblem.schedule?.reviewCount || 0}回
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      現在の間隔
                    </Typography>
                    <Typography variant="body1">
                      {selectedProblem.schedule ? getIntervalTextJP(selectedProblem.schedule.currentInterval) : '未設定'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      次回学習日
                    </Typography>
                    <Typography variant="body1">
                      {selectedProblem.schedule ? formatDateJP(selectedProblem.schedule.nextReviewDate) : '未設定'}
                    </Typography>
                  </Grid>
                </Grid>
                
                {selectedProblem.history && selectedProblem.history.length > 0 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      学習履歴
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>日付</TableCell>
                            <TableCell>結果</TableCell>
                            <TableCell>理解度</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedProblem.history
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map(entry => (
                              <TableRow key={entry.id}>
                                <TableCell>{formatDateJP(entry.date)}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={entry.isCorrect ? "正解" : "不正解"} 
                                    color={entry.isCorrect ? "success" : "error"} 
                                    size="small" 
                                  />
                                </TableCell>
                                <TableCell>
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
                    
                    {/* 理解度の変化パターン分析 */}
                    {selectedProblem.history.length >= 2 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          理解度の変化パターン
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
                          const stableRate = total > 0 ? (stableCount / total) * 100 : 0;
                          
                          let analysisText = '';
                          let severityColor = 'success.main';
                          
                          if (improvementRate > 50) {
                            analysisText = '改善傾向: この問題は正しい方向に進んでいます';
                            severityColor = 'success.main';
                          } else if (declineRate > 50) {
                            analysisText = '後退傾向: この問題は復習が必要です';
                            severityColor = 'error.main';
                          } else if (stableRate > 50 && history[history.length-1].understandingLevel === UnderstandingLevel.PARTIAL) {
                            analysisText = '停滞傾向: この問題は学習アプローチの変更が必要かもしれません';
                            severityColor = 'warning.main';
                          } else {
                            analysisText = '混在パターン: 学習状況が安定していません';
                            severityColor = 'warning.main';
                          }
                          
                          return (
                            <Box>
                              <Typography variant="body2" color={severityColor} sx={{ mb: 1 }}>
                                {analysisText}
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={4}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="success.main">
                                      改善: {Math.round(improvementRate)}%
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <TrendingUpIcon color="success" fontSize="small" />
                                      <Typography variant="body2" color="text.secondary">
                                        {improvementCount}回
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                <Grid item xs={4}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      維持: {Math.round(stableRate)}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {stableCount}回
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={4}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="error.main">
                                      後退: {Math.round(declineRate)}%
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <TrendingDownIcon color="error" fontSize="small" />
                                      <Typography variant="body2" color="text.secondary">
                                        {declineCount}回
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          );
                        })()}
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setDetailDialogOpen(false);
                if (selectedProblem && selectedProblem.problem) {
                  handleOpenEditDialog(selectedProblem.problem.id);
                }
              }}
            >
              学習日を変更
            </Button>
            <Button onClick={() => setDetailDialogOpen(false)}>閉じる</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default VagueProblems;
