(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HanaFormula = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const categories = {cat4:'香水 Cat.4', cat9:'洗沐／沖洗型 Cat.9', cat10b:'空間噴霧 Cat.10B'};
  // All numeric percentage inputs mean percent points: 1, 1%, and 1％ mean 1%.
  function number(value) {
    const s = String(value ?? '').trim().replace(',', '.');
    return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s) && Number.isFinite(Number(s)) ? Number(s) : null;
  }
  function percent(value) {
    const n = number(String(value ?? '').trim().replace(/[%％]$/, '').trim());
    return n !== null && n >= 0 && n <= 100 ? n : null;
  }
  function fmt(value, digits = 4) {
    if (!Number.isFinite(value)) return '—';
    if (value > 0 && value < Math.pow(10, -digits)) return value.toExponential(2);
    return String(Number(value.toFixed(digits)));
  }
  function materialKey(material) {
    // The same monomer in several records/dilutions must be checked together.
    return material.kind === '單體' && material.cas?.trim()
      ? 'cas:' + material.cas.trim() : 'id:' + String(material.id);
  }
  function safetyRecord(material, category, source) {
    const builtin = source?.rows?.find(row => String(row[0]) === String(material.id));
    if (builtin) {
      const name = source.materialNames?.[String(material.id)];
      if (!name || material.en !== name || material.kind !== '香基') return {reason:'CW 原料識別不一致，請複核'};
      return {limit:builtin[{cat4:1,cat9:2,cat10b:3}[category]], docs:builtin[5],
        source:source.source, amendment:'51st', builtin:true};
    }
    const manual = material.ifraSafety || {};
    if (manual.status === 'prohibited') return {limit:0, docs:'ready', source:manual.source || '學員標記禁用', amendment:manual.amendment || ''};
    const limit = percent(manual[category]);
    if (manual.status !== 'numeric' || limit === null || !manual.source?.trim() || manual.amendment !== '51st') {
      return {reason:'請補此類別的 IFRA 51st 上限與文件來源'};
    }
    return {limit, docs:'manual', source:manual.source, amendment:manual.amendment};
  }
  function calculate(meta, inputRows, materials, source = {}) {
    const mass = number(meta.perfumeCapacity);
    const fragrancePct = percent(meta.perfumeConcentration);
    const category = meta.productCategory || '';
    const materialMap = new Map(materials.map(m => [String(m.id), m]));
    const errors = [];
    if (!(mass > 0)) errors.push('請填入大於 0 的成品總重量（g）');
    if (!(fragrancePct > 0)) errors.push('目標原料濃度須大於 0 且不超過 100%');
    const resultRows = inputRows.map(row => {
      const active = String(row.amount ?? '').trim() !== '' || !!row.materialId;
      const result = {...row, active, stockG:null, effectiveG:null, rowPercentNumber:null,
        targetIngredientG:null, targetEffectiveG:null, finishedPercent:null, errors:[]};
      if (!active) return result;
      result.material = materialMap.get(String(row.materialId));
      if (!result.material) result.errors.push('請選擇有效原料');
      const amount = number(row.amount);
      const concentration = percent(row.concentration);
      if (amount === null) result.errors.push('用量須為 0 或正數');
      if (!(concentration > 0)) result.errors.push('原料稀釋濃度須大於 0 且不超過 100%');
      let conversion = 1;
      if (row.unit === 'mL' || row.unit === '滴') {
        conversion = number(row.conversion);
        if (!(conversion > 0)) result.errors.push(row.unit === 'mL' ? '請填該稀釋液密度（g/mL）' : '請實測每滴重量（g/滴）');
      } else if (row.unit !== 'g') result.errors.push('不支援的單位');
      if (!result.errors.length) {
        result.stockG = amount * conversion;
        result.effectiveG = result.stockG * concentration / 100;
        result.concentrationPercent = concentration;
        if (!Number.isFinite(result.stockG) || !Number.isFinite(result.effectiveG)) result.errors.push('用量超出可計算範圍');
      }
      return result;
    });
    resultRows.forEach((row, i) => row.errors.forEach(error => errors.push(`第 ${i+1} 列：${error}`)));
    const activeRows = resultRows.filter(r => r.active);
    const effectiveTotalG = activeRows.reduce((sum, r) => sum + (r.effectiveG || 0), 0);
    if (!errors.length && !(effectiveTotalG > 0)) errors.push('請輸入至少一項大於 0 的原料用量');
    const valid = !errors.length;
    const targetFragranceG = valid ? mass * fragrancePct / 100 : null;
    let stockTotalG = valid ? 0 : null;
    if (valid) {
      activeRows.forEach(row => {
        row.rowPercentNumber = row.effectiveG / effectiveTotalG * 100;
        row.targetEffectiveG = targetFragranceG * row.rowPercentNumber / 100;
        row.targetIngredientG = row.targetEffectiveG / (row.concentrationPercent / 100);
        row.finishedPercent = row.targetEffectiveG / mass * 100;
        stockTotalG += row.targetIngredientG;
      });
    }
    const solventG = valid ? mass - stockTotalG : null;
    const feasible = valid && solventG >= -1e-9;
    if (valid && !feasible) errors.push('稀釋液需秤總量超過成品重量：請提高原料稀釋濃度，或降低目標原料濃度');
    const groups = new Map();
    activeRows.filter(r => r.material && r.finishedPercent > 0).forEach(row => {
      const key = materialKey(row.material);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    groups.forEach(group => {
      const actual = group.reduce((sum, row) => sum + row.finishedPercent, 0);
      const records = group.map(row => safetyRecord(row.material, category, source));
      const knownLimits = records.map(r => r.limit).filter(n => typeof n === 'number' && Number.isFinite(n));
      const limit = knownLimits.length ? Math.min(...knownLimits) : null;
      const usage = limit > 0 ? actual / limit * 100 : null;
      let level = 'review', label = '待複核';
      const reasons = [];
      if (!feasible) reasons.push('配方用量尚未可執行');
      else if (!categories[category]) reasons.push('請先選擇產品類別');
      else if (limit === 0) {level = 'over'; label = '禁止使用';}
      else if (limit !== null && actual > limit + 1e-10) {level = 'over'; label = '超過上限';}
      else {
        records.forEach(record => {
          if (record.reason) reasons.push(record.reason);
          else if (record.limit == null) reasons.push('此類別 IFRA 上限待複核');
          if (record.docs === 'missing') reasons.push('MSDS 缺件');
          if (record.docs === 'review') reasons.push('IFRA 文件待複核');
          if (record.docs === 'manual') reasons.push('學員輸入資料，待老師複核');
        });
        if (!reasons.length) {
          level = usage >= 80 ? 'near' : 'ok';
          label = usage >= 80 ? '接近上限' : '未超出上限';
        }
      }
      group.forEach(row => {row.safety = {level, label, actual, limit, usage,
        reason:[...new Set(reasons)].join('；'), combinedRows:group.length,
        source:records.map(r => r.source).filter(Boolean).join('；')};});
    });
    const checks = [...groups.values()].map(group => group[0].safety);
    const counts = level => checks.filter(check => check.level === level).length;
    let level = 'neutral', title = '請輸入配方並選擇產品類別';
    if (errors.length) title = errors[0];
    else if (!categories[category]) title = '請先選擇產品類別';
    else if (counts('over')) {level='over'; title=`${counts('over')} 項超量或禁用`;}
    else if (counts('review')) {level='review'; title=`${counts('review')} 項資料待複核`;}
    else if (counts('near')) {level='near'; title='原料未超限，部分接近上限';}
    else if (checks.length) {level='ok'; title='各原料未超出已建檔上限';}
    return {rows:resultRows, errors, valid, feasible, mass, fragrancePct, category,
      targetFragranceG, stockTotalG, solventG, effectiveTotalG,
      summary:{level, title, checked:checks.length, over:counts('over'), near:counts('near'), review:counts('review')}};
  }
  return {number, percent, fmt, categories, calculate};
});
