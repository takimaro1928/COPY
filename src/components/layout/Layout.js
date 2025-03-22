import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Container,
  Hidden
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TodayIcon from '@mui/icons-material/Today';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { useApp } from '../../contexts/AppContext';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialSetupDone } = useApp();
  
  // ドロワーの開閉状態
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // メニュー項目の定義
  const menuItems = [
    {
      text: '今日解く問題',
      path: '/today',
      icon: <TodayIcon />
    },
    {
      text: '全問題一覧',
      path: '/all-problems',
      icon: <ListAltIcon />
    },
    {
      text: '問題検索',
      path: '/search',
      icon: <SearchIcon />
    },
    {
      text: 'スケジュール一覧',
      path: '/schedule',
      icon: <CalendarMonthIcon />
    },
    {
      text: '学習分析',
      path: '/statistics',
      icon: <BarChartIcon />
    },
    {
      text: '曖昧な問題',
      path: '/vague-problems',
      icon: <HelpOutlineIcon />
    },
    {
      text: 'データ管理',
      path: '/data-management',
      icon: <SettingsBackupRestoreIcon />
    },
    {
      text: '設定',
      path: '/settings',
      icon: <SettingsIcon />
    }
  ];
  
  // ドロワーの開閉を切り替える
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // ページを移動する
  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };
  
  // ドロワーの内容
  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Study Scheduler
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            selected={location.pathname === item.path}
            onClick={() => handleNavigate(item.path)}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {location.pathname === '/' 
              ? 'Study Scheduler' 
              : menuItems.find(item => item.path === location.pathname)?.text || 'Study Scheduler'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Hidden smUp implementation="css">
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="css">
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Hidden>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        <Box component="footer" sx={{ py: 2, mt: 'auto' }}>
          <Container maxWidth="md">
            <Typography variant="body2" color="text.secondary" align="center">
              Study Scheduler &copy; {new Date().getFullYear()}
            </Typography>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
