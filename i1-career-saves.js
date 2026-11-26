import {slots,validSave} from './onboarding.js';
import {protectedMode} from './v18-career.js';
export const careerSlotIds=[1,2,3,4,5];
const protectedIds=careerSlotIds.map(i=>'p'+i),allIds=[...careerSlotIds,...protectedIds];
export const careerKey=id=>protectedIds.includes(id)?'apm-v18-protected-'+id:careerSlotIds.includes(id)?(id===1?slots.career:'apm-career-v179-slot-'+id):null;
export function readCareer(storage,id){const key=careerKey(id);if(!key)return null;try{const s=JSON.parse(storage.getItem(key));return validSave(s)?s:null}catch{return null}}
export function listCareers(storage){return allIds.flatMap(id=>{const save=readCareer(storage,id);return save?[{id,save}]:[]})}
export function freeCareer(storage,mode='alternate'){if(allIds.filter(id=>storage.getItem(careerKey(id))!==null).length>=5)return null;return (protectedMode({mode})?protectedIds:careerSlotIds).find(id=>storage.getItem(careerKey(id))===null)||null}
export function preferredCareer(storage){const raw=storage.getItem('apm-career-selected'),id=protectedIds.includes(raw)?raw:Number(raw);return readCareer(storage,id)?id:listCareers(storage)[0]?.id||null}
export function saveCareer(storage,id,s){const key=careerKey(id);if(!key||!validSave(s)||protectedMode(s)!==protectedIds.includes(id))return false;if(storage.getItem(key)===null&&allIds.filter(i=>storage.getItem(careerKey(i))!==null).length>=5)return false;storage.setItem(key,JSON.stringify(s));return true}
export function removeCareer(storage,id){const key=careerKey(id);if(key)storage.removeItem(key)}
