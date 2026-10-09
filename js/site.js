/* js/site.js — router */
const K='theme',root=document.documentElement,SF=' | Rakib Hasan',RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
let st;try{st=localStorage.getItem(K)}catch{}
if(st)root.classList.toggle('dark',st==='dark');
const $=(s,r)=>(r||document).querySelector(s);
const E=(t,c,x)=>{const n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n};
const P=k=>{try{return new URLSearchParams(location.search).get(k)}catch{return null}};
const slug=()=>{
 const m=location.pathname.match(/\/a\/([a-z0-9-]+)(?:\.html)?\/?$/i);if(m)return m[1];
 const a=P('a');if(a)return a;
 const h=location.hash.match(/^#a[=/]([a-z0-9-]+)$/i);return h?h[1]:null};
let _m=null;
async function manifest(){
 if(_m)return _m;
 try{const r=await fetch('/articles/manifest.json');_m=r.ok?await r.json():[]}catch{_m=[]}
 return Array.isArray(_m)?_m:(_m=[])};
function ent(){const p=$('.page')||document.body;let e=$('.entry',p);
 if(!e){e=E('section','entry');($('.prose',p)||p).appendChild(e)}
 if(e.hidden)e.hidden=false;return e}
function ttl(e){let t=e.querySelector('.entry-title');if(t)return t;
 for(const c of e.children)if(c.tagName==='H1')return c;
 t=E('h1','entry-title');e.insertBefore(t,e.firstChild);return t}
function bod(e,t){for(const c of e.children)if(c!==t&&c.classList&&c.classList.contains('prose'))return c;
 const b=E('div','prose');e.appendChild(b);return b}
async function view(s,md){
 const meta=(await manifest()).find(m=>m.slug===s&&!m.draft),e=ent(),h=ttl(e),b=bod(e,h);
 if(!meta){document.title='No such entry'+SF;h.textContent='No such entry';b.textContent='';
  b.appendChild(E('p',null,'No entry “'+s+'”'));
  const a=E('a',null,'All articles');a.href='articles.html';b.appendChild(a);return}
 let raw='';try{const r=await fetch('/articles/'+s+'.md');raw=r.ok?await r.text():''}catch{}
 let d={},t=raw;try{if(md&&md.parseFrontMatter){const f=md.parseFrontMatter(raw);d=f.data||{};t=f.body||''}}catch{}
 h.textContent=d.title||meta.title||s;document.title=h.textContent+SF;
 let html=null;try{if(md&&md.renderMarkdown)html=md.renderMarkdown(t)}catch{}
 if(html!=null)b.innerHTML=html;else b.textContent=t;/* renderer output only */
 if(!RM)e.classList.add('enter')}
async function list(){
 const all=(await manifest()).filter(m=>!m.draft).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 const tag=P('tag'),p=$('[data-page="articles"]')||$('.page')||document.body;
 const mount=p.querySelector('.entry-list,[data-articles],.article-list'),host=mount||p.querySelector('.prose')||p;
 if(mount)mount.textContent='';
 const ol=host.tagName==='OL'||host.tagName==='UL'?host:E('ol','entry-list');
 for(const m of all){
  if(tag&&!(m.tags||[]).includes(tag))continue;
  const li=E('li','entry'),a=E('a',null,m.title||m.slug);a.href='/a/'+m.slug+'.html';li.appendChild(a);
  li.appendChild(E('span','mono',(m.date||'')+(m.minutes?' · '+m.minutes+' min':'')));
  if(m.summary)li.appendChild(E('p','entry-summary',m.summary));
  const tg=m.tags||[];
  if(tg.length){const tls=E('ul','tags');
   for(const g of tg){const ta=E('a','tag'+(g===tag?' is-active':''),g);ta.href='articles.html?tag='+g;
    tls.appendChild(E('li')).appendChild(ta)}
   li.appendChild(tls)}
  ol.appendChild(li)}
 if(ol!==host)host.appendChild(ol);
 if(tag)document.title='Tagged “'+tag+'”'+SF}
function tabs(v){const n=v==='article'?'articles':v;
 for(const t of document.querySelectorAll('.tab[data-tab]'))t.classList.toggle('is-active',t.dataset.tab===n)}
function theme(){const b=$('#theme-toggle');if(!b)return;
 const paint=()=>b.textContent=root.classList.contains('dark')?'Paper':'Lamp';
 paint();b.addEventListener('click',()=>{const d=!root.classList.contains('dark');root.classList.toggle('dark',d);
  try{localStorage.setItem(K,d?'dark':'light')}catch{}paint()})}
(async()=>{
 theme();let md=null;try{md=await import('./md.js')}catch{}
 const s=slug(),p=$('.page'),v=s?'article':((p&&p.dataset.page)||'');
 tabs(v);
 if(s)await view(s,md);else if(v==='articles')await list()})();
