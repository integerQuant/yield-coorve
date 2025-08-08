export type NssRow = {
  type: string;         // 'pre' or others
  date: string;         // ISO date (YYYY-MM-DD)
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  l1: number;
  l2: number;
};

export type CurveMode = "spot" | "forward";
