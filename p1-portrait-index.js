// Review-gated local portraits. Never resolve new assets by name alone.
export function approvedPortraitIndex(rows){
 const out=new Map(), conflicts=new Set();
 for(const p of Array.isArray(rows)?rows:[]){
  if(p?.status!=='approved'||!/^Q\d+$/.test(p.qid)||!(/^[a-f0-9]{64}$/).test(p.sha256)||p.path!=='assets/p1-portraits/'+p.qid+'-'+p.sha256.slice(0,16)+'.webp'||!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(p.commons)||!Array.isArray(p.aliases)||!p.aliases.includes(p.id)||!p.review?.evidence||p.review?.individualPortrait!==true||p.review?.identity!==true||p.review?.rights!==true)continue;
  if(!/^(Public domain|CC0(?: 1\.0)?|CC BY(?:-SA)? (?:1\.0|2\.0|2\.5|3\.0|4\.0))$/.test(p.license||''))continue;
  if(p.license.startsWith('CC')&&(!/^https:\/\/(?:www\.)?creativecommons\.org\//.test(p.licenseUrl)||p.license.startsWith('CC BY')&&!p.author))continue;
  for(const id of new Set(p.aliases)){if(typeof id!=='string'||!id)continue;if(out.has(id)&&out.get(id).qid!==p.qid)conflicts.add(id);else out.set(id,p);}
 }
 for(const id of conflicts)out.delete(id);
 return out;
}
export const localPortraitUrl=p=>p?'./'+p.path:null;
export function portraitCredit(p,{esc,T,safeUrl}){
 if(!p)return '';
 return '<small class="p1-photo-credit">'+T('일반 인물 초상 · ','General portrait · ')+esc(p.author||T('저작자 미기재','Author not stated'))+' · '+esc(p.date||T('촬영일 미상','Date unknown'))+' · '+(p.licenseUrl?'<a href="'+safeUrl(p.licenseUrl)+'" target="_blank" rel="noopener">'+esc(p.license)+'</a>':esc(p.license))+' · <a href="'+safeUrl(p.commons)+'" target="_blank" rel="noopener">'+T('사진 출처','Photo source')+'</a> · '+esc(p.modified||'')+(p.status==='metadata_connected_visual_review_pending'?' · '+T('출처·파일 자동 검증 / 개별 육안 검토 전','Source/file checked; individual visual review pending'):'')+'</small>';
}

// Machine-validated records are usable as source-linked reference portraits.
// They are not individually visually approved, and must never masquerade as reviewed.
export function connectedPortraitIndex(rows,approved=[]){
 const out=new Map(),conflicts=new Set();
 for(const p of Array.isArray(rows)?rows:[]){
  if(p?.status!=='metadata_connected_visual_review_pending'||p.validation?.file!==true||p.validation?.rights!==true||p.validation?.roster!==true||p.validation?.individualVisualReview!==false||!/^Q\d+$/.test(p.qid)||!(/^[a-f0-9]{64}$/).test(p.sha256)||p.path!=='assets/p1-portraits/'+p.qid+'-'+p.sha256.slice(0,16)+'.webp'||!/^https:\/\/(?:commons\.wikimedia\.org|en\.wikipedia\.org)\/wiki\/File:/.test(p.commons||'')||!Array.isArray(p.aliases)||!p.aliases.includes(p.id))continue;
  if(!/^(Public domain|CC0(?: 1\.0)?|CC BY(?:-SA)? (?:1\.0|2\.0|2\.5|3\.0|4\.0))$/.test(p.license||''))continue;
  if(p.license.startsWith('CC')&&(!/^https:\/\/(?:www\.)?creativecommons\.org\//.test(p.licenseUrl)||p.license.startsWith('CC BY')&&!p.author))continue;
  for(const id of new Set(p.aliases)){if(typeof id!=='string'||!id)continue;if(out.has(id)&&out.get(id).qid!==p.qid)conflicts.add(id);else out.set(id,p)}
 }
 for(const id of conflicts)out.delete(id);
 for(const [id,p] of approvedPortraitIndex(approved))out.set(id,p);
 return out;
}
