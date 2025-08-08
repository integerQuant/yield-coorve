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
  const term4 = tSafe.map(
    (t, i) => (1 - exp_l2_t[i]) / (l2 * t) - exp_l2_t[i]
  );

  const y_tau = tSafe.map(
    (_t, i) => b1 + b2 * term2[i] + b3 * term3[i] + b4 * term4[i]
  );

  // Derivatives w.r.t. tau (tenor) for instantaneous forward calculation
  const dterm2_dtau = tSafe.map(
    (t, i) => (l1 * t * exp_l1_t[i] - (1 - exp_l1_t[i])) / (l1 * t * t)
  );
  const dterm3_dtau = tSafe.map((_, i) => dterm2_dtau[i] + l1 * exp_l1_t[i]);
  const dterm4_dtau = tSafe.map(
    (t, i) =>
      ((l2 * t * exp_l2_t[i] - (1 - exp_l2_t[i])) / (l2 * t * t)) +
      l2 * exp_l2_t[i]
  );

  const dy_dtau = tSafe.map(
    (_t, i) => b2 * dterm2_dtau[i] + b3 * dterm3_dtau[i] + b4 * dterm4_dtau[i]
  );

  const f_tau = tSafe.map((t, i) => y_tau[i] + t * dy_dtau[i]);

  return { t: tenors, spot: y_tau, forward: f_tau };
}
