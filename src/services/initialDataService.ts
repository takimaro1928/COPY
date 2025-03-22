// src/services/initialDataService.ts

import { v4 as uuidv4 } from 'uuid';
import { Subject, Chapter, Problem } from '../models/types';

/**
 * 初期科目データを生成
 */
export const getInitialSubjects = (): Subject[] => {
  return [
    {
      id: 'management',
      name: '経営管理論'
    },
    {
      id: 'operations',
      name: '運営管理'
    },
    {
      id: 'economics',
      name: '経済学'
    },
    {
      id: 'information',
      name: '経営情報システム'
    },
    {
      id: 'legal',
      name: '経営法務'
    },
    {
      id: 'sme',
      name: '中小企業経営・中小企業政策'
    }
  ];
};

/**
 * 経営管理論の章データを生成
 */
export const getManagementChapters = (): Chapter[] => {
  return [
    {
      id: 'management-1-1',
      subjectId: 'management',
      name: '企業活動と経営戦略の全体概要 Q1-1',
      problemCount: 2
    },
    {
      id: 'management-1-2',
      subjectId: 'management',
      name: '事業戦略（競争戦略） Q1-2',
      problemCount: 16
    },
    {
      id: 'management-1-3',
      subjectId: 'management',
      name: '企業戦略（成長戦略） Q1-3',
      problemCount: 27
    },
    {
      id: 'management-1-4',
      subjectId: 'management',
      name: '技術経営 Q1-4',
      problemCount: 14
    },
    {
      id: 'management-1-5',
      subjectId: 'management',
      name: '企業の社会的責任（CSR）とコーポレートガバナンス Q1-5',
      problemCount: 5
    },
    {
      id: 'management-2-1',
      subjectId: 'management',
      name: '組織構造論 Q2-1',
      problemCount: 18
    },
    {
      id: 'management-2-2',
      subjectId: 'management',
      name: '組織行動論 Q2-2',
      problemCount: 21
    },
    {
      id: 'management-2-3',
      subjectId: 'management',
      name: '人的資源管理 Q2-3',
      problemCount: 12
    },
    {
      id: 'management-3-1',
      subjectId: 'management',
      name: 'マーケティングの基礎概念 Q3-1',
      problemCount: 2
    },
    {
      id: 'management-3-2',
      subjectId: 'management',
      name: 'マーケティングマネジメント戦略の展開 Q3-2',
      problemCount: 5
    },
    {
      id: 'management-3-3',
      subjectId: 'management',
      name: 'マーケティングリサーチ Q3-3',
      problemCount: 4
    },
    {
      id: 'management-3-4',
      subjectId: 'management',
      name: '消費者購買行動と組織購買行動 Q3-4',
      problemCount: 8
    },
    {
      id: 'management-3-5',
      subjectId: 'management',
      name: '製品戦略 Q3-5',
      problemCount: 13
    },
    {
      id: 'management-3-6',
      subjectId: 'management',
      name: '価格戦略 Q3-6',
      problemCount: 8
    },
    {
      id: 'management-3-7',
      subjectId: 'management',
      name: 'チャネル・物流戦略 Q3-7',
      problemCount: 7
    },
    {
      id: 'management-3-8',
      subjectId: 'management',
      name: 'プロモーション戦略 Q3-8',
      problemCount: 7
    },
    {
      id: 'management-3-9',
      subjectId: 'management',
      name: '関係性マーケティングとデジタルマーケティング Q3-9',
      problemCount: 4
    }
  ];
};

/**
 * 運営管理の章データを生成
 */
export const getOperationsChapters = (): Chapter[] => {
  return [
    {
      id: 'operations-1-1',
      subjectId: 'operations',
      name: '生産管理概論 Q1-1',
      problemCount: 10
    },
    {
      id: 'operations-1-2',
      subjectId: 'operations',
      name: '生産のプランニング Q1-2',
      problemCount: 52
    },
    {
      id: 'operations-1-3',
      subjectId: 'operations',
      name: '生産のオペレーション Q1-3',
      problemCount: 35
    },
    {
      id: 'operations-1-4',
      subjectId: 'operations',
      name: '製造業における情報システム Q1-4',
      problemCount: 6
    },
    {
      id: 'operations-2-1',
      subjectId: 'operations',
      name: '店舗・商業集積 Q2-1',
      problemCount: 9
    },
    {
      id: 'operations-2-2',
      subjectId: 'operations',
      name: '商品仕入・販売（マーチャンダイジング） Q2-2',
      problemCount: 23
    },
    {
      id: 'operations-2-3',
      subjectId: 'operations',
      name: '物流・輸配送管理 Q2-3',
      problemCount: 18
    },
    {
      id: 'operations-2-4',
      subjectId: 'operations',
      name: '販売流通情報システム Q2-4',
      problemCount: 17
    }
  ];
};

/**
 * 経済学の章データを生成
 */
export const getEconomicsChapters = (): Chapter[] => {
  return [
    {
      id: 'economics-1',
      subjectId: 'economics',
      name: '企業行動の分析 Q1',
      problemCount: 19
    },
    {
      id: 'economics-2',
      subjectId: 'economics',
      name: '消費者行動の分析 Q2',
      problemCount: 22
    },
    {
      id: 'economics-3',
      subjectId: 'economics',
      name: '市場均衡と厚生分析 Q3',
      problemCount: 23
    },
    {
      id: 'economics-4',
      subjectId: 'economics',
      name: '不完全競争 Q4',
      problemCount: 15
    },
    {
      id: 'economics-5',
      subjectId: 'economics',
      name: '市場の失敗と政府の役割 Q5',
      problemCount: 15
    },
    {
      id: 'economics-6',
      subjectId: 'economics',
      name: '国民経済計算と主要経済指標 Q6',
      problemCount: 13
    },
    {
      id: 'economics-7',
      subjectId: 'economics',
      name: '財市場の分析 Q7',
      problemCount: 11
    },
    {
      id: 'economics-8',
      subjectId: 'economics',
      name: '貨幣市場とIS-LM分析 Q8',
      problemCount: 14
    },
    {
      id: 'economics-9',
      subjectId: 'economics',
      name: '雇用と物価水準 Q9',
      problemCount: 8
    },
    {
      id: 'economics-10',
      subjectId: 'economics',
      name: '消費、投資、財政金融政策に関する理論 Q10',
      problemCount: 11
    },
    {
      id: 'economics-11',
      subjectId: 'economics',
      name: '国際マクロ経済 Q11',
      problemCount: 6
    },
    {
      id: 'economics-12',
      subjectId: 'economics',
      name: '景気循環と経済成長 Q12',
      problemCount: 3
    }
  ];
};

/**
 * 経営情報システムの章データを生成
 */
export const getInformationChapters = (): Chapter[] => {
  return [
    {
      id: 'information-1',
      subjectId: 'information',
      name: '情報技術に関する基礎知識 Q1',
      problemCount: 178
    },
    {
      id: 'information-2',
      subjectId: 'information',
      name: 'ソフトウェア開発 Q2',
      problemCount: 38
    },
    {
      id: 'information-3',
      subjectId: 'information',
      name: '経営情報管理 Q3',
      problemCount: 35
    },
    {
      id: 'information-4',
      subjectId: 'information',
      name: '統計解析 Q4',
      problemCount: 9
    }
  ];
};

/**
 * 経営法務の章データを生成
 */
export const getLegalChapters = (): Chapter[] => {
  return [
    {
      id: 'legal-1',
      subjectId: 'legal',
      name: '民法その他の知識 Q1',
      problemCount: 54
    },
    {
      id: 'legal-2',
      subjectId: 'legal',
      name: '会社法等に関する知識 Q2',
      problemCount: 123
    },
    {
      id: 'legal-3',
      subjectId: 'legal',
      name: '資本市場に関する知識 Q3',
      problemCount: 12
    },
    {
      id: 'legal-4',
      subjectId: 'legal',
      name: '倒産等に関する知識 Q4',
      problemCount: 16
    },
    {
      id: 'legal-5',
      subjectId: 'legal',
      name: '知的財産権等に関する知識 Q5',
      problemCount: 107
    },
    {
      id: 'legal-6',
      subjectId: 'legal',
      name: 'その他経営法務に関する知識 Q6',
      problemCount: 19
    }
  ];
};

/**
 * 全科目の章データを生成
 */
export const getAllChapters = (): Chapter[] => {
  return [
    ...getManagementChapters(),
    ...getOperationsChapters(),
    ...getEconomicsChapters(),
    ...getInformationChapters(),
    ...getLegalChapters()
  ];
};

/**
 * 章に基づいて問題データを生成
 */
export const generateProblemsForChapter = (chapter: Chapter): Problem[] => {
  const problems: Problem[] = [];
  
  // 章の問題数に基づいて問題を生成
  for (let i = 1; i <= chapter.problemCount; i++) {
    const problemNumber = chapter.name.includes('Q') 
      ? `${chapter.name.split('Q')[1]}-${i}` 
      : `${chapter.id}-${i}`;
    
    problems.push({
      id: uuidv4(),
      subjectId: chapter.subjectId,
      chapterId: chapter.id,
      number: problemNumber
    });
  }
  
  return problems;
};

/**
 * 全問題データを生成
 */
export const generateAllProblems = (): Problem[] => {
  const chapters = getAllChapters();
  let allProblems: Problem[] = [];
  
  chapters.forEach(chapter => {
    const chapterProblems = generateProblemsForChapter(chapter);
    allProblems = [...allProblems, ...chapterProblems];
  });
  
  return allProblems;
};

/**
 * 初期データのセットアップ
 */
export const setupInitialData = () => {
  const subjects = getInitialSubjects();
  const chapters = getAllChapters();
  const problems = generateAllProblems();
  
  return {
    subjects,
    chapters,
    problems
  };
};
