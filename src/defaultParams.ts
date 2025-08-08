import { NSSParams } from "./nss";

export type CurveType = "pre" | "ipca";

export const latestByType: Record<CurveType, { date: string; params: NSSParams }> = {
  pre: {
    date: "2025-08-07",
    params: {
      b1: 0.060553,
      b2: 0.082648,
      b3: 0.102802,
      b4: 0.229391,
      l1: 1.965289,
      l2: 0.16948
    }
  },
  ipca: {
    date: "2025-08-07",
    params: {
      b1: 0.067369,
      b2: 0.07412,
      b3: -0.068101,
      b4: 0.026559,
      l1: 0.997333,
      l2: 0.516151
    }
  }
};
