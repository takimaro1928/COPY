// src/services/scheduleService.ts

import { ProblemSchedule, UnderstandingLevel, ReviewHistory } from '../models/types';
import { addDays, stripTime, getDaysBetween } from '../utils/dateUtils';

/**
 * 暗記曲線に基づく間隔（日数）
 */
export const INTERVALS = {
  INITIAL: 0,      // 初回
  FIRST: 3,        // 3日後
  SECOND: 7,       // 7日後
  THIRD: 14,       // 14日後
  FOURTH: 30,      // 1ヶ月後
  FIFTH: 60        // 2ヶ月後
};

/**
 * ユーザー設定に基づく間隔修正値を取得
 */
export const getCustomIntervals = () => {
  // 設定からカスタム間隔を読み込む
  const savedSettings = localStorage.getItem('study_scheduler_settings');
  if (!savedSettings) return INTERVALS;
  
  try {
    const settings = JSON.parse(savedSettings);
    if (settings.learningAlgorithm === 'custom' && settings.intervals) {
      return settings.intervals;
    }
    return INTERVALS;
  } catch (error) {
    console.error('Error loading custom intervals:', error);
    return INTERVALS;
  }
};

/**
 * 理解度による間隔修正係数を取得
 */
export const getUnderstandingModifier = (understandingLevel: UnderstandingLevel): number => {
  // 設定から修正係数を読み込む
  const savedSettings = localStorage.getItem('study_scheduler_settings');
  let partialModifier = 0.5; // デフォルト値
  let wrongAnswerInterval = 1; // デフォルト値
  
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      partialModifier = settings.partialUnderstandingModifier || partialModifier;
      wrongAnswerInterval = settings.wrongAnswerInterval || wrongAnswerInterval;
    } catch (error) {
      console.error('Error loading understanding modifiers:', error);
    }
  }
  
  switch (understandingLevel) {
    case UnderstandingLevel.FULL:
      return 1.0; // 完全理解の場合は修正なし
    case UnderstandingLevel.PARTIAL:
      return partialModifier; // 曖昧な理解の場合は係数で短縮
    case UnderstandingLevel.NONE:
      return 0; // 理解できていない場合は最短間隔（wrongAnswerIntervalを使用）
    default:
      return 1.0;
  }
};

/**
 * 学習履歴分析に基づく間隔調整
 * 過去の学習パターンに基づいて間隔を最適化
 */
export const analyzeHistoryAndAdjustInterval = (
  problemId: string,
  history: ReviewHistory[],
  baseInterval: number
): number => {
  // 履歴が少ない場合は基本間隔をそのまま返す
  if (history.length < 3) return baseInterval;
  
  // 過去の理解度の変化傾向を分析
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // 正解・不正解率を計算
  const correctRate = sortedHistory.filter(h => h.isCorrect).length / sortedHistory.length;
  
  // 理解度の変化パターンを計算
  let improvementCount = 0;
  let declineCount = 0;
  
  for (let i = 1; i < sortedHistory.length; i++) {
    const prev = sortedHistory[i-1].understandingLevel;
    const curr = sortedHistory[i].understandingLevel;
    
    // 改善パターン
    if (
      (prev === UnderstandingLevel.NONE && curr === UnderstandingLevel.PARTIAL) ||
      (prev === UnderstandingLevel.PARTIAL && curr === UnderstandingLevel.FULL) ||
      (prev === UnderstandingLevel.NONE && curr === UnderstandingLevel.FULL)
    ) {
      improvementCount++;
    } 
    // 後退パターン
    else if (
      (prev === UnderstandingLevel.FULL && curr === UnderstandingLevel.PARTIAL) ||
      (prev === UnderstandingLevel.PARTIAL && curr === UnderstandingLevel.NONE) ||
      (prev === UnderstandingLevel.FULL && curr === UnderstandingLevel.NONE)
    ) {
      declineCount++;
    }
  }
  
  // 間隔調整ロジック
  let intervalMultiplier = 1.0;
  
  // 高い正解率とコンスタントな理解度の改善があれば間隔を延長
  if (correctRate > 0.8 && improvementCount > declineCount) {
    intervalMultiplier = 1.2;
  } 
  // 後退が多い場合は間隔を短縮
  else if (declineCount > improvementCount) {
    intervalMultiplier = 0.8;
  }
  // 極端に理解度が低い状態が続く場合は間隔をさらに短縮
  if (
    sortedHistory.length >= 3 && 
    sortedHistory.slice(-3).every(h => h.understandingLevel === UnderstandingLevel.NONE)
  ) {
    intervalMultiplier = 0.5;
  }
  
  // 最終的な間隔を計算（最低1日は保証）
  return Math.max(1, Math.round(baseInterval * intervalMultiplier));
};

/**
 * 学習難易度に基づくパーソナライズされた間隔調整
 */
export const getPersonalizedInterval = (
  problemId: string,
  history: ReviewHistory[],
  baseInterval: number
): number => {
  // 履歴データがない場合はベース間隔を返す
  if (history.length === 0) return baseInterval;
  
  // 問題ごとの学習難易度を計算
  const correctCount = history.filter(h => h.isCorrect).length;
  const incorrectCount = history.length - correctCount;
  
  // 不正解が多い問題は難しいと判断
  const difficultyScore = incorrectCount / (history.length + 1); // +1で0除算回避
  
  // 難易度に応じて間隔を調整（難しい問題ほど短い間隔に）
  const adjustedInterval = baseInterval * (1 - difficultyScore * 0.5);
  
  // 最低1日、最大は元の間隔の1.2倍を保証
  return Math.max(1, Math.min(baseInterval * 1.2, Math.round(adjustedInterval)));
};

/**
 * 正誤結果に基づいて次回の復習日を計算する（拡張版）
 */
export const calculateNextReviewDate = (
  currentSchedule: ProblemSchedule,
  isCorrect: boolean,
  understandingLevel: UnderstandingLevel,
  history: ReviewHistory[] = []
): ProblemSchedule => {
  // 現在の日付を取得
  const now = new Date();
  // 復習回数を増やす
  const reviewCount = currentSchedule.reviewCount + 1;
  
  // カスタム間隔を取得
  const intervals = getCustomIntervals();
  
  // 不正解や理解度なしの場合は次回間隔を短くする
  let nextInterval: number;
  
  if (!isCorrect || understandingLevel === UnderstandingLevel.NONE) {
    // 設定からwrongAnswerIntervalを取得
    const savedSettings = localStorage.getItem('study_scheduler_settings');
    let wrongAnswerInterval = 1; // デフォルト値
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        wrongAnswerInterval = settings.wrongAnswerInterval || wrongAnswerInterval;
      } catch (error) {
        console.error('Error loading wrong answer interval:', error);
      }
    }
    
    nextInterval = wrongAnswerInterval;
  } else {
    // 正解の場合は暗記曲線に基づいて間隔を延長
    switch (currentSchedule.currentInterval) {
      case intervals.INITIAL:
        nextInterval = intervals.FIRST;
        break;
      case intervals.FIRST:
        nextInterval = intervals.SECOND;
        break;
      case intervals.SECOND:
        nextInterval = intervals.THIRD;
        break;
      case intervals.THIRD:
        nextInterval = intervals.FOURTH;
        break;
      case intervals.FOURTH:
        nextInterval = intervals.FIFTH;
        break;
      default:
        // 2ヶ月後以降は同じ間隔を維持
        nextInterval = intervals.FIFTH;
    }
    
    // 理解度によるモディファイア適用
    const modifier = getUnderstandingModifier(understandingLevel);
    nextInterval = Math.max(1, Math.round(nextInterval * modifier));
    
    // 学習履歴に基づく調整
    if (history.length > 0) {
      // 履歴分析に基づく追加の調整
      nextInterval = analyzeHistoryAndAdjustInterval(
        currentSchedule.problemId,
        history,
        nextInterval
      );
      
      // パーソナライズされた難易度調整
      nextInterval = getPersonalizedInterval(
        currentSchedule.problemId,
        history,
        nextInterval
      );
    }
  }
  
  // 次回の復習日を計算
  const nextReviewDate = addDays(now, nextInterval);
  
  return {
    ...currentSchedule,
    nextReviewDate,
    currentInterval: nextInterval,
    reviewCount,
    lastReviewDate: now
  };
};

/**
 * 今日学習すべき問題のスケジュールを取得
 */
export const getTodaySchedules = (schedules: ProblemSchedule[]): ProblemSchedule[] => {
  const today = stripTime(new Date());
  
  return schedules.filter(schedule => {
    const scheduleDate = stripTime(new Date(schedule.nextReviewDate));
    return scheduleDate <= today;
  });
};

/**
 * 指定された日付に学習すべき問題のスケジュールを取得
 */
export const getSchedulesForDate = (
  schedules: ProblemSchedule[],
  date: Date
): ProblemSchedule[] => {
  const targetDate = stripTime(date);
  
  return schedules.filter(schedule => {
    const scheduleDate = stripTime(new Date(schedule.nextReviewDate));
    return scheduleDate.getTime() === targetDate.getTime();
  });
};

/**
 * 日付範囲内の問題スケジュールを取得
 */
export const getSchedulesInDateRange = (
  schedules: ProblemSchedule[],
  startDate: Date,
  endDate: Date
): ProblemSchedule[] => {
  const start = stripTime(startDate);
  const end = new Date(stripTime(endDate));
  end.setHours(23, 59, 59, 999);
  
  return schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.nextReviewDate);
    return scheduleDate >= start && scheduleDate <= end;
  });
};

/**
 * スケジュールの日付を手動で更新
 */
export const updateScheduleDate = (
  schedule: ProblemSchedule,
  newDate: Date
): ProblemSchedule => {
  return {
    ...schedule,
    nextReviewDate: newDate
  };
};

/**
 * 複数の問題のスケジュールを一括で設定
 */
export const setBulkSchedule = (
  problemIds: string[],
  date: Date,
  interval: number,
  currentSchedules: ProblemSchedule[]
): ProblemSchedule[] => {
  // 既存のスケジュールをコピー
  const updatedSchedules = [...currentSchedules];
  
  // 指定された問題IDのスケジュールを更新
  problemIds.forEach(problemId => {
    const index = updatedSchedules.findIndex(s => s.problemId === problemId);
    
    if (index !== -1) {
      // 既存のスケジュールを更新
      updatedSchedules[index] = {
        ...updatedSchedules[index],
        nextReviewDate: date,
        currentInterval: interval
      };
    } else {
      // 新しいスケジュールを作成
      updatedSchedules.push({
        problemId,
        nextReviewDate: date,
        currentInterval: interval,
        reviewCount: 0,
        lastReviewDate: new Date()
      });
    }
  });
  
  return updatedSchedules;
};

/**
 * 学習の進捗分析レポートを生成
 */
export const generateProgressReport = (
  problemId: string,
  history: ReviewHistory[]
): {
  trend: 'improving' | 'stable' | 'declining' | 'mixed';
  correctRate: number;
  understandingProgress: number;
  recommendedAction: string;
  difficulty: number;
} => {
  if (history.length === 0) {
    return {
      trend: 'stable',
      correctRate: 0,
      understandingProgress: 0,
      recommendedAction: '学習を開始してください',
      difficulty: 0.5
    };
  }
  
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // 正答率計算
  const correctCount = sortedHistory.filter(h => h.isCorrect).length;
  const correctRate = (correctCount / sortedHistory.length) * 100;
  
  // 理解度の変化分析
  let improvementCount = 0;
  let declineCount = 0;
  let stableCount = 0;
  
  for (let i = 1; i < sortedHistory.length; i++) {
    const prev = sortedHistory[i-1].understandingLevel;
    const curr = sortedHistory[i].understandingLevel;
    
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
  
  // 傾向を決定
  let trend: 'improving' | 'stable' | 'declining' | 'mixed';
  if (improvementCount > declineCount * 2) {
    trend = 'improving';
  } else if (declineCount > improvementCount * 2) {
    trend = 'declining';
  } else if (stableCount > (improvementCount + declineCount)) {
    trend = 'stable';
  } else {
    trend = 'mixed';
  }
  
  // 最新の理解度からの進捗スコア計算
  let understandingProgress = 0;
  const latestUnderstanding = sortedHistory[sortedHistory.length - 1].understandingLevel;
  
  switch (latestUnderstanding) {
    case UnderstandingLevel.FULL:
      understandingProgress = 100;
      break;
    case UnderstandingLevel.PARTIAL:
      understandingProgress = 50;
      break;
    case UnderstandingLevel.NONE:
      understandingProgress = 0;
      break;
  }
  
  // 難易度計算（正解率の逆数、0.1-1.0の範囲）
  const difficulty = Math.max(0.1, Math.min(1.0, 1 - (correctRate / 100)));
  
  // 推奨アクション
  let recommendedAction = '';
  if (trend === 'declining') {
    recommendedAction = '学習アプローチを変更することを検討してください';
  } else if (trend === 'stable' && latestUnderstanding !== UnderstandingLevel.FULL) {
    recommendedAction = '異なる角度からこの問題に取り組んでみてください';
  } else if (trend === 'improving') {
    recommendedAction = '現在の学習方法を続けてください';
  } else if (correctRate < 50) {
    recommendedAction = 'この問題には追加の時間を割いてください';
  } else {
    recommendedAction = '通常の復習を続けてください';
  }
  
  return {
    trend,
    correctRate,
    understandingProgress,
    recommendedAction,
    difficulty
  };
};

/**
 * 最適な学習計画を生成
 */
export const generateOptimalStudyPlan = (
  schedules: ProblemSchedule[],
  history: ReviewHistory[],
  daysAhead: number = 7
): { date: Date; problemIds: string[]; estimatedTime: number }[] => {
  const today = stripTime(new Date());
  const plan = [];
  
  // 今後の日数分の計画を生成
  for (let i = 0; i < daysAhead; i++) {
    const targetDate = addDays(today, i);
    const daySchedules = getSchedulesForDate(schedules, targetDate);
    
    // 各問題の推定学習時間を計算（難易度に基づく）
    let totalEstimatedTime = 0;
    const problemIds = daySchedules.map(schedule => {
      const problemHistory = history.filter(h => h.problemId === schedule.problemId);
      const progressReport = generateProgressReport(schedule.problemId, problemHistory);
      
      // 難易度に基づく推定時間（分単位）：難しい問題ほど時間がかかる
      const estimatedMinutes = 2 + Math.round(progressReport.difficulty * 8);
      totalEstimatedTime += estimatedMinutes;
      
      return schedule.problemId;
    });
    
    plan.push({
      date: targetDate,
      problemIds,
      estimatedTime: totalEstimatedTime
    });
  }
  
  return plan;
};
