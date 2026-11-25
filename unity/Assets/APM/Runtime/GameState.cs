using System;
using System.Collections.Generic;
namespace APM {
[Serializable] public class LogEntry {public int year,quarter;public string key;public string[] args;}
[Serializable] public class ReviewEntry {public string id;public int level;public long due;}
[Serializable] public class ElectionEntry {public int year,score;public string office,method;public bool won;}
[Serializable] public class VoteEntry {public int year;public string title,choice;}
[Serializable] public class GameState {
 public int schema=1,year=1900,quarter=1,funds=40,energy=100,skill=20,support=25,network=10,age=30,termUntil=0,points=0,actionsLeft=2;
 public string name="Alex Morgan",state="CA",party="Independent",mode="historyMode",office="local",target="rep";
 public LegislatureState legislature=new LegislatureState();public List<LogEntry> history=new List<LogEntry>();public List<string> collection=new List<string>();public List<ReviewEntry> reviews=new List<ReviewEntry>();public List<ElectionEntry> elections=new List<ElectionEntry>();public List<VoteEntry> legislation=new List<VoteEntry>();
}
[Serializable] public class StateRecord {public string id,name;public int admitted;}
[Serializable] public class EraRecord {public int start,end;public string ko,en;}
[Serializable] public class HistoricalEvent {public int year;public string ko,en,source;}
[Serializable] public class HistoricalElection {public int year;public string winner,party,opponent,source;}
[Serializable] public class WorldData {public int schema;public string version;public StateRecord[] states;public EraRecord[] eras;public HistoricalEvent[] events;public HistoricalElection[] elections;}
}