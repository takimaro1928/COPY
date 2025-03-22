// src/services/storageService.ts

import { Problem, ProblemSchedule, ReviewHistory, Subject, Chapter } from '../models/types';

// ローカルストレージのキー
export const STORAGE_KEYS = {
  PROBLEMS: 'study_scheduler_problems',
  SCHEDULES: 'study_scheduler_schedules',
  HISTORY: 'study_scheduler_history',
  SUBJECTS: 'study_scheduler_subjects',
  CHAPTERS: 'study_scheduler_chapters',
  INITIAL_SETUP_COMPLETED: 'study_scheduler_setup_completed'
};

/**
 * データの読み込み
 */
export const loadData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error loading data for key: ${key}`, error);
    return [];
  }
};

/**
 * データの保存
 */
export const saveData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data for key: ${key}`, error);
  }
};

/**
 * 単一の値を保存
 */
export const saveValue = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving value for key: ${key}`, error);
  }
};

/**
 * 単一の値を読み込み
 */
export const loadValue = <T>(key: string, defaultValue: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error(`Error loading value for key: ${key}`, error);
    return defaultValue;
  }
};

// 問題データの操作
export const getProblems = (): Problem[] => {
  return loadData<Problem>(STORAGE_KEYS.PROBLEMS);
};

export const saveProblems = (problems: Problem[]): void => {
  saveData(STORAGE_KEYS.PROBLEMS, problems);
};

export const addProblem = (problem: Problem): void => {
  const problems = getProblems();
  saveProblems([...problems, problem]);
};

export const updateProblem = (updatedProblem: Problem): void => {
  const problems = getProblems();
  const index = problems.findIndex(p => p.id === updatedProblem.id);
  
  if (index !== -1) {
    problems[index] = updatedProblem;
    saveProblems(problems);
  }
};

export const deleteProblem = (problemId: string): void => {
  const problems = getProblems();
  saveProblems(problems.filter(p => p.id !== problemId));
};

// スケジュールデータの操作
export const getSchedules = (): ProblemSchedule[] => {
  const schedules = loadData<ProblemSchedule>(STORAGE_KEYS.SCHEDULES);
  
  // 日付を文字列からDateオブジェクトに変換
  return schedules.map(schedule => ({
    ...schedule,
    nextReviewDate: new Date(schedule.nextReviewDate),
    lastReviewDate: new Date(schedule.lastReviewDate)
  }));
};

export const saveSchedules = (schedules: ProblemSchedule[]): void => {
  saveData(STORAGE_KEYS.SCHEDULES, schedules);
};

export const getScheduleForProblem = (problemId: string): ProblemSchedule | undefined => {
  const schedules = getSchedules();
  return schedules.find(s => s.problemId === problemId);
};

export const updateSchedule = (updatedSchedule: ProblemSchedule): void => {
  const schedules = getSchedules();
  const index = schedules.findIndex(s => s.problemId === updatedSchedule.problemId);
  
  if (index !== -1) {
    schedules[index] = updatedSchedule;
    saveSchedules(schedules);
  } else {
    saveSchedules([...schedules, updatedSchedule]);
  }
};

// 履歴データの操作
export const getHistory = (): ReviewHistory[] => {
  const history = loadData<ReviewHistory>(STORAGE_KEYS.HISTORY);
  
  // 日付を文字列からDateオブジェクトに変換
  return history.map(entry => ({
    ...entry,
    date: new Date(entry.date)
  }));
};

export const saveHistory = (history: ReviewHistory[]): void => {
  saveData(STORAGE_KEYS.HISTORY, history);
};

export const addHistoryEntry = (entry: ReviewHistory): void => {
  const history = getHistory();
  saveHistory([...history, entry]);
};

export const getHistoryForProblem = (problemId: string): ReviewHistory[] => {
  const history = getHistory();
  return history.filter(h => h.problemId === problemId);
};

// 科目データの操作
export const getSubjects = (): Subject[] => {
  return loadData<Subject>(STORAGE_KEYS.SUBJECTS);
};

export const saveSubjects = (subjects: Subject[]): void => {
  saveData(STORAGE_KEYS.SUBJECTS, subjects);
};

// 章データの操作
export const getChapters = (): Chapter[] => {
  return loadData<Chapter>(STORAGE_KEYS.CHAPTERS);
};

export const saveChapters = (chapters: Chapter[]): void => {
  saveData(STORAGE_KEYS.CHAPTERS, chapters);
};

export const getChaptersBySubject = (subjectId: string): Chapter[] => {
  const chapters = getChapters();
  return chapters.filter(c => c.subjectId === subjectId);
};

// 初期設定完了フラグの操作
export const isInitialSetupCompleted = (): boolean => {
  return loadValue<boolean>(STORAGE_KEYS.INITIAL_SETUP_COMPLETED, false);
};

export const setInitialSetupCompleted = (completed: boolean): void => {
  saveValue(STORAGE_KEYS.INITIAL_SETUP_COMPLETED, completed);
};

// データのエクスポート
export const exportAllData = (): string => {
  const data = {
    problems: getProblems(),
    schedules: getSchedules(),
    history: getHistory(),
    subjects: getSubjects(),
    chapters: getChapters(),
    setupCompleted: isInitialSetupCompleted()
  };
  
  return JSON.stringify(data);
};

// データのインポート
export interface ImportedData {
  problems: Problem[];
  schedules: ProblemSchedule[];
  history: ReviewHistory[];
  subjects: Subject[];
  chapters: Chapter[];
  setupCompleted: boolean;
}

export const importAllData = (jsonData: string): boolean => {
  try {
    const data: ImportedData = JSON.parse(jsonData);
    
    // 各データを保存
    saveProblems(data.problems);
    saveSchedules(data.schedules);
    saveHistory(data.history);
    saveSubjects(data.subjects);
    saveChapters(data.chapters);
    setInitialSetupCompleted(data.setupCompleted);
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// ローカルストレージのクリア
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.PROBLEMS);
  localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
  localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
  localStorage.removeItem(STORAGE_KEYS.CHAPTERS);
  localStorage.removeItem(STORAGE_KEYS.INITIAL_SETUP_COMPLETED);
};
