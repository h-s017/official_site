function isCWMaterial(material) {
  return Object.hasOwn(window.HFUGUE_SAFETY_DATA.materialNames, String(material.id));
}
function materialSafetyFields(material) {
  if (isCWMaterial(material)) return '<div class="fg full safety-note">CW KPIA 原料識別與 51st 上限依內建資料保留；聞香筆記可自行編輯。</div>';
  const s = material.ifraSafety || {};
  return `<div class="fg full safety-fields"><strong>自行新增原料｜IFRA 資料</strong>
    <label for="d_safety_status">檢核設定</label><select id="d_safety_status"><option value="missing">尚無文件／待複核</option><option value="numeric" ${s.status==='numeric'?'selected':''}>依文件填入數值上限</option><option value="prohibited" ${s.status==='prohibited'?'selected':''}>禁止使用</option></select>
    <span class="safety-note">以下上限均為最終成品重量百分比；0 表示禁用，空白表示未知。各類別須依文件分別填寫，不以建議用量代替。學員輸入資料保留待老師複核。</span>
    ${Object.entries(HanaFormula.categories).map(([key,label])=>`<label for="d_safety_${key}">${label} 上限 % w/w</label><input id="d_safety_${key}" inputmode="decimal" value="${esc(s[key] ?? '')}" placeholder="依文件填寫">`).join('')}
    <label for="d_safety_amendment">IFRA 修訂版本</label><input id="d_safety_amendment" value="${esc(s.amendment || '51st')}" placeholder="51st">
    <label for="d_safety_source">供應商／文件名稱、日期或連結</label><input id="d_safety_source" value="${esc(s.source || '')}" placeholder="供應商 IFRA Certificate、日期、來源">
  </div>`;
}
function saveMaterialSafety(material) {
  if (isCWMaterial(material)) return true;
  const safety = {status:document.getElementById('d_safety_status').value,
    amendment:document.getElementById('d_safety_amendment').value.trim(),
    source:document.getElementById('d_safety_source').value.trim()};
  for (const key of Object.keys(HanaFormula.categories)) {
    safety[key] = document.getElementById('d_safety_'+key).value.trim();
    if (safety[key] && HanaFormula.percent(safety[key]) === null) {alert('IFRA 上限須為 0–100 的百分比數值');return false;}
  }
  material.ifraSafety = safety;
  return true;
}
function calculationFor(meta, formulaRows) {
  return HanaFormula.calculate(meta, formulaRows, db, window.HFUGUE_SAFETY_DATA);
}
function renderFormulaCalculation() {
  collectRowsFromDom();
  const calculation = calculationFor(collectMetaFromDom(), rows);
  const g = value => HanaFormula.fmt(value) + (Number.isFinite(value) ? ' g' : '');
  [...document.querySelectorAll('#formulaRows tr')].forEach((tr,i) => {
    const result = calculation.rows[i];
    const row = rows[i];
    row.rowPercentNumber = result.rowPercentNumber;
    row.rowPercent = Number.isFinite(result.rowPercentNumber) ? HanaFormula.fmt(result.rowPercentNumber)+'%' : '';
    row.targetIngredientG = result.targetIngredientG;
    row.targetEffectiveG = result.targetEffectiveG;
    row.safety = result.safety || null;
    tr.querySelector('.r-percent').textContent = row.rowPercent || '—';
    tr.querySelector('.r-target').textContent = g(result.targetIngredientG);
    tr.querySelector('.r-finished').textContent = Number.isFinite(result.finishedPercent) ? HanaFormula.fmt(result.finishedPercent)+'%' : '—';
    const label = tr.querySelector('.conversion-label');
    label.textContent = row.unit === 'mL' ? '密度 g/mL' : row.unit === '滴' ? '每滴 g/滴' : 'g 直接計算';
    const conversion = tr.querySelector('.r-conversion');
    conversion.hidden = row.unit === 'g';
    conversion.setAttribute('aria-label',`第 ${i+1} 列 ${label.textContent}`);
    const cell = tr.querySelector('.safety-cell');
    const s = result.safety;
    const detail = s ? `同原料成品合計 ${HanaFormula.fmt(s.actual)}% · 上限 ${HanaFormula.fmt(s.limit)}%${s.usage!==null?' · 使用率 '+HanaFormula.fmt(s.usage,1)+'%':''}${s.combinedRows>1?' · 已合併 '+s.combinedRows+' 列':''}${s.reason?' · '+s.reason:''}` : result.errors.join('；');
    cell.innerHTML = result.active ? `<span class="safety-badge ${s?.level || 'review'}">${esc(s?.label || (result.errors.length?'待補資料':'待計算'))}</span><div class="safety-numbers">${esc(detail)}</div>` : '—';
  });
  const warning = document.getElementById('mixWarn');
  warning.classList.toggle('show',calculation.errors.length > 0);
  warning.textContent = calculation.errors.join('；');
  const summary = document.getElementById('safetySummary');
  summary.className = 'safety-summary '+calculation.summary.level;
  summary.innerHTML = `<div class="safety-title">${esc(calculation.summary.title)}</div><div class="safety-detail">${esc(HanaFormula.categories[calculation.category] || '尚未選擇類別')} · 已檢核 ${calculation.summary.checked} 項原料 · 超量／禁用 ${calculation.summary.over} · 接近上限 ${calculation.summary.near} · 待複核 ${calculation.summary.review}<br>初篩以成品重量百分比比較；複配共用受限成分仍待成分資料複核。</div>`;
  document.getElementById('totalG').textContent = g(calculation.stockTotalG);
  document.getElementById('totalSolventG').textContent = calculation.feasible ? g(Math.max(0,calculation.solventG)) : '—';
  document.getElementById('totalCapacity').textContent = g(calculation.mass);
  document.getElementById('totalFragranceG').textContent = g(calculation.targetFragranceG);
  storeFormulaState();
  return calculation;
}
function renderFormulaTable() {
  const tbody = document.getElementById('formulaRows');
  if (!tbody) return;
  renderFormulaList();
  tbody.innerHTML = rows.map((r,i)=>`<tr><td>${i+1}</td><td><select class="r-material" aria-label="第 ${i+1} 列原料" onchange="recalc()">${materialOptions(r.materialId)}</select></td><td><input class="r-conc narrow" aria-label="第 ${i+1} 列原料稀釋濃度百分比" value="${esc(r.concentration ?? '100%')}" oninput="recalc()" placeholder="100%"></td><td><input class="r-amount narrow" aria-label="第 ${i+1} 列試配用量" type="number" min="0" step="any" value="${esc(r.amount)}" oninput="recalc()" placeholder="0"></td><td><select class="r-unit" aria-label="第 ${i+1} 列單位" onchange="recalc()">${['g','mL','滴'].map(unit=>`<option ${r.unit===unit?'selected':''}>${unit}</option>`).join('')}</select></td><td><label class="conversion-label"></label><input class="r-conversion" type="number" min="0" step="any" value="${esc(r.conversion || '')}" oninput="recalc()" placeholder="實測值"></td><td class="calc r-percent">—</td><td class="calc r-target">—</td><td class="calc r-finished">—</td><td class="safety-cell">—</td><td><input class="r-reason" aria-label="第 ${i+1} 列選用原因" value="${esc(r.reason)}" oninput="recalc()" placeholder="選用此原料的原因…"></td><td><button class="mini" aria-label="刪除第 ${i+1} 列" onclick="removeRow(${i})">×</button></td></tr>`).join('');
  recalc();
}
function payloadForFormula(meta, formulaRows, id) {
  const calculation = calculationFor(meta,formulaRows);
  return {...meta,formulaId:id,note:meta.designNote || '',perfumeCapacity:calculation.mass,
    calculationVersion:'2026-11-02-weight-v1',percentageBasis:'w/w',
    perfumeConcentrationPercent:calculation.fragrancePct,
    totals:{perfumeCapacityG:calculation.mass,targetFragranceG:calculation.targetFragranceG,
      materialTotalG:calculation.stockTotalG,solventG:calculation.solventG},
    validation:{feasible:calculation.feasible,errors:calculation.errors},
    ifra:{amendment:'51st',source:window.HFUGUE_SAFETY_DATA.provenance,...calculation.summary,scope:'原料逐項初篩；複配受限成分待複核'},
    formula:calculation.rows.map((r,i)=>({index:i+1,materialId:r.materialId,
      materialEn:r.material?.en || '',materialCn:r.material?.cn || '',kind:r.material?.kind || '',types:r.material?.type || [],
      concentration:r.concentration,concentrationPercent:r.concentrationPercent ?? null,
      amount:r.amount,unit:r.unit,conversion:r.conversion || '',rowPercentNumber:r.rowPercentNumber,
      rowPercent:Number.isFinite(r.rowPercentNumber)?HanaFormula.fmt(r.rowPercentNumber)+'%':'',
      targetEffectiveG:r.targetEffectiveG,targetIngredientG:r.targetIngredientG,
      finishedPercent:r.finishedPercent,safety:r.safety || null,reason:r.reason}))};
}
function allFormulaPayloads() {
  saveActiveFormulaFromDom();
  return {schemaVersion:2,activeFormulaId,formulaCount:formulas.length,
    materials:db.filter(m=>!isCWMaterial(m)),
    formulas:formulas.map(f=>({...f,payload:payloadForFormula(f,f.rows || [],f.id)}))};
}
function importMaterialBackup(data, imported) {
  const remap = new Map();
  for (const incoming of (Array.isArray(data.materials) ? data.materials : [])) {
    if (!incoming || !Number.isSafeInteger(Number(incoming.id)) || Number(incoming.id)<=1080 || !incoming.en || isCWMaterial(incoming)) continue;
    let material = normalizeItem(JSON.parse(JSON.stringify(incoming)));
    material.id = Number(material.id);
    const same = db.find(m=>String(m.id)===String(material.id));
    if (same && JSON.stringify(same)!==JSON.stringify(material)) {
      material.id = Math.max(1080,...db.map(m=>+m.id || 0))+1;
    }
    remap.set(String(incoming.id),material.id);
    if (!same || material.id!==same.id) db.push(material);
  }
  imported.forEach(f=>f.rows.forEach(r=>{if(remap.has(String(r.materialId)))r.materialId=remap.get(String(r.materialId));}));
  saveDb();renderLibrary();
}
