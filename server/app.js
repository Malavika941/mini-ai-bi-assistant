import express from 'express';
import { fileURLToPath } from 'node:url';
import { createDatabase } from './db.js';
import { interpret, InputError } from './interpret.js';
import { analyze } from './analytics.js';
export function createApp({database=createDatabase(),interpreter=interpret}={}){
 const app=express();app.disable('x-powered-by');
 app.use(express.json({limit:'4kb'}));
 app.get('/api/health',(_req,res)=>res.json({status:'ok'}));
 app.get('/api/overview',(_req,res)=>res.json({summary:analyze(database.db,{intent:'total'}).rows[0],trend:analyze(database.db,{intent:'trend'}).rows,quality:database.report,mode:process.env.AI_PROVIDER==='ollama'?'Ollama LLM':'Deterministic demo'}));
 app.post('/api/ask',async(req,res,next)=>{try{
  if(typeof req.body?.question!=='string'||!req.body.question.trim()||req.body.question.length>500)throw new InputError('Question must contain 1–500 characters.',400);
  const plan=await interpreter(req.body.question);res.json(analyze(database.db,plan));
 }catch(e){next(e);}});
 app.use('/api',(_req,res)=>res.status(404).json({error:'API route not found'}));
 app.use(express.static(fileURLToPath(new URL('../dist',import.meta.url))));
 app.use((err,_req,res,_next)=>{const status=err.status||500;res.status(status).json({error:status===500?'Unexpected server error.':err.type==='entity.parse.failed'?'Invalid JSON body.':err.message});});
 return app;
}
