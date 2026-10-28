// Small RFC-4180-style CSV reader: quoted commas, escaped quotes and CRLF supported.
export function parse(text) {
 const rows=[];let row=[],field='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else if(!quoted&&field.length)throw Error('Invalid CSV quoting');else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(field.trim());field='';}
  else if((c==='\n'||c==='\r')&&!quoted){row.push(field.trim());if(row.some(Boolean))rows.push(row);row=[];field='';if(c==='\r'&&text[i+1]==='\n')i++;}
  else field+=c;
 }
 if(quoted)throw Error('Unclosed CSV quote');
 if(field||row.length){row.push(field.trim());rows.push(row);}
 const headers=rows.shift()||[];
 return rows.map(r=>{if(r.length!==headers.length)throw Error('CSV column count mismatch');return Object.fromEntries(headers.map((k,i)=>[k,r[i]]));});
}
