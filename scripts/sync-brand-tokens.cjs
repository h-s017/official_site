// Reuse the official site's font definitions and neutral palette without its page layout selectors.
const fs=require('node:fs');
const official=fs.readFileSync('assets/style.css','utf8');
const faces=official.match(/@font-face\{[^}]*\}/g)||[];
const root=official.match(/:root\s*\{[^}]*\}/)?.[0];
if(!faces.length||!root)throw Error('Official brand definitions missing');
fs.writeFileSync('assets/hana-brand.css','/* Generated from assets/style.css by scripts/sync-brand-tokens.cjs. */\n'+faces.join('\n')+'\n'+root+'\n:root{--hana-text:#303234;--hana-font-text:"Noto Serif TC","Source Han Serif TC","Source Han Serif","思源宋體","Songti TC","PMingLiU",serif;--hana-surface:#ffffff;--hana-surface-soft:#f7f7f7;}\n');
