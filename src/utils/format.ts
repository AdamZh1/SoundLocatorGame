// 12345.6 -> '12,346'
export const formatInt = (n: number): string => Math.round(n).toLocaleString('en-US');
