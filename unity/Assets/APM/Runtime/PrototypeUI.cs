using UnityEngine;
using System.IO;
namespace APM {
// Native smoke-test UI, automatically available in an otherwise empty scene.
// Replace with UI Toolkit/uGUI before shipping.
public class PrototypeUI : MonoBehaviour {
 GameState state; Vector2 scroll; string candidate="Alex Morgan"; string status=""; bool english;
 string PathName=>Path.Combine(Application.persistentDataPath,"apm-save.json");
 string T(string ko,string en)=>english?en:ko+" ("+en+")";
 [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
 static void Boot(){if(FindFirstObjectByType<NativeGameUI>()==null&&FindFirstObjectByType<PrototypeUI>()==null){var go=new GameObject("APM Prototype");DontDestroyOnLoad(go);go.AddComponent<PrototypeUI>();}}
 void Awake(){state=new GameState();try{if(File.Exists(PathName))state=GameRules.Import(File.ReadAllText(PathName));}catch(System.Exception e){status=e.Message;}}
 void Save(){try{File.WriteAllText(PathName,GameRules.Export(state));}catch(System.Exception e){status=e.Message;}}
 void OnGUI(){float w=Mathf.Min(Screen.width,850);GUILayout.BeginArea(new Rect((Screen.width-w)/2,0,w,Screen.height));scroll=GUILayout.BeginScrollView(scroll);
 GUILayout.Label("AMERICAN POLITICAL MANAGER — Unity Prototype");
 if(GUILayout.Button(english?"한국어 + English":"English",GUILayout.Height(44)))english=!english;
 GUILayout.Label(state.year+" / Q"+state.quarter+" · "+state.name+" · "+state.state+" · "+state.office);
 GUILayout.Label(T("자금","Funds")+": "+state.funds+"   "+T("체력","Energy")+": "+state.energy);
 GUILayout.Label(T("역량","Skill")+": "+state.skill+"   "+T("지지","Support")+": "+state.support+"   "+T("관계","Network")+": "+state.network);
 string[] keys={"study","organize","network","fundraise","rest"};string[] ko={"정치 공부","조직 관리","관계 형성","자금 마련","휴식"};
 for(int i=0;i<keys.Length;i++)if(GUILayout.Button(T(ko[i],keys[i]),GUILayout.Height(44))){status=GameRules.Act(state,keys[i])?"OK":T("활동 불가","Unavailable");Save();}
 if(GUILayout.Button(T("다음 분기","Next quarter"),GUILayout.Height(44))){GameRules.Advance(state);Save();}
 GUILayout.Label(T("목표 직책","Target office")+": "+state.target);
 foreach(string x in new[]{"rep","sen","gov","prez"})if(GUILayout.Button(x,GUILayout.Height(36))){state.target=x;Save();}
 GUI.enabled=GameRules.Eligible(state);if(GUILayout.Button(T("가상 선거","Fictional election"),GUILayout.Height(44))){var r=GameRules.RunElection(state,Random.value);status=r==null?"Unavailable":r.won?"Fictional win":"Fictional loss";Save();}GUI.enabled=true;
 candidate=GUILayout.TextField(candidate,GUILayout.Height(40));if(GUILayout.Button(T("후임 육성","Successor"),GUILayout.Height(44))&&!string.IsNullOrWhiteSpace(candidate)){GameRules.Successor(state,candidate);Save();}
 GUILayout.Label(status);GUILayout.Label("All game results are fictional. Full historical database, localization and production UI require integration.");
 GUILayout.EndScrollView();GUILayout.EndArea();}
 }
}