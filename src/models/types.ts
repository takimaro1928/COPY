/**
 * 問題の基本情報
 */
export interface Problem {
  id: string;              // 一意のID
  subjectId: string;       // 科目ID
  chapterId: string;       // 章ID
  number: string;          // 問題番号（例：「1-2-3」）
  tags?: string[];         // タグ（オプション）
}

/**
 * 学習スケジュール情報
 */
export interface ProblemSchedule {
  problemId: string;       // 問題ID
  nextReviewDate: Date;    // 次回復習日
  currentInterval: number; // 現在の間隔（日数）
  reviewCount: number;     // 復習回数
  lastReviewDate: Date;    // 最後に復習した日
}

/**
 * 学習履歴
 */
export interface ReviewHistory {
  id: string;              // 履歴ID
  problemId: string;       // 問題ID
  date: Date;              // 学習日
  isCorrect: boolean;      // 正解/不正解
  understandingLevel: UnderstandingLevel; // 理解度
}

/**
 * 理解度レベル
 */
export enum UnderstandingLevel {
  FULL = 'full',     // 理解○
  PARTIAL = 'partial', // 曖昧△
  NONE = 'none'      // 理解できていない×
}

/**
 * 科目情報
 */
export interface Subject {
  id: string;              // 科目ID
  name: string;            // 科目名
}

/**
 * 章情報
 */
export interface Chapter {
  id: string;              // 章ID
  subjectId: string;       // 科目ID
  name: string;            // 章名
  problemCount: number;    // 問題数
}

/**
 * 初期設定データ
 */
export interface InitialSetupData {
  startDate: Date;         // 学習開始日
  problemsSetup: ProblemInitialSetup[]; // 問題の初期設定
}

/**
 * 問題の初期設定データ
 */
export interface ProblemInitialSetup {
  problemId: string;       // 問題ID
  reviewCount: number;     // すでに解いた回数
  lastReviewDate: Date;    // 最後に解いた日
  nextReviewDate: Date;    // 次回解答予定日
  currentInterval: number; // 現在の復習間隔（日数）
}

/**
 * 統計情報
 */
export interface Statistics {
  totalProblems: number;           // 問題総数
  completedProblems: number;       // 完了した問題数
  correctRate: number;             // 正答率
  problemsByUnderstanding: {       // 理解度別問題数
    full: number;
    partial: number;
    none: number;
  };
  subjectPerformance: {            // 科目別パフォーマンス
    subjectId: string;
    correctRate: number;
    problemCount: number;
  }[];
}

/**
 * フィルター条件
 */
export interface FilterOptions {
  subjects?: string[];             // 選択された科目
  chapters?: string[];             // 選択された章
  understandingLevels?: UnderstandingLevel[]; // 選択された理解度
  dateRange?: {                    // 日付範囲
    from: Date;
    to: Date;
  };
  searchKeyword?: string;          // 検索キーワード
}
