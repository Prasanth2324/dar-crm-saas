const http=require('http'),fs=require('fs'),path=require('path'),url=require('url'),crypto=require('crypto');
const PORT=process.env.PORT||3000, ROOT=__dirname, DB_PATH=path.join(ROOT,'data','db.json'), PUBLIC=path.join(ROOT,'public');
const WEBHOOK_SECRET=process.env.CRM_WEBHOOK_SECRET||'';
const ADMIN_PASSWORD=process.env.CRM_PASSWORD||'';
const sessions=new Set();
function readDb(){return JSON.parse(fs.readFileSync(DB_PATH,'utf8'))}
function writeDb(db){fs.writeFileSync(DB_PATH,JSON.stringify(db,null,2))}
function send(res,status,data,type='application/json',headers={}){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store',...headers});res.end(type.includes('json')?JSON.stringify(data):data)}
function body(req){return new Promise((resolve,reject)=>{let b='';req.on('data',d=>{b+=d;if(b.length>2e6)req.destroy()});req.on('end',()=>{try{resolve(b?JSON.parse(b):{})}catch(e){reject(e)}})})}
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(x=>x.trim().split('=')))}
function authed(req){if(!ADMIN_PASSWORD)return true;return sessions.has(cookies(req).crm_session)}
function serveStatic(req,res){let p=url.parse(req.url).pathname;if(p==='/')p='/index.html';const file=path.resolve(PUBLIC,'.'+p);if(!file.startsWith(PUBLIC)||!fs.existsSync(file)||fs.statSync(file).isDirectory())return false;const ext=path.extname(file),types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml'};send(res,200,fs.readFileSync(file),types[ext]||'application/octet-stream');return true}
function newId(prefix){return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function metricReport(db){const src={};for(const l of db.leads){const k=l.source||'Unknown';src[k]??={leads:0,value:0,won:0};src[k].leads++;src[k].value+=Number(l.value||0);if(l.stage==='Won')src[k].won++}return Object.entries(src).map(([source,v])=>({source,...v,conversion:v.leads?Math.round(v.won/v.leads*1000)/10:0})).sort((a,b)=>b.leads-a.leads)}
const server=http.createServer(async(req,res)=>{
 if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Headers':'Content-Type,X-CRM-Secret','Access-Control-Allow-Methods':'GET,POST,PATCH,PUT,DELETE'});return res.end()}
 const parsed=url.parse(req.url,true),p=parsed.pathname;
 if(p==='/api/login'&&req.method==='POST'){const x=await body(req);if(!ADMIN_PASSWORD||x.password===ADMIN_PASSWORD){const t=crypto.randomBytes(24).toString('hex');sessions.add(t);return send(res,200,{ok:true},'application/json',{'Set-Cookie':`crm_session=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`})}return send(res,401,{error:'Invalid password'})}
 if(p==='/api/auth'&&req.method==='GET')return send(res,200,{authenticated:authed(req),passwordEnabled:!!ADMIN_PASSWORD});
 if(!p.startsWith('/api/')){if(serveStatic(req,res))return;return send(res,404,'Not found','text/plain')}
 if(!authed(req)&&p!=='/api/auth')return send(res,401,{error:'Unauthorized'});
 const db=readDb();
 try{
  if(p==='/api/dashboard'&&req.method==='GET'){const won=db.leads.filter(x=>x.stage==='Won'),pipeline=db.leads.reduce((a,l)=>(a[l.stage]=(a[l.stage]||0)+1,a),{});return send(res,200,{stats:{customers:db.customers.length,leads:db.leads.filter(l=>l.stage!=='Won').length,openTasks:db.tasks.filter(t=>t.status==='Open').length,pipelineValue:db.leads.filter(l=>l.stage!=='Won').reduce((s,l)=>s+Number(l.value||0),0),wonValue:won.reduce((s,l)=>s+Number(l.value||0),0)},pipeline,sourceReport:metricReport(db).slice(0,8)})}
  if(p==='/api/customers'&&req.method==='GET')return send(res,200,db.customers);
  if(p.startsWith('/api/customers/')&&req.method==='GET'){const id=p.split('/').pop(),c=db.customers.find(x=>x.id===id);if(!c)return send(res,404,{error:'Customer not found'});return send(res,200,{...c,activities:db.activities.filter(a=>a.customerId===id).sort((a,b)=>new Date(b.at)-new Date(a.at)),messages:db.messages.filter(m=>m.customerId===id).sort((a,b)=>new Date(a.at)-new Date(b.at)),leads:db.leads.filter(l=>l.customerId===id),tasks:db.tasks.filter(t=>t.customerId===id),calls:(db.calls||[]).filter(x=>x.customerId===id)})}
  if(p==='/api/leads'&&req.method==='GET')return send(res,200,db.leads);
  if(p.startsWith('/api/leads/')&&req.method==='PATCH'){const id=p.split('/').pop(),x=await body(req),l=db.leads.find(l=>l.id===id);if(!l)return send(res,404,{error:'Lead not found'});Object.assign(l,x);writeDb(db);return send(res,200,l)}
  if(p==='/api/tasks'&&req.method==='GET')return send(res,200,db.tasks);
  if(p.startsWith('/api/tasks/')&&req.method==='PATCH'){const id=p.split('/').pop(),x=await body(req),t=db.tasks.find(t=>t.id===id);if(!t)return send(res,404,{error:'Task not found'});Object.assign(t,x);writeDb(db);return send(res,200,t)}
  if(p==='/api/messages'&&req.method==='GET')return send(res,200,db.messages);
  if(p==='/api/lead-sources'&&req.method==='GET')return send(res,200,db.leadSources||[]);
  if(p==='/api/integrations'&&req.method==='GET'){const data=(db.integrations||[]).map(i=>({...i,configured:i.env.some(k=>!!process.env[k]),env:i.env.map(k=>({key:k,set:!!process.env[k]}))}));return send(res,200,data)}
  if(p==='/api/calls'&&req.method==='GET')return send(res,200,db.calls||[]);
  if(p==='/api/campaigns'&&req.method==='GET')return send(res,200,db.campaigns||[]);
  if(p==='/api/reports/sources'&&req.method==='GET')return send(res,200,metricReport(db));
  if(p==='/api/backup'&&req.method==='GET')return send(res,200,db,'application/json',{'Content-Disposition':'attachment; filename="dar-crm-backup.json"'});
  if(p==='/api/customers'&&req.method==='POST'){const x=await body(req);const c={id:newId('c'),tenantId:'dar',leadScore:50,ltv:0,status:'New',assignedTo:'u2',...x};db.customers.push(c);writeDb(db);return send(res,201,c)}
  if(p==='/api/leads'&&req.method==='POST'){const x=await body(req);const l={id:newId('l'),tenantId:'dar',stage:'New',createdAt:new Date().toISOString(),...x};db.leads.push(l);writeDb(db);return send(res,201,l)}
  if(p==='/api/tasks'&&req.method==='POST'){const x=await body(req);const t={id:newId('t'),tenantId:'dar',status:'Open',owner:'u2',...x};db.tasks.push(t);writeDb(db);return send(res,201,t)}
  if(p==='/api/calls'&&req.method==='POST'){const x=await body(req);db.calls??=[];const c={id:newId('call'),at:new Date().toISOString(),...x};db.calls.push(c);writeDb(db);return send(res,201,c)}
  if(p==='/api/activities'&&req.method==='POST'){const x=await body(req);const a={id:newId('a'),tenantId:'dar',at:new Date().toISOString(),...x};db.activities.push(a);writeDb(db);return send(res,201,a)}
  if(p==='/api/webhooks/customer-event'&&req.method==='POST'){if(WEBHOOK_SECRET&&req.headers['x-crm-secret']!==WEBHOOK_SECRET)return send(res,401,{error:'Invalid webhook secret'});const x=await body(req);let c=db.customers.find(c=>c.mobile===x.mobile||(x.email&&c.email===x.email));if(!c){c={id:newId('c'),tenantId:'dar',name:x.name||'Unknown',mobile:x.mobile||'',email:x.email||'',branch:x.branch||'',segment:x.segment||'',ltv:0,leadScore:50,assignedTo:'u2',status:'New',source:x.source||'API',budget:x.budget||'',interest:x.interest||''};db.customers.push(c)}db.activities.push({id:newId('a'),tenantId:'dar',customerId:c.id,type:x.type||x.source||'API',text:x.text||'External event received',at:new Date().toISOString()});if(x.createLead){db.leads.push({id:newId('l'),tenantId:'dar',customerId:c.id,source:x.source||'API',stage:'New',value:Number(x.value||0),assignedTo:'u2',nextFollowup:x.nextFollowup||new Date(Date.now()+86400000).toISOString(),createdAt:new Date().toISOString()})}writeDb(db);return send(res,200,{ok:true,customerId:c.id})}
  return send(res,404,{error:'API route not found'})
 }catch(e){console.error(e);return send(res,500,{error:e.message})}
});
server.listen(PORT,()=>console.log(`DAR CRM running on ${PORT}`));
