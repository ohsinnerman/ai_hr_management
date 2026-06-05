// Pure payroll math — single source of truth for the Phase 4 formulas.
// Imported by the worker (to compute) and by tests (to assert expectations).

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// transport/medical/special/meal are monthly; lta is annual → /12.
export const monthlyAllowances = (a = {}) =>
  (a.transport || 0) + (a.medical || 0) + (a.special || 0) + (a.meal || 0) + (a.lta || 0) / 12;

/**
 * Compute a single employee's payroll for one month.
 * @param {object} ss  SalaryStructure (annual basic/hra/da/ctc, monthly allowances, deduction pcts)
 * @param {number} paidDays
 * @param {number} totalWorkingDays
 */
export const computePayroll = (ss, paidDays, totalWorkingDays) => {
  const monthlyBasic = (ss.basic || 0) / 12;
  const monthlyHra = (ss.hra || 0) / 12;
  const monthlyDa = (ss.da || 0) / 12;
  const monthlyAllow = monthlyAllowances(ss.allowances);

  const proration = totalWorkingDays > 0 ? paidDays / totalWorkingDays : 0;
  const monthlyGross = (monthlyBasic + monthlyHra + monthlyDa + monthlyAllow) * proration;

  const ded = ss.deductions || {};
  const pfEmployee = monthlyBasic * ((ded.pfEmployeePct ?? 12) / 100); // on basic, not prorated
  const esiEmployee = monthlyGross <= 21000 ? monthlyGross * 0.0075 : 0;
  const pt = ded.ptMonthly ?? 200;
  const tds = (ss.ctc || 0) > 500000 ? ((ss.ctc || 0) * 0.05) / 12 : 0;

  const totalDeductions = pfEmployee + esiEmployee + pt + tds;
  const netSalary = monthlyGross - totalDeductions;

  return {
    monthlyBasic, monthlyHra, monthlyDa, monthlyAllow,
    proration, monthlyGross,
    pfEmployee, esiEmployee, pt, tds,
    totalDeductions, netSalary,
  };
};
