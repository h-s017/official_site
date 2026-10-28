import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
import puppeteer from '/tmp/hana-audit-tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import lighthouse from '/tmp/hana-audit-tools/node_modules/lighthouse/core/index.js';
const out='docs/ux-audit/home-performance-retest';
const rows=[];
for(let n=1;n<=3;n++){
 if(fs.existsSync(`${out}/returning-${n}-home-mobile.json.gz`))throw Error('Refusing to overwrite saved measurement');
 const browser=await puppeteer.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox',`--proxy-server=${process.env.HTTPS_PROXY}`,'--proxy-bypass-list=127.0.0.1;localhost']});
 try{
  const page=await browser.newPage();
  await page.evaluateOnNewDocument(()=>{try{sessionStorage.setItem('hana-intro-restored-seen','1');}catch{}});
  const result=await lighthouse('https://hanascent.com/',{onlyCategories:['performance','accessibility'],logLevel:'error',maxWaitForLoad:45000},undefined,page);
  if(!result?.lhr||result.lhr.runtimeError)throw Error(JSON.stringify(result?.lhr.runtimeError));
  const r=result.lhr;fs.writeFileSync(`${out}/returning-${n}-home-mobile.json.gz`,gzipSync(JSON.stringify(r)));
  const seen=await page.evaluate(()=>({seen:sessionStorage.getItem('hana-intro-restored-seen'),introOpen:document.querySelector('#intro-screen')?.open}));
  if(seen.introOpen!==false)throw Error('Returning session flag did not suppress intro');
  rows.push({run:n,scores:Object.fromEntries(Object.entries(r.categories).map(([k,v])=>[k,v.score])),metrics:Object.fromEntries(['largest-contentful-paint','total-blocking-time','cumulative-layout-shift','first-contentful-paint','speed-index'].map(k=>[k,r.audits[k].numericValue])),seen,fetchTime:r.fetchTime,report:`returning-${n}-home-mobile.json.gz`});
  fs.writeFileSync(`${out}/returning-summary.json`,JSON.stringify(rows,null,2));
  console.log('Returning mobile',n,rows.at(-1).scores);
 }finally{await browser.close();}
}
