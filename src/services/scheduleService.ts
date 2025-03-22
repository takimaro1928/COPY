// src/services/scheduleService.ts

import { ProblemSchedule, UnderstandingLevel } from '../models/types';
import { addDays } from '../utils/dateUtils';

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
 * 正誤結果に基づいて次回の復習日を計算する
 */
export const calculateNextReviewDate = (
  currentSchedule: ProblemSchedule,
  isCorrect: boolean,
  understandingLevel: UnderstandingLevel
): ProblemSchedule => {
  // 現在の日付を取得
  const now = new Date();
  // 復習回数を増やす
  const reviewCount = currentSchedule.reviewCount + 1;
  
  let nextInterval: number;
  
  if (!isCorrect || understandingLevel === UnderstandingLevel.NONE) {
    // 不正解または理解していない場合は翌日に再設定
    nextInterval = 1;
  } else {
    // 正解の場合は暗記曲線に基づいて間隔を延長
    switch (currentSchedule.currentInterval) {
      case INTERVALS.INITIAL:
        nextInterval = INTERVALS.FIRST;
        break;
      case INTERVALS.FIRST:
        nextInterval = INTERVALS.SECOND;
        break;
      case INTERVALS.SECOND:
        nextInterval = INTERVALS.THIRD;
        break;
      case INTERVALS.THIRD:
        nextInterval = INTERVALS.FOURTH;
        break;
      case INTERVALS.FOURTH:
        nextInterval = INTERVALS.FIFTH;
        break;
      default:
        // 2ヶ月後以降は同じ間隔を維持
        nextInterval = INTERVALS.FIFTH;
    }
    
    // 理解度が「曖昧」の場合は間隔を短くする
    if (understandingLevel === UnderstandingLevel.PARTIAL) {
      nextInterval = Math.max(Math.floor(nextInterval / 2), 1);
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.nextReviewDate);
    scheduleDate.setHours(0, 0, 0, 0);
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
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.nextReviewDate);
    scheduleDate.setHours(0, 0, 0, 0);
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
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
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
