export type NSSParams = {
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  l1: number;
  l2: number;
};

export function computeNSSCurve(
  params: NSSParams,
  tenors: number[] = [0.25, 0.5, 1, 2, 3, 4, 5, 10]
) {
  const { b1, b2, b3, b4, l1, l2 } = params;

  const tSafe = tenors.map((t) => (t === 0 ? 1e-12 : t));

  const exp_l1_t = tSafe.map((t) => Math.exp(-l1 * t));
  const exp_l2_t = tSafe.map((t) => Math.exp(-l2 * t));

  const term2 = tSafe.map((t, i) => (1 - exp_l1_t[i]) / (l1 * t));
  const term3 = term2.map((v, i) => v - exp_l1_t[i]);
  const term4 = tSafe.map((t, i) => (1 - exp_l2_t[i]) / (l2 * t) - exp_l2_t[i]);

  const spot = tSafe.map((_t, i) => b1 + b2 * term2[i] + b3 * term3[i] + b4 * term4[i]);

  const forward = tenors.map((t, i) =>
    b1
    + b2 * exp_l1_t[i]
    + b3 * l1 * t * exp_l1_t[i]
    + b4 * l2 * t * exp_l2_t[i]
  );

  return { t: tenors, spot, forward };
}
