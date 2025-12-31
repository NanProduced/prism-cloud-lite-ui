/**
 * Weekday 工具函数
 *
 * 后端 limitWeekday 约定（参考 docs/integration/program-and-schedule.md）：
 * - boolean[7]: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 * - index 0 = 周一 (Monday)
 * - index 6 = 周日 (Sunday)
 *
 * JS Date.getDay() 返回：
 * - 0 = Sunday, 1 = Monday ... 6 = Saturday
 *
 * 因此需要转换函数来对齐两种索引约定
 */

/** 后端索引对应的英文缩写标签 */
export const BACKEND_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** 后端索引对应的中文标签 */
export const BACKEND_WEEKDAY_LABELS_CN = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;

/** 后端索引对应的单字母缩写（用于紧凑展示） */
export const BACKEND_WEEKDAY_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/**
 * 将 JS Date.getDay() 的返回值转换为后端索引
 * JS: 0=Sun, 1=Mon...6=Sat
 * Backend: 0=Mon, 1=Tue...6=Sun
 */
export function jsWeekdayToBackendIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * 将后端索引转换为 JS Date.getDay() 的值
 */
export function backendIndexToJsWeekday(backendIdx: number): number {
  return backendIdx === 6 ? 0 : backendIdx + 1;
}

/**
 * 检查某个 Date 是否在 limitWeekday 允许范围内
 * @param date 要检查的日期
 * @param limitWeekday 后端格式的 boolean[7]
 */
export function isDateAllowedByWeekday(date: Date, limitWeekday: boolean[] | null | undefined): boolean {
  if (!limitWeekday || limitWeekday.length !== 7) return true;
  const backendIdx = jsWeekdayToBackendIndex(date.getDay());
  return limitWeekday[backendIdx] === true;
}

/**
 * 将选中的后端索引数组格式化为可读字符串
 * @param selectedIndices 后端索引数组 (0-6)
 * @param locale 语言，默认 'en'
 */
export function formatWeekdaySelection(selectedIndices: number[], locale: 'en' | 'cn' = 'en'): string {
  if (selectedIndices.length === 0) return '—';
  if (selectedIndices.length === 7) return locale === 'cn' ? '每天' : 'Every day';

  const labels = locale === 'cn' ? BACKEND_WEEKDAY_LABELS_CN : BACKEND_WEEKDAY_LABELS;

  // 检查是否是工作日 (Mon-Fri = 0,1,2,3,4)
  const workdays = [0, 1, 2, 3, 4];
  if (selectedIndices.length === 5 && workdays.every((d) => selectedIndices.includes(d))) {
    return locale === 'cn' ? '周一至周五' : 'Mon - Fri';
  }

  // 检查是否是周末 (Sat-Sun = 5,6)
  const weekend = [5, 6];
  if (selectedIndices.length === 2 && weekend.every((d) => selectedIndices.includes(d))) {
    return locale === 'cn' ? '周末' : 'Sat - Sun';
  }

  // 排序后显示
  const sorted = [...selectedIndices].sort((a, b) => a - b);
  return sorted.map((i) => labels[i]).join(', ');
}

/**
 * 从 boolean[7] 提取选中的索引数组
 */
export function weekdayBooleanToIndices(boolArr: boolean[] | null | undefined): number[] {
  if (!boolArr || boolArr.length !== 7) return [];
  return boolArr.map((b, i) => (b ? i : -1)).filter((i) => i >= 0);
}

/**
 * 从索引数组转换为 boolean[7]
 */
export function indicesToWeekdayBoolean(indices: number[]): boolean[] {
  const arr = new Array(7).fill(false);
  indices.forEach((i) => {
    if (i >= 0 && i < 7) arr[i] = true;
  });
  return arr;
}

/**
 * 格式化时间范围为可读字符串
 */
export function formatTimeRange(start: string | undefined, end: string | undefined): string {
  if (!start || !end) return '—';
  // 只取 HH:mm 部分
  const startShort = start.slice(0, 5);
  const endShort = end.slice(0, 5);
  return `${startShort} - ${endShort}`;
}

/**
 * 格式化日期范围为可读字符串
 */
export function formatDateRange(start: string | undefined, end: string | undefined): string {
  if (!start || !end) return '—';
  return `${start} ~ ${end}`;
}
