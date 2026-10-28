import { InputError } from './interpret.js';
const base="FROM sales WHERE status = 'Completed'";
const money=n=>Number(n)/100;
const fmt=n=>new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(n);
export function analyze(db,plan){
 let sql,parameters=[];
 if(plan.intent==='total') sql=`SELECT COUNT(*) AS transactions, COALESCE(SUM(gross_cents),0) AS gross_cents, COALESCE(SUM(discount_cents),0) AS discount_cents, COALESCE(SUM(revenue_cents),0) AS revenue_cents ${base}`;
 if(['product','region'].includes(plan.intent)) sql=`SELECT ${plan.intent} AS label, COUNT(*) AS transactions, SUM(revenue_cents) AS revenue_cents ${base} GROUP BY ${plan.intent} ORDER BY revenue_cents DESC, label ASC`;
 if(plan.intent==='trend') sql=`SELECT substr(order_date,1,7) AS label, COUNT(*) AS transactions, SUM(revenue_cents) AS revenue_cents ${base} GROUP BY label ORDER BY label`;
 if(plan.intent==='compare'){sql=`SELECT substr(order_date,1,7) AS label, COUNT(*) AS transactions, SUM(revenue_cents) AS revenue_cents ${base} AND substr(order_date,1,7) IN (?,?) GROUP BY label ORDER BY label`;parameters=plan.months;}
 if(!sql)throw new InputError('Unsupported analysis');
 const rows=db.prepare(sql).all(...parameters).map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>k.endsWith('_cents')?[k.replace('_cents',''),money(v)]:[k,v])));
 let answer,comparison=null;
 if(plan.intent==='total')answer=`Total net revenue is ${fmt(rows[0].revenue)} across ${rows[0].transactions} completed transactions.`;
 if(['product','region'].includes(plan.intent)) {const winners=rows.filter(r=>r.revenue===rows[0]?.revenue);answer=rows.length?`${winners.map(r=>r.label).join(' and ')} ${winners.length>1?'tie for':'has'} the highest ${plan.intent} revenue: ${fmt(rows[0].revenue)}.`:'No completed sales are available.';}
 if(plan.intent==='trend')answer=rows.length?`Monthly net revenue across ${rows.length} months totals ${fmt(rows.reduce((a,r)=>a+r.revenue,0))}.`:'No completed sales are available.';
 if(plan.intent==='compare'){
  const [a,b]=plan.months.map(m=>rows.find(r=>r.label===m));
  if(!a||!b)throw new InputError('One or both months have no completed transactions. Missing data is not treated as zero.');
  const change=Math.round((b.revenue-a.revenue)*100)/100;
  comparison={from:a.label,to:b.label,change,percentage:a.revenue===0?null:Math.round(change/a.revenue*10000)/100};
  answer=`Revenue ${change<0?'decreased':change>0?'increased':'was unchanged'} from ${fmt(a.revenue)} in ${a.label} to ${fmt(b.revenue)} in ${b.label}. Change: ${fmt(change)} (${comparison.percentage===null?'percentage undefined: zero baseline':comparison.percentage+'%'}).`;
 }
 return {answer,rows,comparison,sql,parameters,intent:plan.intent,mode:plan.mode,assumptions:['Net revenue = quantity × unit price − transaction discount.','Only valid Completed transactions count; Returned transactions are excluded.','Amounts use source currency units; the problem statement does not specify a currency.','Month names without a year default to 2026.']};
}
