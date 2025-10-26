import { NSSParams } from "./nss";

export type CurveType = "pre" | "ipca";

export const latestByType: Record<CurveType, { date: string; params: NSSParams }> = {
  pre: {
    date: "2025-10-24",
    params: {
      b1: 0.0598610801944598,
      b2: 0.0869388536736906,
      b3: 0.0842354555655496,
      b4: 0.231379843273622,
      l1: 2.07202332958467,
      l2: 0.180144890140754
    }
  },
  ipca: {
    date: "2025-10-24",
    params: {
      b1: 0.066965141373927,
      b2: 0.0706083679069316,
      b3: -0.0578173000714305,
      b4: 0.0308668463952699,
      l1: 1.23831155069954,
      l2: 0.470280636383917
    }
  }
};
