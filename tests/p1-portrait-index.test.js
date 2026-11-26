import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {approvedPortraitIndex,localPortraitUrl,portraitCredit} from '../p1-portrait-index.js';
const row={id:'S001136',qid:'Q123',aliases:['S001136','hist:fixture'],sha256:'a'.repeat(64),path:'assets/p1-portraits/Q123-aaaaaaaaaaaaaaaa.webp',commons:'https://commons.wikimedia.org/wiki/File:Example.jpg',status:'approved',review:{evidence:'fixture only',identity:true,rights:true,individualPortrait:true},license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',author:'Example',date:'1947',modified:'WebP'};
test('review gates, exact ID aliases and safe paths',()=>{
 assert.equal(approvedPortraitIndex([row]).get('S001136'),row);
 assert.equal(approvedPortraitIndex([row]).get('hist:fixture'),row);
 assert.equal(localPortraitUrl(row),'./'+row.path);
 for(const p of [{...row,status:'metadata_matched_visual_review_pending'},{...row,path:'../unsafe.webp'},{...row,author:''},{...row,review:{...row.review,identity:false}},{...row,license:'Fair use'}])assert.equal(approvedPortraitIndex([p]).size,0);
 const other={...row,qid:'Q124',path:row.path.replace('Q123','Q124')};
 assert.equal(approvedPortraitIndex([row,other]).size,0);
});
test('credit includes author, license, source and alteration',()=>{const h=portraitCredit(row,{esc:x=>String(x),T:(a,b)=>b,safeUrl:x=>x});for(const x of ['Example','CC BY-SA 4.0','commons.wikimedia.org','WebP'])assert.ok(h.includes(x));});
test('all committed approved rows resolve and hash correctly',()=>{const rows=JSON.parse(fs.readFileSync(new URL('../data/p1-approved.json',import.meta.url)));const idx=approvedPortraitIndex(rows);for(const p of rows){assert.equal(idx.get(p.id),p);const b=fs.readFileSync(new URL('../'+p.path,import.meta.url));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),p.sha256);}});
