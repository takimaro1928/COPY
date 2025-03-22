/**
 * 指定した日数だけ日付を加算する
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * 日本語形式で日付をフォーマットする (YYYY年MM月DD日)
 */
export const formatDateJP = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return `${year}年${month}月${day}日`;
};

/**
 * 曜日を日本語で取得する
 */
export const getDayOfWeekJP = (date: Date): string => {
  const dayOfWeek = date.getDay();
  const daysJP = ['日', '月', '火', '水', '木', '金', '土'];
  return daysJP[dayOfWeek];
};

/**
 * 日本語形式で日付をフォーマットする (YYYY年MM月DD日(曜日))
 */
export const formatDateWithDayOfWeekJP = (date: Date): string => {
  const formattedDate = formatDateJP(date);
  const dayOfWeek = getDayOfWeekJP(date);
  
  return `${formattedDate}(${dayOfWeek})`;
};

/**
 * 2つの日付が同じ日かどうかを判定する
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * 日付が今日かどうかを判定する
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDay(date, today);
};

/**
 * 日付が過去（今日より前）かどうかを判定する
 */
export const isPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
};

/**
 * 次の日（翌日）の日付を取得する
 */
export const getNextDay = (date: Date): Date => {
  return addDays(date, 1);
};

/**
 * 前の日（前日）の日付を取得する
 */
export const getPreviousDay = (date: Date): Date => {
  return addDays(date, -1);
};

/**
 * 月の最初の日の日付を取得する
 */
export const getFirstDayOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(1);
  return result;
};

/**
 * 月の最後の日の日付を取得する
 */
export const getLastDayOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  return result;
};

/**
 * 二つの日付の間の日数を計算する
 */
export const getDaysBetween = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  const timeDiff = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * 時間部分を除いた日付を取得する
 */
export const stripTime = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * ISO形式の日付文字列（YYYY-MM-DD）を取得する
 */
export const getISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * ISO形式の日付文字列（YYYY-MM-DD）からDateオブジェクトを生成する
 */
export const parseISODateString = (dateString: string): Date => {
  return new Date(`${dateString}T00:00:00`);
};

/**
 * 学習間隔を日本語表記で取得する
 */
export const getIntervalTextJP = (days: number): string => {
  if (days === 0) return '初回';
  if (days === 1) return '翌日';
  if (days === 3) return '3日後';
  if (days === 7) return '1週間後';
  if (days === 14) return '2週間後';
  if (days === 30) return '1ヶ月後';
  if (days === 60) return '2ヶ月後';
  
  if (days < 7) return `${days}日後`;
  if (days < 30) return `${Math.floor(days / 7)}週間後`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月後`;
  return `${Math.floor(days / 365)}年後`;
};
