/* md.js — the Notebook's markdown renderer. Contract: docs/NOTEBOOK.md §4. */
const EB={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>EB[c]);
const BU=/^(?:javascript|data)\s*:/i;
const url=u=>{const s=String(u);return BU.test(s.replace(/[\x00-\x20\x7f]/g,''))?'#':s;};
const S=x=>String(x??'').replace(/\r\n?/g,'\n');
export function parseFrontMatter(md){
const src=S(md),data={};
const m=/^---[ \t]*\n([\s\S]*?)\n?---[ \t]*(?:\n|$)/.exec(src);
if(!m)return{data,body:src};
for(const ln of m[1].split('\n')){
const i=ln.indexOf(':'),k=ln.slice(0,i).trim();
if(i<1||!/^\w+$/i.test(k))continue;
let v=ln.slice(i+1).trim();
if(/^\[[\s\S]*\]$/.test(v))v=v.slice(1,-1).split(',').map(s=>s.trim().replace(/["']/g,'')).filter(Boolean);
else{v=v.replace(/^["']|["']$/g,'');v=v==='true'||(v==='false'?!1:+v||v);}
data[k]=v;}
return{data,body:src.slice(m[0].length)};}
function inline(s,C,d){
if(d>9)return esc(s);
let o='',i=0,n=s.length;const BK=s.includes(']');
while(i<n){
const c=s[i],r=s.slice(i);
if(c==='\n'){if(/ {2,}$/.test(o))o=o.replace(/ +$/,'')+'<br>';else o+='\n';i++;continue;}
if(c==='`'){const m=/^(`+)([\s\S]*?)\1/.exec(r);if(m){o+='<code>'+esc(m[2])+'</code>';i+=m[0].length;continue;}}
if(BK&&c==='!'&&s[i+1]==='['){const m=/^!\[([^\]]*)]\(\s*([^\s)>]+)[^)]*\)/.exec(r);if(m){o+='<img src="'+esc(url(m[2]))+'" alt="'+esc(m[1])+'" loading="lazy" decoding="async">';i+=m[0].length;continue;}}
if(BK&&c==='['){
const f=/^\[\^([^\]\s]+)]/.exec(r);
if(f){const raw=f[1],id=raw.replace(/[^\w-]/g,''),nw=!C.seen.has(id);if(nw){C.seen.add(id);C.order.push(raw);}
o+='<sup class="fn-ref"><a href="#fn-'+id+'"'+(nw?' id="fnref-'+id+'"':'')+'>'+esc(raw)+'</a></sup>';i+=f[0].length;continue;}
const a=/^\[([^\]]*)]\(\s*([^\s)>]+)\s*\)/.exec(r);
if(a){o+='<a href="'+esc(url(a[2]))+'">'+inline(a[1],C,d+1)+'</a>';i+=a[0].length;continue;}}
if(c==='*'){
const b=/^\*\*([\s\S]+?)\*\*/.exec(r);
if(b&&b[1].trim()===b[1]){o+='<strong>'+inline(b[1],C,d+1)+'</strong>';i+=b[0].length;continue;}
const e=/^\*([\s\S]+?)\*/.exec(r);
if(e&&e[1].trim()===e[1]){o+='<em>'+inline(e[1],C,d+1)+'</em>';i+=e[0].length;continue;}}
if(c==='~'&&s[i+1]==='~'){const t=/^~~([\s\S]+?)~~/.exec(r);if(t){o+='<del>'+inline(t[1],C,d+1)+'</del>';i+=t[0].length;continue;}}
o+=esc(c);i++;}
return o;}
export function renderMarkdown(md){
const src=S(md),C={seen:new Set(),order:[]},FT=new Map();
const IM=/^(\s*)(?:([-*+])|(\d{1,9})[.)]) +(.*)$/;
const ind=l=>l.search(/\S/);
const dl=l=>/^ *\|? *:?-+:? *(?:\| *:?-+:? *)*\|? *$/.test(l);
const cd=f=>'<pre><code'+(f.l?' class="lang-'+esc(f.l)+'"':'')+'>'+esc(f.c)+'</code></pre>';
const L0=src.split('\n'),FE=[],K=[];
for(let i=0;i<L0.length;i++){
const l=L0[i],m=/^ {0,3}(`{3,}|~{3,}) *(\S*) *$/.exec(l);
if(m){const b=[];let j=i+1;
for(;j<L0.length;j++){const c=/^ {0,3}(`{3,}|~{3,}) *$/.exec(L0[j]);if(c&&c[1][0]===m[1][0]&&c[1].length>=m[1].length)break;b.push(L0[j]);}
FE.push({l:m[2]||'',c:b.join('\n')});K.push('\u0001'+(FE.length-1));i=j;continue;}
const f=/^ {0,3}\[\^([^\]\s]+)]: ?([\s\S]*)$/.exec(l);
if(f){let t=f[2];while(i+1<L0.length&&/^ {2,}\S/.test(L0[i+1])){t+='\n'+L0[i+1].trim();i++;}FT.set(f[1],t);continue;}
K.push(l);}
function li(a,i,base,d){
const ord=!!IM.exec(a[i])[3],tag=ord?'ol':'ul';
let h='<'+tag+'>';
while(i<a.length){
const m=IM.exec(a[i]);
if(!m||ind(a[i])!==base||!!m[3]!==ord)break;
let body=m[4],task='';
const t=/^\[([ xX])] +/.exec(body);
if(t){task='<input type="checkbox" disabled'+(t[1]!==' '?' checked':'')+'> ';body=body.slice(t[0].length);}
i++;let kids='';
for(;;){const cl=a[i];if(cl===undefined)break;
if(!cl.trim()){if((a[i+1]||'').trim()&&ind(a[i+1])>base){i++;continue;}break;}
const im=IM.exec(cl);
if(im){if(ind(cl)>base){if(d<16){const r=li(a,i,ind(cl),d+1);kids+=r.h;i=r.i;}else{body+=' '+cl.trim();i++;}continue;}break;}
if(ind(cl)>base){body+=' '+cl.trim();i++;continue;}
break;}
h+='<li'+(task?' class="task"':'')+'>'+task+inline(body,C,0)+kids+'</li>';}
return{h:h+'</'+tag+'>',i};}
function bl(a,d){
d=d||0;const Q=d<12?/^ {0,3}>/:/$^/;
const BLK=/^(?:\u0001\d+$| {0,3}#{1,6} | {0,3}[-*+] | {0,3}\d{1,9}[.)] | {0,3}[-*_](?: *[-*_]){2,} *$| {4,})/;
const o=[];let i=0;
while(i<a.length){
const line=a[i];
if(!line.trim()){i++;continue;}
if(/^\u0001\d+$/.test(line)){const F=FE[+line.slice(1)];o.push(F?cd(F):esc(line));i++;continue;}
if(/^ {0,3}[-*_](?: *[-*_]){2,} *$/.test(line)){o.push('<hr>');i++;continue;}
const h=/^ {0,3}(#{1,6}) +(.*)$/.exec(line);
if(h){const n=h[1].length;o.push('<h'+n+'>'+inline(h[2],C,0)+'</h'+n+'>');i++;continue;}
if(Q.test(line)){
const b=[];while(i<a.length&&Q.test(a[i])){b.push(a[i].replace(/^ {0,3}> ?/,''));i++;}
o.push('<blockquote>'+bl(b,d+1).join('\n')+'</blockquote>');continue;}
if(line.includes('|')&&i+1<a.length&&dl(a[i+1])){
const cells=x=>x.trim().replace(/^\||\|$/g,'').split('|').map(s=>s.trim());
const head=cells(line),rows=[];let j=i+2;
while(j<a.length&&a[j].trim()&&a[j].includes('|')){rows.push(cells(a[j]));j++;}
const cell=(t,g)=>'<'+g+'>'+inline(t,C,0)+'</'+g+'>';
let th='<div class="table-wrap"><table><thead><tr>'+head.map(c=>cell(c,'th')).join('')+'</tr></thead>';
if(rows.length)th+='<tbody>'+rows.map(r=>'<tr>'+r.map(c=>cell(c,'td')).join('')+'</tr>').join('')+'</tbody>';
o.push(th+'</table></div>');i=j;continue;}
if(/^ {4,}\S/.test(line)){const b=[];
while(i<a.length&&(/^ {4,}/.test(a[i])||!a[i].trim())){
if(!a[i].trim()&&!(a[i+1]&&/^ {4,}/.test(a[i+1])))break;
b.push(a[i].slice(4));i++;}
o.push('<pre><code>'+esc(b.join('\n'))+'</code></pre>');continue;}
if(IM.test(line)){const r=li(a,i,ind(line),d);o.push(r.h);i=r.i;continue;}
const b=[];
while(i<a.length&&a[i].trim()&&!BLK.test(a[i])&&!Q.test(a[i])&&!(a[i].includes('|')&&dl(a[i+1]||''))){b.push(a[i]);i++;}
if(!b.length){b.push(line);i++;}
o.push('<p>'+inline(b.join('\n'),C,0)+'</p>');}
return o;}
let html=bl(K,0).join('\n');
if(C.order.length){const it=C.order.filter(x=>FT.has(x)).map(x=>'<li id="fn-'+x.replace(/[^\w-]/g,'')+'">'+inline(FT.get(x),C,0)+'</li>');
if(it.length)html+='\n<ol class="footnotes">'+it.join('')+'</ol>';}
return html;}
