import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {connectedPortraitIndex} from '../p1-portrait-index.js';
const p={id:'A000001',qid:'Q1',aliases:['A000001'],sha256:'a'.repeat(64),path:'assets/p1-portraits/Q1-aaaaaaaaaaaaaaaa.webp',commons:'https://commons.wikimedia.org/wiki/File:Example.jpg',license:'Public domain',status:'metadata_connected_visual_review_pending',validation:{file:true,rights:true,roster:true,individualVisualReview:false}};
test('metadata connected is not individually approved; require all machine gates',()=>{
 assert.equal(connectedPortraitIndex([p]).get(p.id),p);
 for(const q of [{...p,status:'approved'},{...p,license:'Fair use'},{...p,commons:'https://evil.example/wiki/File:Example.jpg'},{...p,validation:{...p.validation,rights:false}},{...p,validation:{...p.validation,individualVisualReview:true}}])assert.equal(connectedPortraitIndex([q]).size,0);
 const q={...p,qid:'Q2',path:p.path.replace('Q1','Q2')};assert.equal(connectedPortraitIndex([p,q]).size,0);
});
test('all generated records resolve to actual assets',()=>{
 const rows=JSON.parse(fs.readFileSync(new URL('../data/p1-connected.json',import.meta.url)));
 const m=connectedPortraitIndex(rows);
 for(const p of rows){assert.equal(m.get(p.id),p);assert.ok(fs.existsSync(new URL('../'+p.path,import.meta.url)))}
});
