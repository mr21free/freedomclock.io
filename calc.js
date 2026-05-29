// Pure computation functions — no global state.
// btcPrice must be passed explicitly so these are testable in Node.js.

function computeYearsSell(assets, annualSpend, annualIncome, inflR, incomeGrowthR, mSavings, btcPrice) {
  mSavings  = mSavings  || 0;
  btcPrice  = btcPrice  || 0;
  if (annualSpend <= 0) return Infinity;
  const total = assets.reduce((s, a) => s + (a.unit === "btc" ? a.amount * btcPrice : a.amount), 0);
  if (total <= 0 && annualIncome < annualSpend) return 0;
  const pools = [...assets]
    .map(a => ({ value: a.unit === "btc" ? a.amount * btcPrice : a.amount, mul: Math.pow(1 + a.growth / 100, 1 / 12) }))
    .sort((a, b) => a.mul - b.mul);
  const inflMo    = Math.pow(1 + inflR,         1 / 12) - 1;
  const incGrowMo = Math.pow(1 + incomeGrowthR, 1 / 12) - 1;
  let mSpend  = annualSpend  / 12;
  let mIncome = annualIncome / 12;
  let m = 0;
  while (m < 200 * 12) {
    for (const p of pools) p.value *= p.mul;
    const needed = Math.max(0, mSpend - mIncome);
    const avail  = pools.reduce((s, p) => s + p.value, 0);
    if (avail < needed) break;
    let draw = needed;
    for (const p of pools) { if (draw <= 0) break; const take = Math.min(p.value, draw); p.value -= take; draw -= take; }
    if (mSavings > 0) { const tv = pools.reduce((s,p)=>s+p.value,0); if (tv>0) for (const p of pools) p.value += mSavings*(p.value/tv); }
    mSpend  *= (1 + inflMo);
    mIncome *= (1 + incGrowMo);
    m++;
  }
  if (m >= 200 * 12) return Infinity;
  const finalW  = Math.max(0, mSpend - mIncome);
  const rem     = pools.reduce((s, p) => s + p.value, 0);
  const partial = (finalW > 0 && rem > 0) ? Math.min(rem / finalW, 0.999) : 0;
  return (m + partial) / 12;
}

function computeYearsBorrow(assets, annualSpend, annualIncome, inflR, incomeGrowthR, mSavings, btcPrice) {
  mSavings = mSavings || 0;
  btcPrice = btcPrice || 0;
  if (annualSpend <= 0) return Infinity;
  const borrowable = assets.filter(a => a.borrowable && a.borrowRate > 0);
  if (borrowable.length === 0) return computeYearsSell(assets, annualSpend, annualIncome, inflR, incomeGrowthR, mSavings, btcPrice);
  const pools = assets.map(a => ({
    value:      a.unit === "btc" ? a.amount * btcPrice : a.amount,
    growthMul:  1 + a.growth / 100,
    borrowable: a.borrowable && a.borrowRate > 0,
    borrowRate: a.borrowRate / 100,
    debt:       0,
  }));
  let spendAdj = annualSpend, incomeAdj = annualIncome;
  for (let y = 0; y < 300; y++) {
    for (const p of pools) p.value *= p.growthMul;
    const bPools     = pools.filter(p => p.borrowable);
    const collateral = bPools.reduce((s, p) => s + p.value, 0);
    for (const p of bPools) p.debt *= (1 + p.borrowRate);
    const totalDebt  = bPools.reduce((s, p) => s + p.debt, 0);
    const borrow     = Math.max(0, spendAdj - incomeAdj);
    if (totalDebt + borrow > collateral) {
      const partial = (borrow > 0 && collateral > totalDebt) ? Math.min((collateral - totalDebt) / borrow, 0.999) : 0;
      return y + partial;
    }
    for (const p of bPools) p.debt += borrow * (p.value / collateral);
    if (mSavings > 0) { const tv = pools.reduce((s,p)=>s+p.value,0); if (tv>0) for (const p of pools) p.value += mSavings*12*(p.value/tv); }
    spendAdj  *= (1 + inflR);
    incomeAdj *= (1 + incomeGrowthR);
  }
  return Infinity;
}

function computeYearsBorrowSell(assets, annualSpend, annualIncome, inflR, incomeGrowthR, mSavings, btcPrice) {
  mSavings = mSavings || 0;
  btcPrice = btcPrice || 0;
  if (annualSpend <= 0) return Infinity;
  const hasBorrowable = assets.some(a => a.borrowable && a.borrowRate > 0);
  if (!hasBorrowable) return computeYearsSell(assets, annualSpend, annualIncome, inflR, incomeGrowthR, mSavings, btcPrice);
  const pools = assets.map(a => ({
    value:      a.unit === "btc" ? a.amount * btcPrice : a.amount,
    growthMul:  1 + a.growth / 100,
    sellMul:    Math.pow(1 + a.growth / 100, 1 / 12),
    borrowable: a.borrowable && a.borrowRate > 0,
    borrowRate: a.borrowRate / 100,
    debt:       0,
  }));
  const sortedPools = pools.slice().sort((a, b) => a.sellMul - b.sellMul);
  let spendAdj = annualSpend, incomeAdj = annualIncome;
  let y = 0;
  for (; y < 300; y++) {
    for (const p of pools) p.value *= p.growthMul;
    const bPools     = pools.filter(p => p.borrowable);
    const collateral = bPools.reduce((s, p) => s + p.value, 0);
    for (const p of bPools) p.debt *= (1 + p.borrowRate);
    const totalDebt  = bPools.reduce((s, p) => s + p.debt, 0);
    const borrow     = Math.max(0, spendAdj - incomeAdj);
    if (totalDebt + borrow > collateral) break;
    for (const p of bPools) p.debt += borrow * (p.value / collateral);
    if (mSavings > 0) { const tv = pools.reduce((s,p)=>s+p.value,0); if (tv>0) for (const p of pools) p.value += mSavings*12*(p.value/tv); }
    spendAdj  *= (1 + inflR);
    incomeAdj *= (1 + incomeGrowthR);
  }
  if (y >= 300) return Infinity;
  let debt = pools.filter(p => p.borrowable).reduce((s, p) => s + p.debt, 0);
  for (const p of sortedPools) { if (debt <= 0) break; const take = Math.min(p.value, debt); p.value -= take; debt -= take; }
  if (debt > 0) return y;
  const inflMo    = Math.pow(1 + inflR, 1 / 12) - 1;
  const incGrowMo = Math.pow(1 + incomeGrowthR, 1 / 12) - 1;
  let mSpend  = spendAdj  / 12;
  let mIncome = incomeAdj / 12;
  let m = 0;
  while (y * 12 + m < 300 * 12) {
    for (const p of pools) p.value *= p.sellMul;
    const needed = Math.max(0, mSpend - mIncome);
    const avail  = pools.reduce((s, p) => s + p.value, 0);
    if (avail < needed) {
      const partial = (needed > 0 && avail > 0) ? Math.min(avail / needed, 0.999) : 0;
      return y + (m + partial) / 12;
    }
    let draw = needed;
    for (const p of sortedPools) { if (draw <= 0) break; const take = Math.min(p.value, draw); p.value -= take; draw -= take; }
    if (mSavings > 0) { const tv = pools.reduce((s,p)=>s+p.value,0); if (tv>0) for (const p of pools) p.value += mSavings*(p.value/tv); }
    mSpend  *= (1 + inflMo);
    mIncome *= (1 + incGrowMo);
    m++;
  }
  return Infinity;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { computeYearsSell, computeYearsBorrow, computeYearsBorrowSell };
}
