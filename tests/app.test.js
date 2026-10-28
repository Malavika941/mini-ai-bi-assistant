import test from 'node:test';
import assert from 'node:assert/strict';
// Native HTTP requests exercise the real Express stack without a test client dependency.
const servers=[];
function request(app){ return {post(path){let headers={'Content-Type':'application/json'};return {set(k,v){headers[k]=v;return this;},async send(body){const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));try{const response=await fetch(`http://127.0.0.1:${server.address().port}${path}`,{method:'POST',headers,body:typeof body==='string'?body:JSON.stringify(body)});return {status:response.status,body:await response.json()};}finally{await new Promise(r=>server.close(r));}}};}};}

import {createDatabase} from '../server/db.js';
import {createApp} from '../server/app.js';
import {interpretRules,interpret,validatePlan} from '../server/interpret.js';
import {analyze} from '../server/analytics.js';
const database=createDatabase();const app=createApp({database,interpreter:async q=>({...interpretRules(q),mode:'test'})});
const ask=q=>request(app).post('/api/ask').send({question:q});
test('import audit accounts for all 51 problem-statement rows',()=>{assert.equal(database.report.total,51);assert.equal(database.report.accepted,48);assert.equal(database.report.excluded,1);assert.deepEqual(database.report.rejected.map(r=>r.id),['TXN0034','TXN0051']);});
test('total reconciles gross and discount to independently checked 1,439,200',async()=>{const r=await ask('What is the total revenue?');assert.equal(r.status,200);assert.equal(r.body.rows[0].revenue,1439200);assert.equal(r.body.rows[0].gross-r.body.rows[0].discount,1439200);});
test('top product is Monitor',async()=>{const r=await ask('Which product generated the highest revenue?');assert.equal(r.body.rows[0].label,'Monitor');assert.equal(r.body.rows[0].revenue,473000);});
test('monthly totals',async()=>{const r=await ask('What is the monthly revenue trend?');assert.deepEqual(r.body.rows.map(x=>x.revenue),[210250,234600,223900,240700,318500,211250]);});
test('top region',async()=>{const r=await ask('Which region generated the highest sales?');assert.equal(r.body.rows[0].label,'South');});
test('January to June comparison is directional',async()=>{const r=await ask('How did revenue change between January and June?');assert.equal(r.status,200);assert.equal(r.body.comparison.change,1000);assert.equal(r.body.comparison.percentage,0.48);});
test('missing month is not fabricated as zero',async()=>{assert.equal((await ask('Compare revenue between June and July')).status,422);});
test('invalid request and malformed JSON',async()=>{assert.equal((await ask('')).status,400);assert.equal((await ask(123)).status,400);assert.equal((await ask('a'.repeat(501))).status,400);assert.equal((await request(app).post('/api/ask').set('Content-Type','application/json').send('{bad')).status,400);});
test('unsupported questions and filters are rejected',async()=>{for(const q of ['What is the weather?','Total revenue in North','Predict revenue','Total revenue in 2025','Which product has highest revenue in April?','What is the total profit?'])assert.equal((await ask(q)).status,422,q);});
test('SQL injection and destructive requests cannot run',async()=>{assert.equal((await ask('DROP TABLE sales')).status,422);assert.throws(()=>database.db.exec('DELETE FROM sales'),/readonly/);assert.equal(database.db.prepare('SELECT COUNT(*) AS n FROM sales').get().n,49);});
test('model plan cannot contain SQL or invalid months',()=>{assert.throws(()=>validatePlan({intent:'total',months:[],sql:'DROP TABLE sales'}));assert.throws(()=>validatePlan({intent:'compare',months:['2026-13','2026-01']}));});
test('Ollama adapter accepts a matching structured plan',async()=>{const result=await interpret('Total revenue',{provider:'ollama',fetchImpl:async()=>({ok:true,json:async()=>({message:{content:'{"intent":"total","months":[]}'}})})});assert.match(result.mode,/Ollama/);});
test('Ollama adapter rejects a conflicting or malformed response',async()=>{for(const content of ['{}','not JSON','{"intent":"region","months":[]}'])await assert.rejects(()=>interpret('Total revenue',{provider:'ollama',fetchImpl:async()=>({ok:true,json:async()=>({message:{content}})})}));});
test('Ollama outage is explicit, not a fake AI answer',async()=>{await assert.rejects(()=>interpret('Total revenue',{provider:'ollama',fetchImpl:async()=>{throw Error('offline')}}),e=>e.status===503);});
const header='Transaction_Id,Order_date,Product,Category,Region,Sales_channel,Quantity,Unit_price,Discount_amount,Status\n';
test('zero baseline comparison returns null percentage',()=>{const d=createDatabase(header+'A,01-01-2026,A,C,North,Online,1,10,10,Completed\nB,01-02-2026,A,C,North,Online,1,20,0,Completed');assert.equal(analyze(d.db,{intent:'compare',months:['2026-01','2026-02']}).comparison.percentage,null);d.db.close();});
test('invalid date, duplicate ID and excessive discount are audited',()=>{const d=createDatabase(header+'A,31-02-2026,A,C,N,O,1,10,0,Completed\nB,01-01-2026,A,C,N,O,1,10,20,Completed\nB,01-01-2026,A,C,N,O,1,10,0,Completed');assert.equal(d.report.rejected.length,3);d.db.close();});
test('empty dataset has zero total and no winner',()=>{const d=createDatabase(header);assert.equal(analyze(d.db,{intent:'total'}).rows[0].revenue,0);assert.equal(analyze(d.db,{intent:'product'}).rows.length,0);d.db.close();});
test('top revenue ties are preserved',()=>{const d=createDatabase(header+'A,01-01-2026,A,C,N,O,1,10,0,Completed\nB,01-01-2026,B,C,N,O,1,10,0,Completed');assert.match(analyze(d.db,{intent:'product'}).answer,/tie/);d.db.close();});
