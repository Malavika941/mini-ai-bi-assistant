import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { parse } from './csv.js';
export const source = new URL('../data/sales.csv', import.meta.url);
export function createDatabase(csv = readFileSync(source, 'utf8'), location = ':memory:') {
 const db = new DatabaseSync(location);
 db.exec(`DROP TABLE IF EXISTS sales; CREATE TABLE sales(id TEXT PRIMARY KEY, order_date TEXT NOT NULL, product TEXT NOT NULL, category TEXT NOT NULL, region TEXT NOT NULL, channel TEXT NOT NULL, quantity INTEGER NOT NULL, gross_cents INTEGER NOT NULL, discount_cents INTEGER NOT NULL, revenue_cents INTEGER NOT NULL, status TEXT NOT NULL);`);
 const report = {total:0, accepted:0, excluded:0, rejected:[], returned:[]};
 const insert = db.prepare('INSERT INTO sales VALUES(?,?,?,?,?,?,?,?,?,?,?)');
 const seen = new Set();
 const records = parse(csv, {columns:true, skip_empty_lines:true, trim:true, bom:true});
 const required=['Transaction_Id','Order_date','Product','Category','Region','Sales_channel','Quantity','Unit_price','Discount_amount','Status'];
 if(records.length && required.some(k=>!(k in records[0]))) throw new Error('CSV is missing required columns');
 for (const r of records) {
  report.total++;
  const errors=[]; const id=r.Transaction_Id;
  if(!id || seen.has(id)) errors.push('Missing or duplicate transaction ID');
  if(id) seen.add(id);
  const m=/^(\d{2})-(\d{2})-(\d{4})$/.exec(r.Order_date||'');
  const iso=m ? `${m[3]}-${m[2]}-${m[1]}` : '';
  const date=new Date(iso+'T00:00:00Z');
  if(!m || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==iso) errors.push('Invalid date');
  const q=Number(r.Quantity);
  if(!/^\d+$/.test(r.Quantity||'') || !Number.isSafeInteger(q) || q<=0) errors.push('Quantity must be a positive integer');
  const money=v=>/^\d+(\.\d{1,2})?$/.test(v||'') ? Math.round(Number(v)*100) : NaN;
  const price=money(r.Unit_price), discount=money(r.Discount_amount), gross=q*price;
  if(!Number.isSafeInteger(price)||price<0) errors.push('Missing or invalid unit price');
  if(!Number.isSafeInteger(discount)||discount<0||discount>gross) errors.push('Invalid transaction discount');
  if(!Number.isSafeInteger(gross)) errors.push('Invalid or excessive transaction amount');
  for(const k of ['Product','Category','Region','Sales_channel']) if(!r[k]) errors.push(`Missing ${k}`);
  if(!['Completed','Returned'].includes(r.Status)) errors.push('Unsupported status');
  if(errors.length){report.rejected.push({id:id||`row ${report.total+1}`,reasons:errors});continue;}
  insert.run(id,iso,r.Product,r.Category,r.Region,r.Sales_channel,q,gross,discount,gross-discount,r.Status);
  if(r.Status==='Returned'){report.excluded++;report.returned.push(id);}else report.accepted++;
 }
 db.exec('CREATE INDEX sales_date ON sales(order_date); PRAGMA query_only=ON;');
 return {db,report};
}
