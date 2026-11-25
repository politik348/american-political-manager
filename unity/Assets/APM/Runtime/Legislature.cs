using System;
using System.Collections.Generic;
using UnityEngine;
namespace APM {
[Serializable] public class BillRecord {
 public int id,year,committee=40,house=42,senate=40,concessions,debates;
 public string agenda,stage="draft",origin,result;
 public List<string> log=new List<string>();
}
[Serializable] public class LegislatureState {public List<BillRecord> bills=new List<BillRecord>();public int serial;}
public static class Legislature {
 public static LegislatureState Get(GameState s){if(s.legislature==null)s.legislature=new LegislatureState();return s.legislature;}
 public static bool Create(GameState s,string agenda){
 if(s.mode!="alternate"||(s.office!="rep"&&s.office!="sen")||Array.IndexOf(new[]{"infra","edu","budget"},agenda)<0||s.energy<8)return false;
 var l=Get(s);if(l.bills.Exists(b=>b.stage!="closed"))return false;
 s.energy-=8;l.bills.Add(new BillRecord{id=++l.serial,agenda=agenda,year=s.year,origin=s.office});return true;
 }
 static bool Spend(GameState s,int n){if(s.energy<n)return false;s.energy-=n;return true;}
 static int Support(BillRecord b,bool house)=>house?b.house:b.senate;
 static void Raise(BillRecord b,bool house,int n){if(house)b.house=Math.Min(100,b.house+n);else b.senate=Math.Min(100,b.senate+n);}
 static bool Log(BillRecord b,string action){b.log.Add(action+":"+b.stage);return true;}
 static bool Close(GameState s,BillRecord b,string action,string result){b.result=result;b.stage="closed";s.points+=result=="enacted"?20:2;return Log(b,action);}
 public static bool Act(GameState s,int id,string action){
 if(s.mode!="alternate"||(s.office!="rep"&&s.office!="sen"))return false;
 var b=Get(s).bills.Find(x=>x.id==id);if(b==null||b.stage=="closed"||b.origin!=s.office)return false;
 bool ownHouse=b.origin=="rep";
 switch(action){
 case "refer":if(b.stage!="draft"||!Spend(s,4))return false;b.stage="committee";break;
 case "hearing":if(b.stage!="committee"||!Spend(s,8))return false;b.committee=Math.Min(100,b.committee+12);break;
 case "markup":if(b.stage!="committee"||b.committee<50||!Spend(s,6))return false;b.stage="calendar";break;
 case "schedule":if(b.stage!="calendar"||!Spend(s,4))return false;b.stage="floor";break;
 case "amend":if((b.stage!="floor"&&b.stage!="secondChamber"&&b.stage!="reconcile")||b.concessions>=4||!Spend(s,8))return false;b.concessions++;Raise(b,true,9);Raise(b,false,9);break;
 case "debate":if((b.stage!="floor"&&b.stage!="secondChamber")||b.debates>=4||!Spend(s,7))return false;b.debates++;Raise(b,b.stage=="floor"?ownHouse:!ownHouse,6);break;
 case "vote":if(b.stage!="floor"&&b.stage!="secondChamber")return false;if(Support(b,b.stage=="floor"?ownHouse:!ownHouse)<51)return Close(s,b,action,"rejected");b.stage=b.stage=="floor"?"secondChamber":"reconcile";break;
 case "agree":if(b.stage!="reconcile"||!Spend(s,4))return false;if(b.house<51||b.senate<51)return Close(s,b,action,"rejected");b.stage="executive";break;
 case "present":if(b.stage!="executive")return false;return Close(s,b,action,"enacted");
 case "withdraw":return Close(s,b,action,"withdrawn");
 default:return false;
 }return Log(b,action);
 }
}
}