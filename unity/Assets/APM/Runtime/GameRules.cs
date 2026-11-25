using System;
using UnityEngine;
namespace APM {
public static class GameRules {
 public static bool Act(GameState s,string key){
 int f=0,e=0,k=0,p=0,n=0;
 switch(key){case "study":e=-8;k=4;p=1;break;case "organize":f=-8;e=-15;k=1;p=7;n=2;break;case "network":f=-5;e=-12;k=1;p=2;n=7;break;case "fundraise":f=18;e=-12;n=2;break;case "rest":e=28;break;default:return false;}
 if(s.actionsLeft<=0||s.funds+f<0||s.energy+e<0)return false;
 s.funds+=f;s.energy=Mathf.Clamp(s.energy+e,0,100);s.skill=Mathf.Clamp(s.skill+k,0,100);s.support=Mathf.Clamp(s.support+p,0,100);s.network=Mathf.Clamp(s.network+n,0,100);s.actionsLeft--;return true;
 }
 public static bool Eligible(GameState s){return s.quarter==4&&s.year%2==0&&(s.target=="prez"?s.year%4==0&&s.age>=35:s.target=="sen"?s.age>=30:s.age>=25);}
 public static bool Advance(GameState s){if(s.year>=2026&&s.quarter==4)return false;s.quarter++;s.energy=Mathf.Clamp(s.energy+10,0,100);s.actionsLeft=2;if(s.quarter>4){s.quarter=1;s.year++;s.age++;s.funds+=5;if(s.termUntil>0&&s.year>s.termUntil){s.office="local";s.termUntil=0;}}return true;}
 public static string Export(GameState s)=>JsonUtility.ToJson(s,true);
 public static GameState Import(string json){var s=JsonUtility.FromJson<GameState>(json);if(s==null||s.schema!=1||s.year<1900||s.year>2026)throw new ArgumentException("Invalid save");return s;}
 public static WorldData LoadWorld(TextAsset json)=>JsonUtility.FromJson<WorldData>(json.text);
}
}