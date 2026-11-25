using System;
using System.Linq;
namespace APM {
[Serializable] public class TermRecord {public string start,end,type,state,party;public int district;}
[Serializable] public class PersonRecord {public string id,name,ko,birthday,source;public TermRecord[] terms;}
[Serializable] public class PeoplePack {public PersonRecord[] people;}
public static class PoliticalRecords {
 public static bool Active(TermRecord t,int year){if(t==null||string.IsNullOrEmpty(t.start)||string.IsNullOrEmpty(t.end)||t.start.Length<4||t.end.Length<4)return false;return int.TryParse(t.start.Substring(0,4),out int a)&&int.TryParse(t.end.Substring(0,4),out int b)&&a<=year&&b>=year;}
 public static string[] Links(PersonRecord a,PersonRecord b,int year){var list=new System.Collections.Generic.HashSet<string>();foreach(var x in (a.terms??Array.Empty<TermRecord>()).Where(t=>Active(t,year)))foreach(var y in (b.terms??Array.Empty<TermRecord>()).Where(t=>Active(t,year))){if(string.CompareOrdinal(x.start,y.end)>0||string.CompareOrdinal(y.start,x.end)>0)continue;if(!string.IsNullOrEmpty(x.state)&&x.state==y.state)list.Add("state");if((x.type=="rep"||x.type=="sen")&&x.type==y.type)list.Add("chamber");if(!string.IsNullOrEmpty(x.party)&&x.party==y.party)list.Add("party");}return list.ToArray();}
}
}