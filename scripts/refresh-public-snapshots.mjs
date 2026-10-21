// Render existing published CMS records with the site's own renderers. No CMS writes.
// Usage: node scripts/refresh-public-snapshots.mjs posts.json announcements.json
import fs from 'node:fs';
import vm from 'node:vm';
const posts = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const announcements = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const makeClient = data => ({from(){const query={select(){return this},eq(){return this},order(){return this},then(resolve){return Promise.resolve(resolve({data,error:null}))}};return query}});
const makeRoot = () => ({innerHTML:'',hidden:true,dataset:{hanaBlogLimit:'6'}});
const roots = {latest:makeRoot(),featured:makeRoot(),all:makeRoot()};
const context={window:{HANA_CMS_CONFIG:{supabaseUrl:'snapshot',supabaseAnonKey:'snapshot'},supabase:{createClient:()=>makeClient(posts)}},document:{querySelector:s=>s==='[data-journal-latest]'?roots.latest:s==='[data-journal-featured]'?roots.featured:s==='[data-hana-blog]'?roots.all:null,getElementById:()=>null},Intl,Date,console,encodeURIComponent};
vm.runInNewContext(fs.readFileSync('assets/journal-posts.js','utf8'),context);
await new Promise(resolve=>setImmediate(resolve));
let html=fs.readFileSync('journal/index.html','utf8');
for(const [key,attribute] of [['latest','data-journal-latest'],['featured','data-journal-featured'],['all','data-hana-blog']]){
 const rx=new RegExp(`(<section\\b[^>]*\\b${attribute}\\b[^>]*>)[\\s\\S]*?(<\\/section>)`);
 if(!roots[key].innerHTML && !roots[key].hidden)throw Error('Missing rendered '+key);
 html=html.replace(rx,(_,open,close)=>(roots[key].hidden?open:open.replace(/\s+hidden(?=[\s>])/g,''))+roots[key].innerHTML+close);
}
const direction=body=>String(body||'').match(/<!--\s*reading-direction:\s*([a-z-]+)\s*-->/i)?.[1]||'olfactory-culture';
const date=value=>value?new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'long',day:'numeric'}).format(new Date(value)):'';
const safe=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/&/g,'\\u0026');
const fingerprint=posts.map(p=>[p.slug||'',p.title||'',p.summary||'',p.cover_url||'',p.published_at||'',direction(p.body),p.featured===true]);
html=html.replace(/\s*<!-- Published CMS snapshot:[\s\S]*?-->/g,'');
html=html.replace(/\s*<script id="journal-snapshot-data"[^>]*>[\s\S]*?<\/script>/,'');
html=html.replace('  <script src="/assets/site.js',`  <!-- Published CMS snapshot: ${new Date().toISOString()}; refresh with this script alongside CMS publication. -->\n  <script id="journal-snapshot-data" type="application/json">${safe(fingerprint)}</script>\n  <script src="/assets/site.js`);
fs.writeFileSync('journal/index.html',html);
let news=fs.readFileSync('news/index.html','utf8');
const inline=fs.readFileSync('assets/news-archive.js','utf8');
const newsRoot=makeRoot();newsRoot.hidden=false;
vm.runInNewContext(inline,{window:{HANA_CMS_CONFIG:{supabaseUrl:'snapshot',supabaseAnonKey:'snapshot'},supabase:{createClient:()=>makeClient(announcements)}},document:{querySelector:()=>newsRoot,getElementById:()=>null},Intl,Date,console});
await new Promise(resolve=>setImmediate(resolve));
if(!newsRoot.innerHTML.includes('news-archive-row') && announcements.length)throw Error('News snapshot missing');
news=news.replace(/(<div class="news-archive-list"[^>]*>)[\s\S]*?(\n        <\/div>)/,(_,open,close)=>open+'\n          '+newsRoot.innerHTML+close);
news=news.replace(/\s*<!-- Published CMS snapshot:[\s\S]*?-->/g,'');
news=news.replace(/\s*<script id="news-snapshot-data"[^>]*>[\s\S]*?<\/script>/,'');
const newsFingerprint=announcements.map(x=>[x.title||'',x.content||'',x.link_url||'',x.starts_at||'',x.created_at||'',x.category||'']);
news=news.replace('  <script src="/assets/site.js',`  <!-- Published CMS snapshot: ${new Date().toISOString()}; retains the existing announcement text. -->\n  <script id="news-snapshot-data" type="application/json">${safe(newsFingerprint)}</script>\n  <script src="/assets/site.js`);
fs.writeFileSync('news/index.html',news);
console.log(`Rendered ${posts.length} published posts and ${announcements.length} announcements without changing CMS data.`);
// The archive shares the same published records and keeps its existing order/count/copy.
const archiveRoot=makeRoot(),archiveCount={textContent:''};
vm.runInNewContext(fs.readFileSync('assets/journal-all.js','utf8'),{window:{HANA_CMS_CONFIG:{supabaseUrl:'snapshot',supabaseAnonKey:'snapshot'},supabase:{createClient:()=>makeClient(posts)}},document:{querySelector:s=>s==='[data-archive-list]'?archiveRoot:s==='[data-archive-count]'?archiveCount:null,getElementById:()=>null},Intl,Date,console,encodeURIComponent});
await new Promise(resolve=>setImmediate(resolve));
if(!archiveRoot.innerHTML.includes('archive-item') && posts.length)throw Error('Archive snapshot missing');
let archive=fs.readFileSync('journal/all/index.html','utf8');
archive=archive.replace(/(<section class="archive-list"[^>]*>)[\s\S]*?(<\/section>)/,(_,open,close)=>open+archiveRoot.innerHTML+close);
archive=archive.replace(/(<span class="archive-count"[^>]*>)[\s\S]*?(<\/span>)/,(_,open,close)=>open+archiveCount.textContent+close);
archive=archive.replace(/\s*<script id="archive-snapshot-data"[^>]*>[\s\S]*?<\/script>/,'');
const archiveFingerprint=posts.map(p=>[p.slug||'',p.title||'',p.summary||'',p.cover_url||'',p.published_at||'',direction(p.body)]);
archive=archive.replace('  <script src="/assets/site.js',`  <script id="archive-snapshot-data" type="application/json">${safe(archiveFingerprint)}</script>\n  <script src="/assets/site.js`);
fs.writeFileSync('journal/all/index.html',archive);
