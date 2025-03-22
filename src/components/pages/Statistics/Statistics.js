// src/components/pages/Statistics/Statistics.js

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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import SubjectIcon from '@mui/icons-material/Subject';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import PieChartIcon from '@mui/icons-material/PieChart';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import { useApp } from '../../../contexts/AppContext';
import { formatDateJP, addDays, stripTime } from '../../../utils/dateUtils';
import { UnderstandingLevel } from '../../../models/types';

// タブのインデックス定義
const TABS = {
  OVERVIEW: 0,
  SUBJECTS: 1,
  PROGRESS: 2,
  CHAPTERS: 3
};

// 期間フィルターのオプション
const timeRangeOptions = [
  { value: 7, label: '直近7日間' },
  { value: 30, label: '直近30日間' },
  { value: 90, label: '直近3ヶ月' },
  { value: 0, label: 'すべての期間' },
];

// 色の定義
const COLORS = {
  SUBJECTS: ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57'],
  UNDERSTANDING: {
    [UnderstandingLevel.FULL]: '#4caf50',
    [UnderstandingLevel.PARTIAL]: '#ff9800',
    [UnderstandingLevel.NONE]: '#f44336',
    'unanswered': '#9e9e9e'
  }
};

const Statistics = () => {
  const {
    problems,
    subjects,
    chapters,
    history,
    getChapterById,
    getSubjectById,
    getHistoryForProblem,
    getProblemById
  } = useApp();

  // 状態管理
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [timeRange, setTimeRange] = useState(30); // デフォルトは30日間
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [chartType, setChartType] = useState('bar'); // デフォルトはバーチャート

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

  // チャートタイプ変更
  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // 指定期間内の履歴のみを取得
  const getFilteredHistory = () => {
    if (timeRange === 0) {
      return history; // すべての期間
    }

    const cutoffDate = addDays(new Date(), -timeRange);
    return history.filter(entry => new Date(entry.date) >= cutoffDate);
  };

  // 総合統計データを計算
  const calculateOverviewStats = () => {
    const filteredHistory = getFilteredHistory();
    const totalAnswered = filteredHistory.length;
    const correctAnswers = filteredHistory.filter(h => h.isCorrect).length;
    const correctRate = totalAnswered > 0 ? (correctAnswers / totalAnswered) * 100 : 0;

    // 理解度別の数
    const understandingCounts = {
      [UnderstandingLevel.FULL]: 0,
      [UnderstandingLevel.PARTIAL]: 0,
      [UnderstandingLevel.NONE]: 0,
      'unanswered': 0
    };

    // 問題ごとの最新の理解度を集計
    problems.forEach(problem => {
      const problemHistory = getHistoryForProblem(problem.id)
        .filter(h => timeRange === 0 || new Date(h.date) >= addDays(new Date(), -timeRange))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (problemHistory.length > 0) {
        understandingCounts[problemHistory[0].understandingLevel]++;
      } else {
        understandingCounts.unanswered++;
      }
    });

    return {
      totalProblems: problems.length,
      answeredProblems: new Set(filteredHistory.map(h => h.problemId)).size,
      totalAnswered,
      correctAnswers,
      correctRate,
      understandingCounts
    };
  };

  // 科目別の統計データを計算
  const calculateSubjectStats = () => {
    const filteredHistory = getFilteredHistory();
    const subjectStats = [];

    subjects.forEach(subject => {
      const subjectProblems = problems.filter(p => p.subjectId === subject.id);
      
      if (subjectProblems.length === 0) return;

      // この科目の履歴を取得
      const subjectHistory = filteredHistory.filter(h => 
        subjectProblems.some(p => p.id === h.problemId)
      );

      const answeredCount = subjectHistory.length;
      const correctCount = subjectHistory.filter(h => h.isCorrect).length;
      const correctRate = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;

      // 科目の問題数
      const totalProblems = subjectProblems.length;
      
      // 解答済みの問題数（ユニークなproblemId）
      const answeredProblems = new Set(subjectHistory.map(h => h.problemId)).size;

      // 理解度別の問題数
      const understandingCounts = {
        [UnderstandingLevel.FULL]: 0,
        [UnderstandingLevel.PARTIAL]: 0,
        [UnderstandingLevel.NONE]: 0
      };

      subjectProblems.forEach(problem => {
        const problemHistory = getHistoryForProblem(problem.id)
          .filter(h => timeRange === 0 || new Date(h.date) >= addDays(new Date(), -timeRange))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (problemHistory.length > 0) {
          understandingCounts[problemHistory[0].understandingLevel]++;
        }
      });

      subjectStats.push({
        id: subject.id,
        name: subject.name,
        totalProblems,
        answeredProblems,
        completionRate: totalProblems > 0 ? (answeredProblems / totalProblems) * 100 : 0,
        correctCount,
        answeredCount,
        correctRate,
        understandingCounts
      });
    });

    return subjectStats;
  };

  // 章別の統計データを計算
  const calculateChapterStats = () => {
    const filteredHistory = getFilteredHistory();
    const chapterStats = [];

    // 選択された科目のみの章を対象にする
    const targetChapters = selectedSubjectId === 'all' 
      ? chapters 
      : chapters.filter(chapter => chapter.subjectId === selectedSubjectId);

    targetChapters.forEach(chapter => {
      const chapterProblems = problems.filter(p => p.chapterId === chapter.id);
      
      if (chapterProblems.length === 0) return;

      // この章の履歴を取得
      const chapterHistory = filteredHistory.filter(h => 
        chapterProblems.some(p => p.id === h.problemId)
      );

      const answeredCount = chapterHistory.length;
      const correctCount = chapterHistory.filter(h => h.isCorrect).length;
      const correctRate = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;

      // 章の問題数
      const totalProblems = chapterProblems.length;
      
      // 解答済みの問題数（ユニークなproblemId）
      const answeredProblems = new Set(chapterHistory.map(h => h.problemId)).size;

      // 理解度別の問題数
      const understandingCounts = {
        [UnderstandingLevel.FULL]: 0,
        [UnderstandingLevel.PARTIAL]: 0,
        [UnderstandingLevel.NONE]: 0,
        'unanswered': 0
      };

      chapterProblems.forEach(problem => {
        const problemHistory = getHistoryForProblem(problem.id)
          .filter(h => timeRange === 0 || new Date(h.date) >= addDays(new Date(), -timeRange))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (problemHistory.length > 0) {
          understandingCounts[problemHistory[0].understandingLevel]++;
        } else {
          understandingCounts.unanswered++;
        }
      });

      chapterStats.push({
        id: chapter.id,
        name: chapter.name,
        subjectId: chapter.subjectId,
        subjectName: getSubjectById(chapter.subjectId)?.name || '',
        totalProblems,
        answeredProblems,
        completionRate: totalProblems > 0 ? (answeredProblems / totalProblems) * 100 : 0,
        correctCount,
        answeredCount,
        correctRate,
        understandingCounts
      });
    });

    return chapterStats.sort((a, b) => {
      // まず科目でソート
      if (a.subjectName !== b.subjectName) {
        return a.subjectName.localeCompare(b.subjectName);
      }
      // 次に章名でソート
      return a.name.localeCompare(b.name);
    });
  };

  // 日別の学習データを計算
  const calculateDailyStats = () => {
    const dailyStats = {};
    const filteredHistory = getFilteredHistory();
    
    // 日付範囲を生成（最新の日付から降順）
    const endDate = new Date();
    const startDate = timeRange === 0 
      ? new Date(Math.min(...filteredHistory.map(h => new Date(h.date)))) 
      : addDays(endDate, -timeRange);
    
    // 日付の範囲を生成
    const dateRange = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = formatDateJP(currentDate);
      dateRange.push(dateKey);
      dailyStats[dateKey] = {
        date: dateKey,
        totalAnswered: 0,
        correctAnswers: 0,
        correctRate: 0,
        understandingCounts: {
          [UnderstandingLevel.FULL]: 0,
          [UnderstandingLevel.PARTIAL]: 0,
          [UnderstandingLevel.NONE]: 0
        }
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 履歴データを日付ごとに集計
    filteredHistory.forEach(entry => {
      const dateKey = formatDateJP(new Date(entry.date));
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].totalAnswered++;
        if (entry.isCorrect) {
          dailyStats[dateKey].correctAnswers++;
        }
        dailyStats[dateKey].understandingCounts[entry.understandingLevel]++;
      }
    });
    
    // 正答率を計算
    Object.keys(dailyStats).forEach(date => {
      const stats = dailyStats[date];
      stats.correctRate = stats.totalAnswered > 0 
        ? (stats.correctAnswers / stats.totalAnswered) * 100 
        : 0;
    });
    
    // 配列に変換して返す（日付昇順）
    return dateRange.map(date => dailyStats[date]);
  };

  // データ計算
  const overviewStats = calculateOverviewStats();
  const subjectStats = calculateSubjectStats();
  const chapterStats = calculateChapterStats();
  const dailyStats = calculateDailyStats();

  // 円グラフ用のデータ
  const understandingPieData = [
    { name: '理解○', value: overviewStats.understandingCounts[UnderstandingLevel.FULL], color: COLORS.UNDERSTANDING[UnderstandingLevel.FULL] },
    { name: '曖昧△', value: overviewStats.understandingCounts[UnderstandingLevel.PARTIAL], color: COLORS.UNDERSTANDING[UnderstandingLevel.PARTIAL] },
    { name: '理解×', value: overviewStats.understandingCounts[UnderstandingLevel.NONE], color: COLORS.UNDERSTANDING[UnderstandingLevel.NONE] },
    { name: '未解答', value: overviewStats.understandingCounts.unanswered, color: COLORS.UNDERSTANDING.unanswered }
  ];

  // 科目別チャート用のデータ
  const subjectChartData = subjectStats.map((subject, index) => ({
    name: subject.name,
    正答率: subject.correctRate,
    解答済み率: subject.completionRate,
    理解度: (
      (subject.understandingCounts[UnderstandingLevel.FULL] * 100) + 
      (subject.understandingCounts[UnderstandingLevel.PARTIAL] * 50)
    ) / Math.max(1, subject.answeredProblems),
    color: COLORS.SUBJECTS[index % COLORS.SUBJECTS.length]
  }));

  // レーダーチャート用のデータ
  const radarData = subjectStats.map(subject => ({
    subject: subject.name,
    '正答率': subject.correctRate,
    '理解度': (
      (subject.understandingCounts[UnderstandingLevel.FULL] * 100) + 
      (subject.understandingCounts[UnderstandingLevel.PARTIAL] * 50)
    ) / Math.max(1, subject.answeredProblems),
    '解答済み率': subject.completionRate
  }));

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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        学習分析
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<BarChartIcon />} label="概要" value={TABS.OVERVIEW} />
          <Tab icon={<SubjectIcon />} label="科目別" value={TABS.SUBJECTS} />
          <Tab icon={<TimelineIcon />} label="学習進捗" value={TABS.PROGRESS} />
          <Tab icon={<CalendarViewMonthIcon />} label="章別" value={TABS.CHAPTERS} />
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
                {timeRangeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {activeTab === TABS.CHAPTERS && (
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
          )}
          
          {(activeTab === TABS.SUBJECTS || activeTab === TABS.CHAPTERS) && (
            <Grid item>
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={handleChartTypeChange}
                size="small"
              >
                <ToggleButton value="bar">
                  <BarChartIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="radar">
                  <RadioButtonCheckedIcon fontSize="small" />
                </ToggleButton>
                {activeTab === TABS.SUBJECTS && (
                  <ToggleButton value="pie">
                    <PieChartIcon fontSize="small" />
                  </ToggleButton>
                )}
              </ToggleButtonGroup>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* 概要タブ */}
      {activeTab === TABS.OVERVIEW && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title="学習概要" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        問題総数
                      </Typography>
                      <Typography variant="h6">
                        {overviewStats.totalProblems}問
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        解答済み問題数
                      </Typography>
                      <Typography variant="h6">
                        {overviewStats.answeredProblems}問 
                        ({Math.round(overviewStats.answeredProblems / overviewStats.totalProblems * 100)}%)
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        解答回数
                      </Typography>
                      <Typography variant="h6">
                        {overviewStats.totalAnswered}回
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        正答率
                      </Typography>
                      <Typography 
                        variant="h6" 
                        color={
                          overviewStats.correctRate >= 80 ? 'success.main' : 
                          overviewStats.correctRate >= 60 ? 'warning.main' : 'error.main'
                        }
                      >
                        {overviewStats.correctRate.toFixed(1)}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="理解度分布" />
                <CardContent>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={understandingPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {understandingPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardHeader title="日別学習状況" />
                <CardContent>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={dailyStats}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" orientation="left" label={{ value: '解答数', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: '正答率 (%)', angle: 90, position: 'insideRight' }} domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="totalAnswered" name="解答数" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="correctRate" name="正答率" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* 科目別タブ */}
      {activeTab === TABS.SUBJECTS && (
        <Box>
          <Card>
            <CardHeader title="科目別学習状況" />
            <CardContent>
              {subjectChartData.length > 0 ? (
                <Box>
                  {chartType === 'bar' && (
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={subjectChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis domain={[0, 100]} label={{ value: '（%）', angle: -90, position: 'insideLeft' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="正答率" name="正答率" fill="#8884d8" />
                          <Bar dataKey="解答済み率" name="解答済み率" fill="#82ca9d" />
                          <Bar dataKey="理解度" name="理解度" fill="#ffc658" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                  
                  {chartType === 'radar' && (
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar name="正答率" dataKey="正答率" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          <Radar name="理解度" dataKey="理解度" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                          <Radar name="解答済み率" dataKey="解答済み率" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                  
                  {chartType === 'pie' && (
                    <Box sx={{ height: 400 }}>
                      <Grid container>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" align="center" gutterBottom>
                            正答率
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={subjectStats.map((subject, index) => ({
                                  name: subject.name,
                                  value: subject.correctRate,
                                  color: COLORS.SUBJECTS[index % COLORS.SUBJECTS.length]
                                }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                              >
                                {subjectStats.map((subject, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS.SUBJECTS[index % COLORS.SUBJECTS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" align="center" gutterBottom>
                            解答済み率
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={subjectStats.map((subject, index) => ({
                                  name: subject.name,
                                  value: subject.completionRate,
                                  color: COLORS.SUBJECTS[index % COLORS.SUBJECTS.length]
                                }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                              >
                                {subjectStats.map((subject, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS.SUBJECTS[index % COLORS.SUBJECTS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography color="text.secondary" align="center">
                  表示するデータがありません
                </Typography>
              )}
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardHeader title="科目別詳細データ" />
            <CardContent sx={{ overflowX: 'auto' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>科目名</TableCell>
                      <TableCell align="center">問題数</TableCell>
                      <TableCell align="center">解答済み問題</TableCell>
                      <TableCell align="center">解答済み率</TableCell>
                      <TableCell align="center">正答率</TableCell>
                      <TableCell align="center">理解○</TableCell>
                      <TableCell align="center">曖昧△</TableCell>
                      <TableCell align="center">理解×</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjectStats.map(subject => (
                      <TableRow key={subject.id}>
                        <TableCell component="th" scope="row">
                          {subject.name}
                        </TableCell>
                        <TableCell align="center">{subject.totalProblems}</TableCell>
                        <TableCell align="center">{subject.answeredProblems}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={subject.completionRate} 
                                sx={{ height: 8, borderRadius: 5 }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {Math.round(subject.completionRate)}%
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography 
                            variant="body2" 
                            color={
                              subject.correctRate >= 80 ? 'success.main' : 
                              subject.correctRate >= 60 ? 'warning.main' : 'error.main'
                            }
                          >
                            {subject.correctRate.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={subject.understandingCounts[UnderstandingLevel.FULL]} 
                            size="small" 
                            color="success" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={subject.understandingCounts[UnderstandingLevel.PARTIAL]} 
                            size="small" 
                            color="warning" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={subject.understandingCounts[UnderstandingLevel.NONE]} 
                            size="small" 
                            color="error" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 進捗タブ */}
      {activeTab === TABS.PROGRESS && (
        <Box>
          <Card>
            <CardHeader title="日別学習状況" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-30} textAnchor="end" height={50} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalAnswered" name="解答数" stroke="#8884d8" />
                    <Line type="monotone" dataKey="correctAnswers" name="正解数" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardHeader title="理解度の推移" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-30} textAnchor="end" height={50} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="understandingCounts.full" name="理解○" stackId="a" fill={COLORS.UNDERSTANDING[UnderstandingLevel.FULL]} />
                    <Bar dataKey="understandingCounts.partial" name="曖昧△" stackId="a" fill={COLORS.UNDERSTANDING[UnderstandingLevel.PARTIAL]} />
                    <Bar dataKey="understandingCounts.none" name="理解×" stackId="a" fill={COLORS.UNDERSTANDING[UnderstandingLevel.NONE]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardHeader title="日別学習詳細" />
            <CardContent sx={{ overflowX: 'auto' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>日付</TableCell>
                      <TableCell align="center">解答数</TableCell>
                      <TableCell align="center">正解数</TableCell>
                      <TableCell align="center">正答率</TableCell>
                      <TableCell align="center">理解○</TableCell>
                      <TableCell align="center">曖昧△</TableCell>
                      <TableCell align="center">理解×</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyStats
                      .slice()
                      .reverse()
                      .filter(day => day.totalAnswered > 0)
                      .map(day => (
                        <TableRow key={day.date}>
                          <TableCell component="th" scope="row">
                            {day.date}
                          </TableCell>
                          <TableCell align="center">{day.totalAnswered}</TableCell>
                          <TableCell align="center">{day.correctAnswers}</TableCell>
                          <TableCell align="center">
                            <Typography 
                              variant="body2" 
                              color={
                                day.correctRate >= 80 ? 'success.main' : 
                                day.correctRate >= 60 ? 'warning.main' : 'error.main'
                              }
                            >
                              {day.correctRate.toFixed(1)}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {day.understandingCounts[UnderstandingLevel.FULL]}
                          </TableCell>
                          <TableCell align="center">
                            {day.understandingCounts[UnderstandingLevel.PARTIAL]}
                          </TableCell>
                          <TableCell align="center">
                            {day.understandingCounts[UnderstandingLevel.NONE]}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 章別タブ */}
      {activeTab === TABS.CHAPTERS && (
        <Box>
          {chartType === 'bar' && (
            <Card>
              <CardHeader 
                title="章別学習状況" 
                subheader={selectedSubjectId !== 'all' ? 
                  getSubjectById(selectedSubjectId)?.name : 'すべての科目'}
              />
              <CardContent>
                {chapterStats.length > 0 ? (
                  <Box sx={{ height: Math.max(400, chapterStats.length * 35) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chapterStats.map(chapter => ({
                          name: chapter.name,
                          正答率: chapter.correctRate,
                          解答済み率: chapter.completionRate
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" scale="band" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="正答率" name="正答率" fill="#8884d8" />
                        <Bar dataKey="解答済み率" name="解答済み率" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Typography color="text.secondary" align="center">
                    表示するデータがありません
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
          
          {chartType === 'radar' && (
            <Card>
              <CardHeader 
                title="章別理解度レーダー" 
                subheader={selectedSubjectId !== 'all' ? 
                  getSubjectById(selectedSubjectId)?.name : 'すべての科目（主要な章のみ）'}
              />
              <CardContent>
                {chapterStats.length > 0 ? (
                  <Box sx={{ height: 500 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart 
                        cx="50%" 
                        cy="50%" 
                        outerRadius="80%" 
                        data={chapterStats.slice(0, 8).map(chapter => ({
                          chapter: chapter.name,
                          正答率: chapter.correctRate,
                          解答済み率: chapter.completionRate,
                          理解度: (
                            (chapter.understandingCounts[UnderstandingLevel.FULL] * 100) + 
                            (chapter.understandingCounts[UnderstandingLevel.PARTIAL] * 50)
                          ) / Math.max(1, chapter.answeredProblems)
                        }))}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="chapter" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar name="正答率" dataKey="正答率" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        <Radar name="解答済み率" dataKey="解答済み率" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                        <Radar name="理解度" dataKey="理解度" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Typography color="text.secondary" align="center">
                    表示するデータがありません
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
          
          <Card sx={{ mt: 3 }}>
            <CardHeader title="章別詳細データ" />
            <CardContent sx={{ overflowX: 'auto' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>科目・章</TableCell>
                      <TableCell align="center">問題数</TableCell>
                      <TableCell align="center">解答済み</TableCell>
                      <TableCell align="center">解答済み率</TableCell>
                      <TableCell align="center">正答率</TableCell>
                      <TableCell align="center">理解度内訳</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chapterStats.map(chapter => (
                      <TableRow key={chapter.id}>
                        <TableCell component="th" scope="row">
                          <Typography variant="body2">
                            {chapter.subjectName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {chapter.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{chapter.totalProblems}</TableCell>
                        <TableCell align="center">{chapter.answeredProblems}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={chapter.completionRate} 
                                sx={{ height: 8, borderRadius: 5 }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {Math.round(chapter.completionRate)}%
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography 
                            variant="body2" 
                            color={
                              chapter.correctRate >= 80 ? 'success.main' : 
                              chapter.correctRate >= 60 ? 'warning.main' : 'error.main'
                            }
                          >
                            {chapter.correctRate.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Chip 
                              label={chapter.understandingCounts[UnderstandingLevel.FULL]} 
                              size="small" 
                              color="success" 
                            />
                            <Chip 
                              label={chapter.understandingCounts[UnderstandingLevel.PARTIAL]} 
                              size="small" 
                              color="warning" 
                            />
                            <Chip 
                              label={chapter.understandingCounts[UnderstandingLevel.NONE]} 
                              size="small" 
                              color="error" 
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
};

export default Statistics;
