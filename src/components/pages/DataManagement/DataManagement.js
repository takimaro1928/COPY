// src/components/pages/DataManagement/DataManagement.js

import React, { useState, useRef } from 'react';
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
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  Snackbar,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';

import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../../../contexts/AppContext';
import { 
  formatDateJP, 
  formatDateWithDayOfWeekJP, 
  getIntervalTextJP,
  stripTime,
  addDays
} from '../../../utils/dateUtils';
import { exportAllData, importAllData } from '../../../services/storageService';
import { INTERVALS } from '../../../services/scheduleService';

// タブのインデックス定義
const TABS = {
  IMPORT_EXPORT: 0,
  BULK_SCHEDULE: 1,
  ADD_PROBLEM: 2,
  RESET: 3
};

const intervalOptions = [
  { value: 0, label: '初回（今日）' },
  { value: 1, label: '1日後（明日）' },
  { value: INTERVALS.FIRST, label: '3日後' },
  { value: INTERVALS.SECOND, label: '1週間後' },
  { value: INTERVALS.THIRD, label: '2週間後' },
  { value: INTERVALS.FOURTH, label: '1ヶ月後' },
  { value: INTERVALS.FIFTH, label: '2ヶ月後' }
];

const DataManagement = () => {
  const {
    problems,
    subjects,
    chapters,
    getChapterById,
    getSubjectById,
    addProblem,
    setProblemsByChapter,
    setBulkSchedule,
    resetAllData
  } = useApp();

  // ファイルアップロード用のRef
  const fileInputRef = useRef(null);

  // 状態管理
  const [activeTab, setActiveTab] = useState(TABS.IMPORT_EXPORT);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [searchText, setSearchText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // 一括スケジュール設定の状態
  const [bulkScheduleSettings, setBulkScheduleSettings] = useState({
    date: stripTime(new Date()),
    interval: INTERVALS.FIRST,
    reviewCount: 0
  });
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [selectAllProblems, setSelectAllProblems] = useState(false);
  const [bulkScheduleSubjectFilter, setBulkScheduleSubjectFilter] = useState('all');
  const [bulkScheduleChapterFilter, setBulkScheduleChapterFilter] = useState('all');

  // 新規問題追加の状態
  const [newProblem, setNewProblem] = useState({
    subjectId: '',
    chapterId: '',
    number: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');

  // タブ切り替え
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // スナックバー表示
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // スナックバーを閉じる
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // エクスポート処理
  const handleExport = () => {
    const exportedData = exportAllData();
    setExportData(exportedData);
    showSnackbar('データのエクスポートが完了しました。');
  };

  // インポート処理
  const handleImport = () => {
    try {
      if (!importData) {
        showSnackbar('インポートするデータを入力してください。', 'error');
        return;
      }

      const success = importAllData(importData);
      if (success) {
        showSnackbar('データのインポートが完了しました。ページをリロードしてください。');
        setImportData('');
      } else {
        showSnackbar('インポート処理中にエラーが発生しました。', 'error');
      }
    } catch (error) {
      console.error('Import error:', error);
      showSnackbar('インポートに失敗しました。データ形式を確認してください。', 'error');
    }
  };

  // ファイルからインポート
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        setImportData(fileContent);
      } catch (error) {
        console.error('File reading error:', error);
        showSnackbar('ファイルの読み込みに失敗しました。', 'error');
      }
    };
    reader.readAsText(file);
  };

  // エクスポートデータのダウンロード
  const handleDownloadExport = () => {
    if (!exportData) {
      handleExport();
    }

    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_scheduler_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 全問題選択/解除
  const handleSelectAllProblems = (event) => {
    const checked = event.target.checked;
    setSelectAllProblems(checked);

    if (checked) {
      // フィルタリングに基づいて問題を選択
      const filteredProblems = problems.filter(problem => {
        const matchesSubject = bulkScheduleSubjectFilter === 'all' || problem.subjectId === bulkScheduleSubjectFilter;
        const matchesChapter = bulkScheduleChapterFilter === 'all' || problem.chapterId === bulkScheduleChapterFilter;
        return matchesSubject && matchesChapter;
      });
      setSelectedProblems(filteredProblems.map(p => p.id));
    } else {
      setSelectedProblems([]);
    }
  };

  // 個別問題の選択/解除
  const handleToggleProblem = (problemId) => {
    if (selectedProblems.includes(problemId)) {
      setSelectedProblems(selectedProblems.filter(id => id !== problemId));
    } else {
      setSelectedProblems([...selectedProblems, problemId]);
    }
  };

  // 科目フィルターの変更
  const handleBulkSubjectFilterChange = (event) => {
    const newSubjectId = event.target.value;
    setBulkScheduleSubjectFilter(newSubjectId);
    setBulkScheduleChapterFilter('all');
    
    // 選択状態をリセット
    setSelectedProblems([]);
    setSelectAllProblems(false);
  };

  // 章フィルターの変更
  const handleBulkChapterFilterChange = (event) => {
    setBulkScheduleChapterFilter(event.target.value);
    
    // 選択状態をリセット
    setSelectedProblems([]);
    setSelectAllProblems(false);
  };

  // 一括スケジュール設定
  const handleBulkSchedule = () => {
    if (selectedProblems.length === 0) {
      showSnackbar('問題が選択されていません。', 'warning');
      return;
    }

    setBulkSchedule(
      selectedProblems,
      bulkScheduleSettings.date,
      bulkScheduleSettings.interval
    );

    showSnackbar(`${selectedProblems.length}問のスケジュールを設定しました。`);
    
    // 選択状態をリセット
    setSelectedProblems([]);
    setSelectAllProblems(false);
  };

  // 新規問題の追加
  const handleAddProblem = () => {
    // 必須項目チェック
    if (!newProblem.subjectId || !newProblem.chapterId || !newProblem.number) {
      showSnackbar('すべての必須項目を入力してください。', 'error');
      return;
    }

    // 問題番号の重複チェック
    const isDuplicate = problems.some(p => 
      p.chapterId === newProblem.chapterId && p.number === newProblem.number
    );

    if (isDuplicate) {
      showSnackbar('同じ章内に同じ番号の問題が既に存在します。', 'error');
      return;
    }

    // 新規問題の作成
    const problem = {
      id: uuidv4(),
      subjectId: newProblem.subjectId,
      chapterId: newProblem.chapterId,
      number: newProblem.number,
      tags: newProblem.tags
    };

    addProblem(problem);
    showSnackbar('新しい問題を追加しました。');

    // 入力をクリア
    setNewProblem({
      subjectId: newProblem.subjectId, // 科目は維持
      chapterId: newProblem.chapterId, // 章は維持
      number: '',
      tags: []
    });
  };

  // タグの追加
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    // 重複チェック
    if (newProblem.tags.includes(newTag.trim())) {
      showSnackbar('同じタグが既に存在します。', 'warning');
      return;
    }
    
    setNewProblem({
      ...newProblem,
      tags: [...newProblem.tags, newTag.trim()]
    });
    setNewTag('');
  };

  // タグの削除
  const handleDeleteTag = (tagToDelete) => {
    setNewProblem({
      ...newProblem,
      tags: newProblem.tags.filter(tag => tag !== tagToDelete)
    });
  };

  // 新規問題の科目変更
  const handleNewProblemSubjectChange = (event) => {
    const subjectId = event.target.value;
    setNewProblem({
      ...newProblem,
      subjectId,
      chapterId: '' // 科目が変わったら章をリセット
    });
  };

  // データのリセット
  const handleResetData = () => {
    if (resetConfirmText !== 'RESET') {
      showSnackbar('確認テキストが正しくありません。', 'error');
      return;
    }

    resetAllData();
    setResetDialogOpen(false);
    showSnackbar('すべてのデータがリセットされました。ページをリロードしてください。');
  };

  // フィルタリングされた問題一覧を取得
  const getFilteredProblems = () => {
    return problems.filter(problem => {
      // 科目フィルター
      if (bulkScheduleSubjectFilter !== 'all' && problem.subjectId !== bulkScheduleSubjectFilter) {
        return false;
      }
      
      // 章フィルター
      if (bulkScheduleChapterFilter !== 'all' && problem.chapterId !== bulkScheduleChapterFilter) {
        return false;
      }
      
      // 検索フィルター
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        
        // 問題番号検索
        if (problem.number.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // 科目名検索
        const subject = getSubjectById(problem.subjectId);
        if (subject && subject.name.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // 章名検索
        const chapter = getChapterById(problem.chapterId);
        if (chapter && chapter.name.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        return false;
      }
      
      return true;
    });
  };

  // 特定の科目に属する章の一覧を取得
  const getChaptersBySubject = (subjectId) => {
    return chapters.filter(chapter => chapter.subjectId === subjectId);
  };

  const filteredProblems = getFilteredProblems();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          データ管理
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<UploadFileIcon />} label="インポート/エクスポート" value={TABS.IMPORT_EXPORT} />
            <Tab icon={<EventNoteIcon />} label="一括スケジュール設定" value={TABS.BULK_SCHEDULE} />
            <Tab icon={<AddIcon />} label="問題追加" value={TABS.ADD_PROBLEM} />
            <Tab icon={<SettingsBackupRestoreIcon />} label="リセット" value={TABS.RESET} />
          </Tabs>
        </Box>

        {/* インポート/エクスポートタブ */}
        {activeTab === TABS.IMPORT_EXPORT && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="データのエクスポート" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    現在のすべてのデータ（問題、スケジュール、学習履歴など）をJSONファイルとしてエクスポートします。
                    バックアップとして保存したり、別のデバイスにデータを移行する際に使用できます。
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleExport}
                    >
                      エクスポート
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadExport}
                      disabled={!exportData}
                    >
                      JSONファイルとしてダウンロード
                    </Button>
                  </Box>
                  
                  {exportData && (
                    <TextField
                      label="エクスポートデータ"
                      multiline
                      rows={6}
                      value={exportData}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardHeader title="データのインポート" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    エクスポートしたデータをインポートします。
                    <strong>注意：現在のデータはすべて上書きされます。</strong>
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<UploadFileIcon />}
                      onClick={() => fileInputRef.current.click()}
                      sx={{ mr: 2 }}
                    >
                      ファイルからインポート
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handleFileImport}
                    />
                    
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleImport}
                      disabled={!importData}
                    >
                      インポート実行
                    </Button>
                  </Box>
                  
                  <TextField
                    label="インポートするデータを入力またはファイルを選択"
                    multiline
                    rows={6}
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    fullWidth
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* 一括スケジュール設定タブ */}
        {activeTab === TABS.BULK_SCHEDULE && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="問題の一括スケジュール設定" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    複数の問題に対して一度にスケジュールを設定できます。
                    科目や章でフィルタリングし、対象の問題を選択してください。
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="bulk-subject-label">科目</InputLabel>
                          <Select
                            labelId="bulk-subject-label"
                            value={bulkScheduleSubjectFilter}
                            onChange={handleBulkSubjectFilterChange}
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
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="bulk-chapter-label">章</InputLabel>
                          <Select
                            labelId="bulk-chapter-label"
                            value={bulkScheduleChapterFilter}
                            onChange={handleBulkChapterFilterChange}
                            label="章"
                            disabled={bulkScheduleSubjectFilter === 'all'}
                          >
                            <MenuItem value="all">すべての章</MenuItem>
                            {bulkScheduleSubjectFilter !== 'all' && 
                              getChaptersBySubject(bulkScheduleSubjectFilter).map(chapter => (
                                <MenuItem key={chapter.id} value={chapter.id}>
                                  {chapter.name}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          variant="outlined"
                          placeholder="問題を検索..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    スケジュール設定
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
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
                    
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel id="interval-select-label">学習間隔</InputLabel>
                        <Select
                          labelId="interval-select-label"
                          value={bulkScheduleSettings.interval}
                          onChange={(e) => {
                            setBulkScheduleSettings(prev => ({
                              ...prev,
                              interval: Number(e.target.value)
                            }));
                          }}
                          label="学習間隔"
                        >
                          {intervalOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="既に解いた回数"
                        type="number"
                        InputProps={{ inputProps: { min: 0 } }}
                        value={bulkScheduleSettings.reviewCount}
                        onChange={(e) => {
                          setBulkScheduleSettings(prev => ({
                            ...prev,
                            reviewCount: Number(e.target.value)
                          }));
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      問題選択 ({selectedProblems.length} / {filteredProblems.length})
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectAllProblems}
                          onChange={handleSelectAllProblems}
                        />
                      }
                      label="すべて選択"
                    />
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 300, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox" width="50px">
                            <Checkbox
                              checked={selectAllProblems}
                              onChange={handleSelectAllProblems}
                            />
                          </TableCell>
                          <TableCell>問題番号</TableCell>
                          <TableCell>科目</TableCell>
                          <TableCell>章</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredProblems.map((problem) => (
                          <TableRow 
                            key={problem.id}
                            selected={selectedProblems.includes(problem.id)}
                            onClick={() => handleToggleProblem(problem.id)}
                            hover
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedProblems.includes(problem.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleProblem(problem.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell>{problem.number}</TableCell>
                            <TableCell>{getSubjectById(problem.subjectId)?.name || '不明'}</TableCell>
                            <TableCell>{getChapterById(problem.chapterId)?.name || '不明'}</TableCell>
                          </TableRow>
                        ))}
                        {filteredProblems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              表示する問題がありません
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<EventNoteIcon />}
                      onClick={handleBulkSchedule}
                      disabled={selectedProblems.length === 0}
                    >
                      {selectedProblems.length}問のスケジュールを一括設定
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* 問題追加タブ */}
        {activeTab === TABS.ADD_PROBLEM && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="新規問題の追加" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    新しい問題を登録します。必須項目を入力してください。
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel id="new-problem-subject-label">科目</InputLabel>
                        <Select
                          labelId="new-problem-subject-label"
                          value={newProblem.subjectId}
                          onChange={handleNewProblemSubjectChange}
                          label="科目 *"
                        >
                          {subjects.map(subject => (
                            <MenuItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required disabled={!newProblem.subjectId}>
                        <InputLabel id="new-problem-chapter-label">章</InputLabel>
                        <Select
                          labelId="new-problem-chapter-label"
                          value={newProblem.chapterId}
                          onChange={(e) => setNewProblem({
                            ...newProblem,
                            chapterId: e.target.value
                          })}
                          label="章 *"
                        >
                          {newProblem.subjectId && 
                            getChaptersBySubject(newProblem.subjectId).map(chapter => (
                              <MenuItem key={chapter.id} value={chapter.id}>
                                {chapter.name}
                              </MenuItem>
                            ))
                          }
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="問題番号"
                        value={newProblem.number}
                        onChange={(e) => setNewProblem({
                          ...newProblem,
                          number: e.target.value
                        })}
                        placeholder="例: 1-2-3"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        タグ（オプション）
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {newProblem.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            onDelete={() => handleDeleteTag(tag)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          label="新しいタグ"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleAddTag}
                          disabled={!newTag.trim()}
                        >
                          追加
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleAddProblem}
                      disabled={!newProblem.subjectId || !newProblem.chapterId || !newProblem.number}
                    >
                      問題を追加
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardHeader title="一括問題追加" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    章単位で複数の問題を一括追加できます。例えば、「1-1-1」から「1-1-10」までの問題を一度に登録できます。
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel id="bulk-add-subject-label">科目</InputLabel>
                        <Select
                          labelId="bulk-add-subject-label"
                          value={newProblem.subjectId}
                          onChange={handleNewProblemSubjectChange}
                          label="科目 *"
                        >
                          {subjects.map(subject => (
                            <MenuItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required disabled={!newProblem.subjectId}>
                        <InputLabel id="bulk-add-chapter-label">章</InputLabel>
                        <Select
                          labelId="bulk-add-chapter-label"
                          value={newProblem.chapterId}
                          onChange={(e) => setNewProblem({
                            ...newProblem,
                            chapterId: e.target.value
                          })}
                          label="章 *"
                        >
                          {newProblem.subjectId && 
                            getChaptersBySubject(newProblem.subjectId).map(chapter => (
                              <MenuItem key={chapter.id} value={chapter.id}>
                                {chapter.name} ({chapter.problemCount}問)
                              </MenuItem>
                            ))
                          }
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  
                  {newProblem.chapterId && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          const chapter = getChapterById(newProblem.chapterId);
                          if (!chapter) return;
                          
                          // 章の問題数に基づいて問題を一括生成
                          const problemsToAdd = [];
                          const chapterName = chapter.name;
                          const problemCount = chapter.problemCount;
                          
                          // 問題番号のプレフィックスを抽出 (例: "Q1-2" から "1-2")
                          let prefix = '';
                          if (chapterName.includes('Q')) {
                            prefix = chapterName.split('Q')[1].split(' ')[0].trim();
                          }
                          
                          for (let i = 1; i <= problemCount; i++) {
                            problemsToAdd.push({
                              id: uuidv4(),
                              subjectId: newProblem.subjectId,
                              chapterId: newProblem.chapterId,
                              number: `${prefix}-${i}`,
                              tags: []
                            });
                          }
                          
                          // 問題を一括追加
                          setProblemsByChapter(newProblem.chapterId, problemsToAdd);
                          showSnackbar(`${problemCount}問を一括追加しました。`);
                        }}
                      >
                        {getChapterById(newProblem.chapterId)?.problemCount || 0}問を一括追加
                      </Button>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        ※ 章に設定されている問題数に基づいて自動的に問題番号を生成します
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* リセットタブ */}
        {activeTab === TABS.RESET && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="データのリセット" 
                  titleTypographyProps={{ color: 'error' }}
                />
                <CardContent>
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2">注意: この操作は取り消せません</Typography>
                    <Typography variant="body2">
                      すべてのデータ（問題、スケジュール、学習履歴など）がリセットされます。
                      必要な場合は先にデータをエクスポートしてバックアップしてください。
                    </Typography>
                  </Alert>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setResetDialogOpen(true)}
                    >
                      データをリセット
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* リセット確認ダイアログ */}
        <Dialog
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>
            データをリセットしますか？
          </DialogTitle>
          <DialogContent>
            <DialogContentText paragraph>
              すべてのデータ（問題、スケジュール、学習履歴など）が完全に削除されます。
              この操作は取り消せません。
            </DialogContentText>
            <DialogContentText paragraph sx={{ fontWeight: 'bold' }}>
              確認のため、以下のテキストボックスに「RESET」と入力してください。
            </DialogContentText>
            <TextField
              fullWidth
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESET"
              variant="outlined"
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialogOpen(false)}>キャンセル</Button>
            <Button
              onClick={handleResetData}
              color="error"
              variant="contained"
              disabled={resetConfirmText !== 'RESET'}
            >
              リセットを実行
            </Button>
          </DialogActions>
        </Dialog>

        {/* スナックバー通知 */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default DataManagement;
