using System;
using UnityEngine;
namespace APM {
public static class GameRules {
 public static void Log(GameState s,string key,params string[] args){s.history.Insert(0,new LogEntry{year=s.year,quarter=s.quarter,key=key,args=args});if(s.history.Count>200)s.history.RemoveRange(200,s.history.Count-200);}
 public static bool Act(GameState s,string key){
 int f=0,e=0,k=0,p=0,n=0;
 switch(key){case "study":e=-8;k=4;p=1;break;case "organize":f=-8;e=-15;k=1;p=7;n=2;break;case "network":f=-5;e=-12;k=1;p=2;n=7;break;case "fundraise":f=18;e=-12;n=2;break;case "rest":e=28;break;default:return false;}
 if(s.actionsLeft<=0||s.funds+f<0||s.energy+e<0)return false;
 s.funds+=f;s.energy=Mathf.Clamp(s.energy+e,0,100);s.skill=Mathf.Clamp(s.skill+k,0,100);s.support=Mathf.Clamp(s.support+p,0,100);s.network=Mathf.Clamp(s.network+n,0,100);s.actionsLeft--;Log(s,key);return true;
 }
 public static bool Eligible(GameState s){return s.quarter==4&&s.year%2==0&&(s.target=="prez"?s.year%4==0&&s.age>=35:s.target=="sen"?s.age>=30:s.age>=25);}
 public static bool Advance(GameState s){if(s.year>=2026&&s.quarter==4)return false;s.quarter++;s.energy=Mathf.Clamp(s.energy+10,0,100);s.actionsLeft=2;if(s.quarter>4){s.quarter=1;s.year++;s.age++;s.funds+=5;if(s.termUntil>0&&s.year>s.termUntil){s.office="local";s.termUntil=0;Log(s,"termEnd");}}return true;}
 public static ElectionEntry RunElection(GameState s,float random01){
 if(!Eligible(s)||s.funds<10||s.elections.Exists(x=>x.year==s.year))return null;
 int score=Mathf.Clamp((int)Math.Floor(s.support*.55+s.skill*.2+s.network*.25+(Mathf.Clamp01(random01)-.5)*24+22+.5),0,100);
 var r=new ElectionEntry{year=s.year,office=s.target,score=score,won=score>=50,method=s.target=="sen"&&s.year<1913?"legislature":"popular"};
 s.funds-=10;s.elections.Add(r);if(r.won){s.office=s.target;s.termUntil=s.year+(s.office=="sen"?6:(s.office=="gov"||s.office=="prez")?4:2);s.points+=20;}Log(s,r.won?"won":"lost",r.office,r.score.ToString());return r;
 }
 public static ReviewEntry Review(GameState s,string id,bool correct,long nowMilliseconds){
 var r=s.reviews.Find(x=>x.id==id);if(r==null){r=new ReviewEntry{id=id};s.reviews.Add(r);}
 r.level=correct?Math.Min(7,r.level+1):0;int[] days={0,1,3,7,14,30,60,120};r.due=nowMilliseconds+(correct?days[r.level]*86400000L:0);
 if(correct){s.points+=3;if(!s.collection.Contains(id))s.collection.Add(id);}return r;
 }
 public static bool Vote(GameState s,string title,string choice){
 if((s.office!="rep"&&s.office!="sen")||s.legislation.Exists(x=>x.year==s.year&&x.title==title))return false;
 s.legislation.Add(new VoteEntry{year=s.year,title=title,choice=choice});s.points+=2;Log(s,"voted",title,choice);return true;
 }
 public static void Successor(GameState s,string name){s.name=name;s.age=30;s.office="local";s.termUntil=0;s.target="rep";s.skill=20;s.support=25;s.network=Math.Max(10,(int)Math.Floor(s.network*.4+.5));s.energy=100;Log(s,"successor",name);}
 public static string Export(GameState s)=>JsonUtility.ToJson(s,true);
 public static GameState Import(string json){var s=JsonUtility.FromJson<GameState>(json);if(s==null||s.schema!=1||s.year<1900||s.year>2026)throw new ArgumentException("Invalid save");return s;}
 public static WorldData LoadWorld(TextAsset json)=>JsonUtility.FromJson<WorldData>(json.text);
}
}