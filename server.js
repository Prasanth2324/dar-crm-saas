const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, 'data', 'db.json');
const PUBLIC = path.join(ROOT, 'public');

function readDb(){ return JSON.parse(fs.readFileSync(DB_PATH,'utf8')); }
function writeDb(db){ fs.writeFileSync(DB_PATH, JSON.stringify(db,null,2)); }
function send(res,status,data,type='application/json'){
  res.writeHead(status, {'Content-Type': type, 'Access-Control-Allow-Origin':'*'});
  res.end(type.includes('json') ? JSON.stringify(data) : data);
}
function body(req){ return new Promise((resolve,reject)=>{ let b=''; req.on('data',d=>b+=d); req.on('end',()=>{ try{resolve(b?JSON.parse(b):{});}catch(e){reject(e);} }); }); }
function serveStatic(req,res){
  let p = url.parse(req.url).pathname;
  if(p === '/') p='/index.html';
  const file = path.join(PUBLIC, p);
  if(!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return false;
  const ext=path.extname(file); const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml'};
  send(res,200,fs.readFileSync(file),types[ext]||'text/plain'); return true;
}

const server = http.createServer(async (req,res)=>{
  if(req.method==='OPTIONS'){ res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,PATCH'}); return res.end(); }
  const parsed=url.parse(req.url,true); const p=parsed.pathname;
  if(!p.startsWith('/api/')){ if(serveStatic(req,res)) return; return send(res,404,'Not found','text/plain'); }
  const db=readDb();
  try{
    if(p==='/api/dashboard' && req.method==='GET'){
      const won=db.leads.filter(x=>x.stage==='Won');
      const pipeline=db.leads.reduce((a,l)=>{a[l.stage]=(a[l.stage]||0)+1; return a;},{});
      return send(res,200,{stats:{customers:db.customers.length,leads:db.leads.length,openTasks:db.tasks.filter(t=>t.status==='Open').length,pipelineValue:db.leads.reduce((s,l)=>s+(l.value||0),0),wonValue:won.reduce((s,l)=>s+(l.value||0),0)},pipeline});
    }
    if(p==='/api/customers' && req.method==='GET') return send(res,200,db.customers);
    if(p.startsWith('/api/customers/') && req.method==='GET'){
      const id=p.split('/').pop(); const c=db.customers.find(x=>x.id===id); if(!c) return send(res,404,{error:'Customer not found'});
      return send(res,200,{...c, activities:db.activities.filter(a=>a.customerId===id).sort((a,b)=>new Date(b.at)-new Date(a.at)), messages:db.messages.filter(m=>m.customerId===id).sort((a,b)=>new Date(a.at)-new Date(b.at)), leads:db.leads.filter(l=>l.customerId===id), tasks:db.tasks.filter(t=>t.customerId===id)});
    }
    if(p==='/api/leads' && req.method==='GET') return send(res,200,db.leads);
    if(p==='/api/tasks' && req.method==='GET') return send(res,200,db.tasks);
    if(p==='/api/messages' && req.method==='GET') return send(res,200,db.messages);
    if(p==='/api/customers' && req.method==='POST'){
      const x=await body(req); const c={id:'c'+Date.now(),tenantId:'dar',leadScore:50,ltv:0,status:'New',...x}; db.customers.push(c); writeDb(db); return send(res,201,c);
    }
    if(p==='/api/leads' && req.method==='POST'){
      const x=await body(req); const l={id:'l'+Date.now(),tenantId:'dar',stage:'New',createdAt:new Date().toISOString(),...x}; db.leads.push(l); writeDb(db); return send(res,201,l);
    }
    if(p==='/api/tasks' && req.method==='POST'){
      const x=await body(req); const t={id:'t'+Date.now(),tenantId:'dar',status:'Open',...x}; db.tasks.push(t); writeDb(db); return send(res,201,t);
    }
    if(p==='/api/activities' && req.method==='POST'){
      const x=await body(req); const a={id:'a'+Date.now(),tenantId:'dar',at:new Date().toISOString(),...x}; db.activities.push(a); writeDb(db); return send(res,201,a);
    }
    if(p==='/api/webhooks/customer-event' && req.method==='POST'){
      const x=await body(req); let c=db.customers.find(c=>c.mobile===x.mobile || (x.email && c.email===x.email));
      if(!c){ c={id:'c'+Date.now(),tenantId:'dar',name:x.name||'Unknown',mobile:x.mobile||'',email:x.email||'',branch:x.branch||'',segment:x.segment||'',ltv:0,leadScore:50,assignedTo:'u2',status:'New',source:x.source||'API',budget:x.budget||'',interest:x.interest||''}; db.customers.push(c); }
      db.activities.push({id:'a'+Date.now(),tenantId:'dar',customerId:c.id,type:x.type||x.source||'API',text:x.text||'External event received',at:new Date().toISOString()});
      writeDb(db); return send(res,200,{ok:true,customerId:c.id});
    }
    return send(res,404,{error:'API route not found'});
  } catch(e){ return send(res,500,{error:e.message}); }
});
server.listen(PORT,()=>console.log(`DAR CRM running at http://localhost:${PORT}`));
