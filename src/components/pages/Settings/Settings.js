// src/components/pages/Settings/Settings.js

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Divider,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormControlLabel,
  FormGroup,
  Switch,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemText,
  List,
  ListItem,
  ListItemIcon
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestoreIcon from '@mui/icons-material/Restore';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StorageIcon from '@mui/icons-material/Storage';
import { useApp } from '../../../contexts/AppContext';
import { exportAllData } from '../../../services/storageService';
import { INTERVALS } from '../../../services/scheduleService';

// タブのインデックス定義
const TABS = {
  GENERAL: 0,
  SCHEDULE: 1,
  DISPLAY: 2,
  DATA: 3
};

// デフォルトの暗記曲線パラメータ
const DEFAULT_INTERVALS = {
  INITIAL: 0,
  FIRST: 3,
  SECOND: 7,
  THIRD: 14,
  FOURTH: 30,
  FIFTH: 60
};

const Settings = () => {
  const { 
    initialSetupDone, 
    completeInitialSetup, 
    resetAllData
  } = useApp();

  // 状態管理
  const [activeTab, setActiveTab] = useState(TABS.GENERAL);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // 設定値
  const [settings, setSettings] = useState(() => {
    // ローカルストレージから設定を読み込む
    const savedSettings = localStorage.getItem('study_scheduler_settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      // 一般設定
      notifications: true,
      reminderTime: '20:00',
      autoStart: true,
      
      // スケジュール設定
      learningAlgorithm: 'default', // 'default', 'custom'
      intervals: { ...DEFAULT_INTERVALS },
      partialUnderstandingModifier: 0.5, // 曖昧△の場合の間隔修正係数
      wrongAnswerInterval: 1, // 不正解時の次回間隔（日数）
      
      // 表示設定
      darkMode: false,
      colorScheme: 'blue',
      fontSize: 'medium',
      compactView: false,
      
      // データ設定
      autoBackup: false,
      backupFrequency: 7, // 日数
      lastBackupDate: null
    };
  });

  // タブ切り替え
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 設定値の更新
  const updateSetting = (path, value) => {
    const pathParts = path.split('.');
    const newSettings = { ...settings };
    
    let current = newSettings;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    setSettings(newSettings);
    
    // ローカルストレージに保存
    localStorage.setItem('study_scheduler_settings', JSON.stringify(newSettings));
    
    // スナックバー表示
    setSnackbar({
      open: true,
      message: '設定を保存しました',
      severity: 'success'
    });
  };

  // 設定値のリセット
  const resetSettings = () => {
    const defaultSettings = {
      // 一般設定
      notifications: true,
      reminderTime: '20:00',
      autoStart: true,
      
      // スケジュール設定
      learningAlgorithm: 'default',
      intervals: { ...DEFAULT_INTERVALS },
      partialUnderstandingModifier: 0.5,
      wrongAnswerInterval: 1,
      
      // 表示設定
      darkMode: false,
      colorScheme: 'blue',
      fontSize: 'medium',
      compactView: false,
      
      // データ設定
      autoBackup: false,
      backupFrequency: 7,
      lastBackupDate: null
    };
    
    setSettings(defaultSettings);
    localStorage.setItem('study_scheduler_settings', JSON.stringify(defaultSettings));
    
    setSnackbar({
      open: true,
      message: '設定をリセットしました',
      severity: 'info'
    });
  };

  // データリセット処理
  const handleResetData = () => {
    if (resetConfirmText !== 'RESET') {
      setSnackbar({
        open: true,
        message: '確認テキストが正しくありません',
        severity: 'error'
      });
      return;
    }
    
    resetAllData();
    setResetDialogOpen(false);
    
    setSnackbar({
      open: true,
      message: 'すべてのデータをリセットしました。ページをリロードしてください。',
      severity: 'success'
    });
  };

  // スナックバーを閉じる
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 初期設定を行う
  const handleInitialSetup = () => {
    // ここでは既に初期設定が完了しているかどうかに応じて処理を分ける
    if (initialSetupDone) {
      // リセット確認ダイアログを表示
      setResetDialogOpen(true);
    } else {
      // 初期設定ページへ移動
      window.location.href = '/initial-setup';
    }
  };

  // データエクスポート
  const handleExportData = () => {
    const exportedData = exportAllData();
    
    // ダウンロード用のリンクを作成
    const blob = new Blob([exportedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_scheduler_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setSnackbar({
      open: true,
      message: 'データをエクスポートしました',
      severity: 'success'
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        設定
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="基本設定" value={TABS.GENERAL} />
          <Tab label="学習スケジュール" value={TABS.SCHEDULE} />
          <Tab label="表示設定" value={TABS.DISPLAY} />
          <Tab label="データ管理" value={TABS.DATA} />
        </Tabs>
      </Box>
      
      {/* 基本設定タブ */}
      {activeTab === TABS.GENERAL && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="アプリケーション設定" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="通知"
                      secondary="学習スケジュールに関する通知を表示します"
                    />
                    <Switch
                      checked={settings.notifications}
                      onChange={(e) => updateSetting('notifications', e.target.checked)}
                    />
                  </ListItem>
                  
                  {settings.notifications && (
                    <ListItem>
                      <TextField
                        label="リマインダー時間"
                        type="time"
                        value={settings.reminderTime}
                        onChange={(e) => updateSetting('reminderTime', e.target.value)}
                        sx={{ ml: 7 }}
                        size="small"
                      />
                    </ListItem>
                  )}
                  
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="自動開始"
                      secondary="アプリ起動時に「今日解く問題」ページを表示します"
                    />
                    <Switch
                      checked={settings.autoStart}
                      onChange={(e) => updateSetting('autoStart', e.target.checked)}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardHeader title="初期設定" />
              <CardContent>
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* スケジュール設定タブ */}
      {activeTab === TABS.SCHEDULE && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="学習アルゴリズム設定" 
                action={
                  <Tooltip title="暗記曲線に基づいて学習間隔を調整します">
                    <IconButton>
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="algorithm-select-label">学習アルゴリズム</InputLabel>
                  <Select
                    labelId="algorithm-select-label"
                    value={settings.learningAlgorithm}
                    onChange={(e) => updateSetting('learningAlgorithm', e.target.value)}
                    label="学習アルゴリズム"
                  >
                    <MenuItem value="default">デフォルト (暗記曲線)</MenuItem>
                    <MenuItem value="custom">カスタム</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="subtitle1" gutterBottom>
                  学習間隔設定
                </Typography>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>間隔パラメータのカスタマイズ</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      これらの設定は、正解時に次回の学習日をどれだけ先に設定するかを決定します。
                      値を変更すると学習間隔が調整されます。
                    </Alert>
                    
                    <Typography gutterBottom>
                      初回正解後: {settings.intervals.FIRST}日
                    </Typography>
                    <Slider
                      value={settings.intervals.FIRST}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      onChange={(e, value) => updateSetting('intervals.FIRST', value)}
                      disabled={settings.learningAlgorithm !== 'custom'}
                    />
                    
                    <Typography gutterBottom>
                      2回目正解後: {settings.intervals.SECOND}日
                    </Typography>
                    <Slider
                      value={settings.intervals.SECOND}
                      min={2}
                      max={14}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      onChange={(e, value) => updateSetting('intervals.SECOND', value)}
                      disabled={settings.learningAlgorithm !== 'custom'}
                    />
                    
                    <Typography gutterBottom>
                      3回目正解後: {settings.intervals.THIRD}日
                    </Typography>
                    <Slider
                      value={settings.intervals.THIRD}
                      min={7}
                      max={21}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      onChange={(e, value) => updateSetting('intervals.THIRD', value)}
                      disabled={settings.learningAlgorithm !== 'custom'}
                    />
                    
                    <Typography gutterBottom>
                      4回目正解後: {settings.intervals.FOURTH}日
                    </Typography>
                    <Slider
                      value={settings.intervals.FOURTH}
                      min={14}
                      max={45}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      onChange={(e, value) => updateSetting('intervals.FOURTH', value)}
                      disabled={settings.learningAlgorithm !== 'custom'}
                    />
                    
                    <Typography gutterBottom>
                      5回目以降正解後: {settings.intervals.FIFTH}日
                    </Typography>
                    <Slider
                      value={settings.intervals.FIFTH}
                      min={30}
                      max={90}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                      onChange={(e, value) => updateSetting('intervals.FIFTH', value)}
                      disabled={settings.learningAlgorithm !== 'custom'}
                    />
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<RestoreIcon />}
                        onClick={() => {
                          updateSetting('intervals', { ...DEFAULT_INTERVALS });
                        }}
                        disabled={settings.learningAlgorithm !== 'custom'}
                      >
                        デフォルトに戻す
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => {
                          setSnackbar({
                            open: true,
                            message: '間隔設定を保存しました',
                            severity: 'success'
                          });
                        }}
                        disabled={settings.learningAlgorithm !== 'custom'}
                      >
                        適用
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  理解度による調整
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography gutterBottom>
                      「曖昧△」の場合の間隔修正: {Math.round(settings.partialUnderstandingModifier * 100)}%
                    </Typography>
                    <Slider
                      value={settings.partialUnderstandingModifier}
                      min={0.1}
                      max={0.9}
                      step={0.1}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                      onChange={(e, value) => updateSetting('partialUnderstandingModifier', value)}
                    />
                    <Typography variant="caption" color="text.secondary">
                      「曖昧△」と評価した場合、通常の間隔の何%に短縮するかを設定します
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>不正解時の次回間隔</InputLabel>
                      <Select
                        value={settings.wrongAnswerInterval}
                        onChange={(e) => updateSetting('wrongAnswerInterval', e.target.value)}
                        label="不正解時の次回間隔"
                      >
                        <MenuItem value={1}>翌日 (1日後)</MenuItem>
                        <MenuItem value={2}>2日後</MenuItem>
                        <MenuItem value={3}>3日後</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary">
                      不正解だった場合、次回の学習をいつに設定するかを指定します
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* 表示設定タブ */}
      {activeTab === TABS.DISPLAY && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="表示設定" 
                action={
                  <Tooltip title="アプリの表示に関する設定">
                    <IconButton>
                      <PaletteIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  テーマ設定
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.darkMode}
                        onChange={(e) => updateSetting('darkMode', e.target.checked)}
                      />
                    }
                    label="ダークモード"
                  />
                </FormGroup>
                
                <Box sx={{ mt: 2 }}>
                  <InputLabel id="color-scheme-label">カラースキーム</InputLabel>
                  <Select
                    labelId="color-scheme-label"
                    fullWidth
                    value={settings.colorScheme}
                    onChange={(e) => updateSetting('colorScheme', e.target.value)}
                  >
                    <MenuItem value="blue">ブルー (デフォルト)</MenuItem>
                    <MenuItem value="purple">パープル</MenuItem>
                    <MenuItem value="green">グリーン</MenuItem>
                    <MenuItem value="orange">オレンジ</MenuItem>
                  </Select>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  レイアウト設定
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <InputLabel id="font-size-label">フォントサイズ</InputLabel>
                  <Select
                    labelId="font-size-label"
                    fullWidth
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                  >
                    <MenuItem value="small">小</MenuItem>
                    <MenuItem value="medium">中 (デフォルト)</MenuItem>
                    <MenuItem value="large">大</MenuItem>
                  </Select>
                </Box>
                
                <FormGroup sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.compactView}
                        onChange={(e) => updateSetting('compactView', e.target.checked)}
                      />
                    }
                    label="コンパクトビュー (問題リストの表示を簡略化)"
                  />
                </FormGroup>
                
                <Alert severity="info" sx={{ mt: 3 }}>
                  表示設定の一部は、ページの再読み込み後に適用されます。
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* データ管理タブ */}
      {activeTab === TABS.DATA && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="データ管理" 
                action={
                  <Tooltip title="データのバックアップとリセット">
                    <IconButton>
                      <StorageIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  バックアップ設定
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoBackup}
                        onChange={(e) => updateSetting('autoBackup', e.target.checked)}
                      />
                    }
                    label="自動バックアップ"
                  />
                </FormGroup>
                
                {settings.autoBackup && (
                  <Box sx={{ mt: 2 }}>
                    <InputLabel id="backup-frequency-label">バックアップ頻度</InputLabel>
                    <Select
                      labelId="backup-frequency-label"
                      fullWidth
                      value={settings.backupFrequency}
                      onChange={(e) => updateSetting('backupFrequency', e.target.value)}
                    >
                      <MenuItem value={1}>毎日</MenuItem>
                      <MenuItem value={7}>毎週</MenuItem>
                      <MenuItem value={30}>毎月</MenuItem>
                    </Select>
                  </Box>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  最終バックアップ日: {settings.lastBackupDate ? formatDateJP(new Date(settings.lastBackupDate)) : 'なし'}
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleExportData}
                  >
                    データをエクスポート
                  </Button>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  設定のリセット
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RestoreIcon />}
                    onClick={resetSettings}
                  >
                    設定をリセット
                  </Button>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom color="error">
                  危険なデータ操作
                </Typography>
                
                <Alert severity="warning" sx={{ mb: 2 }}>
                  以下の操作は、すべてのデータを削除します。この操作は取り消せません。
                </Alert>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setResetDialogOpen(true)}
                >
                  すべてのデータをリセット
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* リセット確認ダイアログ */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle color="error">
          データをリセットしますか？
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            すべてのデータ（問題、スケジュール、学習履歴など）が削除されます。この操作は取り消せません。
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
            確認のため、「RESET」と入力してください。
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>キャンセル</Button>
          <Button 
            onClick={handleResetData} 
            color="error"
            disabled={resetConfirmText !== 'RESET'}
          >
            リセット
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
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
