export type CsvCell=string|number|boolean|null|undefined;

function escapeCsvCell(value:CsvCell){
  const raw=value==null?"":String(value);
  const spreadsheetSafe=/^\s*[=+\-@]/.test(raw)?`'${raw}`:raw;
  return `"${spreadsheetSafe.replaceAll('"','""')}"`;
}

export function serializeCsv(headers:string[],rows:CsvCell[][]){
  const expected=headers.length;
  const normalized=rows.map(row=>Array.from({length:expected},(_,index)=>row[index]??""));
  return [headers,...normalized].map(row=>row.map(escapeCsvCell).join(",")).join("\r\n");
}

export function downloadCsv(filename:string,headers:string[],rows:CsvCell[][]){
  if(typeof window==="undefined")return false;
  const safeName=(filename.trim()||"orderflow-export.csv").replace(/[\\/:*?"<>|]/g,"-");
  const finalName=safeName.toLowerCase().endsWith(".csv")?safeName:`${safeName}.csv`;
  const csv=`\uFEFF${serializeCsv(headers,rows)}\r\n`;
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url=window.URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download=finalName;link.rel="noopener";link.style.position="fixed";link.style.left="-9999px";
  document.body.appendChild(link);link.click();link.remove();
  // Embedded browsers may start reading the Blob after the click handler returns.
  window.setTimeout(()=>window.URL.revokeObjectURL(url),60_000);
  return true;
}
