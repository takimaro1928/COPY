// src/App.js

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/layout/Layout';
import TodayProblems from './components/pages/TodayProblems/TodayProblems.js';
import AllProblems from './components/pages/AllProblems/AllProblems.js';
import SearchPage from './components/pages/Search/SearchPage.js';
import ScheduleView from './components/pages/ScheduleView/ScheduleView.js';
import Statistics from './components/pages/Statistics/Statistics.js';
import VagueProblems from './components/pages/VagueProblems/VagueProblems.js';
import DataManagement from './components/pages/DataManagement/DataManagement.js';
import Settings from './components/pages/Settings/Settings.js';
import NotFound from './components/pages/NotFound/NotFound.js';
import InitialSetup from './components/pages/InitialSetup/InitialSetup.js';

// テーマの設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/today" element={<TodayProblems />} />
            <Route path="/all-problems" element={<AllProblems />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/schedule" element={<ScheduleView />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/vague-problems" element={<VagueProblems />} />
            <Route path="/data-management" element={<DataManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/initial-setup" element={<InitialSetup />} />
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
