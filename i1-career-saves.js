import {slots,validSave} from './onboarding.js';
export const careerSlotIds=[1,2,3,4,5];
export const careerKey=id=>careerSlotIds.includes(id)?(id===1?slots.career:'apm-career-v179-slot-'+id):null;
export function readCareer(storage,id){const key=careerKey(id);if(!key)return null;try{const s=JSON.parse(storage.getItem(key));return validSave(s)?s:null}catch{return null}}
export function listCareers(storage){return careerSlotIds.flatMap(id=>{const save=readCareer(storage,id);return save?[{id,save}]:[]})}
export function freeCareer(storage){return careerSlotIds.find(id=>storage.getItem(careerKey(id))===null)||null}
export function preferredCareer(storage){const id=Number(storage.getItem('apm-career-selected'));return readCareer(storage,id)?id:listCareers(storage)[0]?.id||null}
export function saveCareer(storage,id,s){const key=careerKey(id);if(!key||!validSave(s))return false;storage.setItem(key,JSON.stringify(s));return true}
export function removeCareer(storage,id){const key=careerKey(id);if(key)storage.removeItem(key)}
