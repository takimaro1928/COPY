// src/contexts/AppContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getProblems, 
  saveProblems, 
  getSchedules, 
  saveSchedules, 
  getHistory, 
  saveHistory,
  getSubjects,
  saveSubjects,
  getChapters,
  saveChapters,
  isInitialSetupCompleted,
  setInitialSetupCompleted,
  addHistoryEntry
} from '../services/storageService';
import { calculateNextReviewDate } from '../services/scheduleService';
import { setupInitialData } from '../services/initialDataService';
import { UnderstandingLevel } from '../models/types';

// コンテキストの型定義
const defaultContext = {
  // データ
  problems: [],
  schedules: [],
  history: [],
  subjects: [],
  chapters: [],
  initialSetupDone: false,
  
  // 問題管理
  addProblem: () => {},
  updateProblem: () => {},
  deleteProblem: () => {},
  
  // スケジュール管理
  updateSchedule: () => {},
  updateScheduleDate: () => {},
  setBulkSchedule: () => {},
  
  // 学習記録
  recordAnswer: () => {},
  
  // 統計情報
  statistics: {
    totalProblems: 0,
    completedProblems: 0,
    correctRate: 0,
    problemsByUnderstanding: {
      full: 0,
      partial: 0,
      none: 0
    },
    subjectPerformance: []
  },
  
  // フィルタリング
  filterProblems: () => [],
  
  // 初期設定
  completeInitialSetup: () => {},
  resetAllData: () => {},
  
  // UIのための補助関数
  getProblemById: () => undefined,
  getScheduleByProblemId: () => undefined,
  getChapterById: () => undefined,
  getSubjectById: () => undefined,
  getChaptersBySubject: () => [],
  getTodayProblems: () => [],
  getProblemsByChapter: () => []
};

// コンテキストの作成
const AppContext = createContext(defaultContext);

// コンテキストプロバイダー
export const AppProvider = ({ children }) => {
  // 状態管理
  const [problems, setProblems] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [initialSetupDone, setInitialSetupDone] = useState(false);
  const [statistics, setStatistics] = useState(defaultContext.statistics);
  
  // データのロード
  useEffect(() => {
    console.log('AppContext initialized');
    
    // ローカルストレージにデータがあればロード
    const storedProblems = getProblems();
    const storedSchedules = getSchedules();
    const storedHistory = getHistory();
    const storedSubjects = getSubjects();
    const storedChapters = getChapters();
    const setupCompleted = isInitialSetupCompleted();
    
    // データが存在しない場合は初期データをセットアップ
    if (storedSubjects.length === 0 || storedChapters.length === 0) {
      const { subjects, chapters, problems } = setupInitialData();
      setSubjects(subjects);
      saveSubjects(subjects);
      setChapters(chapters);
      saveChapters(chapters);
      
      // 問題もセットアップするが、スケジュールは初期設定時に設定するためここではセットしない
      if (storedProblems.length === 0) {
        setProblems(problems);
        saveProblems(problems);
      }
    } else {
      // 既存データをロード
      setSubjects(storedSubjects);
      setChapters(storedChapters);
      setProblems(storedProblems);
      setSchedules(storedSchedules);
      setHistory(storedHistory);
    }
    
    setInitialSetupDone(setupCompleted);
  }, []);
  
  // 統計情報の計算
  useEffect(() => {
    if (problems.length === 0) return;
    
    // 正答率の計算
    const calculateStatistics = () => {
      const totalProblems = problems.length;
      let completedProblems = 0;
      let correctAnswers = 0;
      let totalAnswers = 0;
      
      // 理解度別の問題数
      const understandingCounts = {
        full: 0,
        partial: 0,
        none: 0
      };
      
      // 科目別のパフォーマンス
      const subjectStats = {};
      
      // 各問題の履歴を調査
      problems.forEach(problem => {
        const problemHistory = history.filter(h => h.problemId === problem.id);
        
        // 少なくとも1回解いていれば完了とみなす
        if (problemHistory.length > 0) {
          completedProblems++;
        }
        
        // 正答数をカウント
        const correctCount = problemHistory.filter(h => h.isCorrect).length;
        correctAnswers += correctCount;
        totalAnswers += problemHistory.length;
        
        // 最新の理解度を取得
        if (problemHistory.length > 0) {
          const latestHistory = problemHistory.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          
          switch (latestHistory.understandingLevel) {
            case UnderstandingLevel.FULL:
              understandingCounts.full++;
              break;
            case UnderstandingLevel.PARTIAL:
              understandingCounts.partial++;
              break;
            case UnderstandingLevel.NONE:
              understandingCounts.none++;
              break;
            default:
              break;
          }
        }
        
        // 科目別の統計を更新
        if (!subjectStats[problem.subjectId]) {
          subjectStats[problem.subjectId] = { correct: 0, total: 0, count: 0 };
        }
        
        subjectStats[problem.subjectId].correct += correctCount;
        subjectStats[problem.subjectId].total += problemHistory.length;
        subjectStats[problem.subjectId].count++;
      });
      
      // 科目別パフォーマンスの配列を作成
      const subjectPerformance = Object.entries(subjectStats).map(([subjectId, stats]) => ({
        subjectId,
        correctRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        problemCount: stats.count
      }));
      
      // 統計情報の更新
      setStatistics({
        totalProblems,
        completedProblems,
        correctRate: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
        problemsByUnderstanding: understandingCounts,
        subjectPerformance
      });
    };
    
    calculateStatistics();
  }, [problems, history]);
  
  // 問題管理
  const addProblem = (problem) => {
    const newProblems = [...problems, problem];
    setProblems(newProblems);
    saveProblems(newProblems);
  };
  
  const updateProblem = (updatedProblem) => {
    const newProblems = problems.map(p => 
      p.id === updatedProblem.id ? updatedProblem : p
    );
    setProblems(newProblems);
    saveProblems(newProblems);
  };
  
  const deleteProblem = (problemId) => {
    const newProblems = problems.filter(p => p.id !== problemId);
    setProblems(newProblems);
    saveProblems(newProblems);
    
    // 関連するスケジュールも削除
    const newSchedules = schedules.filter(s => s.problemId !== problemId);
    setSchedules(newSchedules);
    saveSchedules(newSchedules);
  };
  
  // スケジュール管理
  const updateSchedule = (updatedSchedule) => {
    const index = schedules.findIndex(s => s.problemId === updatedSchedule.problemId);
    
    if (index !== -1) {
      const newSchedules = [...schedules];
      newSchedules[index] = updatedSchedule;
      setSchedules(newSchedules);
      saveSchedules(newSchedules);
    } else {
      const newSchedules = [...schedules, updatedSchedule];
      setSchedules(newSchedules);
      saveSchedules(newSchedules);
    }
  };
  
  const updateScheduleDate = (problemId, date) => {
    const schedule = schedules.find(s => s.problemId === problemId);
    
    if (schedule) {
      const updatedSchedule = {
        ...schedule,
        nextReviewDate: date
      };
      updateSchedule(updatedSchedule);
    }
  };
  
  const setBulkSchedule = (problemIds, date, interval) => {
    const newSchedules = [...schedules];
    
    problemIds.forEach(problemId => {
      const index = newSchedules.findIndex(s => s.problemId === problemId);
      
      if (index !== -1) {
        newSchedules[index] = {
          ...newSchedules[index],
          nextReviewDate: date,
          currentInterval: interval
        };
      } else {
        newSchedules.push({
          problemId,
          nextReviewDate: date,
          currentInterval: interval,
          reviewCount: 0,
          lastReviewDate: new Date()
        });
      }
    });
    
    setSchedules(newSchedules);
    saveSchedules(newSchedules);
  };
  
  // 学習記録
  const recordAnswer = (problemId, isCorrect, understandingLevel) => {
    // 履歴に追加
    const newHistoryEntry = {
      id: Date.now().toString(),
      problemId,
      date: new Date(),
      isCorrect,
      understandingLevel
    };
    
    const newHistory = [...history, newHistoryEntry];
    setHistory(newHistory);
    saveHistory(newHistory);
    addHistoryEntry(newHistoryEntry);
    
    // スケジュールを更新
    const schedule = schedules.find(s => s.problemId === problemId);
    
    if (schedule) {
      const updatedSchedule = calculateNextReviewDate(
        schedule,
        isCorrect,
        understandingLevel
      );
      updateSchedule(updatedSchedule);
    } else {
      // スケジュールがまだない場合は初期スケジュールを作成
      const initialSchedule = {
        problemId,
        nextReviewDate: new Date(),
        currentInterval: 0,
        reviewCount: 0,
        lastReviewDate: new Date()
      };
      
      const updatedSchedule = calculateNextReviewDate(
        initialSchedule,
        isCorrect,
        understandingLevel
      );
      updateSchedule(updatedSchedule);
    }
  };
  
  // フィルタリング
  const filterProblems = (options) => {
    return problems.filter(problem => {
      // 科目フィルター
      if (options.subjects && options.subjects.length > 0) {
        if (!options.subjects.includes(problem.subjectId)) {
          return false;
        }
      }
      
      // 章フィルター
      if (options.chapters && options.chapters.length > 0) {
        if (!options.chapters.includes(problem.chapterId)) {
          return false;
        }
      }
      
      // 理解度フィルター
      if (options.understandingLevels && options.understandingLevels.length > 0) {
        const problemHistory = history.filter(h => h.problemId === problem.id);
        
        // 履歴がない場合はフィルターに合致しない
        if (problemHistory.length === 0) {
          return false;
        }
        
        // 最新の履歴を取得
        const latestHistory = problemHistory.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        
        if (!options.understandingLevels.includes(latestHistory.understandingLevel)) {
          return false;
        }
      }
      
      // 日付範囲フィルター
      if (options.dateRange) {
        const schedule = schedules.find(s => s.problemId === problem.id);
        
        if (!schedule) {
          return false;
        }
        
        const nextReviewDate = new Date(schedule.nextReviewDate);
        
        if (
          nextReviewDate < options.dateRange.from ||
          nextReviewDate > options.dateRange.to
        ) {
          return false;
        }
      }
      
      // 検索キーワードフィルター
      if (options.searchKeyword && options.searchKeyword.trim() !== '') {
        const keyword = options.searchKeyword.toLowerCase();
        const problemNumber = problem.number.toLowerCase();
        
        // 問題番号の検索
        if (problemNumber.includes(keyword)) {
          return true;
        }
        
        // 章名の検索
        const chapter = chapters.find(c => c.id === problem.chapterId);
        if (chapter && chapter.name.toLowerCase().includes(keyword)) {
          return true;
        }
        
        // 科目名の検索
        const subject = subjects.find(s => s.id === problem.subjectId);
        if (subject && subject.name.toLowerCase().includes(keyword)) {
          return true;
        }
        
        return false;
      }
      
      return true;
    });
  };
  
  // 初期設定
  const completeInitialSetup = () => {
    setInitialSetupDone(true);
    setInitialSetupCompleted(true);
  };
  
  const resetAllData = () => {
    // 初期データのセットアップ
    const initialData = setupInitialData();
    
    setProblems(initialData.problems);
    saveProblems(initialData.problems);
    
    setSubjects(initialData.subjects);
    saveSubjects(initialData.subjects);
    
    setChapters(initialData.chapters);
    saveChapters(initialData.chapters);
    
    // スケジュールと履歴をクリア
    setSchedules([]);
    saveSchedules([]);
    
    setHistory([]);
    saveHistory([]);
    
    // 初期設定フラグをリセット
    setInitialSetupDone(false);
    setInitialSetupCompleted(false);
  };
  
  // 補助関数
  const getProblemById = (id) => {
    return problems.find(p => p.id === id);
  };
  
  const getScheduleByProblemId = (id) => {
    return schedules.find(s => s.problemId === id);
  };
  
  const getChapterById = (id) => {
    return chapters.find(c => c.id === id);
  };
  
  const getSubjectById = (id) => {
    return subjects.find(s => s.id === id);
  };
  
  const getChaptersBySubject = (subjectId) => {
    return chapters.filter(c => c.subjectId === subjectId);
  };
  
  const getTodayProblems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.nextReviewDate);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate <= today;
    });
    
    return todaySchedules
      .map(schedule => {
        const problem = problems.find(p => p.id === schedule.problemId);
        return problem ? { problem, schedule } : null;
      })
      .filter(item => item !== null);
  };
  
  const getProblemsByChapter = (chapterId) => {
    return problems.filter(p => p.chapterId === chapterId);
  };
  
  // コンテキスト値
  const value = {
    problems,
    schedules,
    history,
    subjects,
    chapters,
    initialSetupDone,
    
    addProblem,
    updateProblem,
    deleteProblem,
    
    updateSchedule,
    updateScheduleDate,
    setBulkSchedule,
    
    recordAnswer,
    
    statistics,
    
    filterProblems,
    
    completeInitialSetup,
    resetAllData,
    
    getProblemById,
    getScheduleByProblemId,
    getChapterById,
    getSubjectById,
    getChaptersBySubject,
    getTodayProblems,
    getProblemsByChapter
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// カスタムフック
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
