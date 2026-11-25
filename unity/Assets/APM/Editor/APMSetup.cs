#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UIElements;
namespace APM {
public static class APMSetup {
 [MenuItem("APM/Create Native Demo Scene")]
 public static void Create(){
 if(!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())return;
 var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
 var go=new GameObject("American Political Manager");var doc=go.AddComponent<UIDocument>();var ui=go.AddComponent<NativeGameUI>();
 const string path="Assets/APM/APMPanelSettings.asset";var settings=AssetDatabase.LoadAssetAtPath<PanelSettings>(path);
 if(settings==null){settings=ScriptableObject.CreateInstance<PanelSettings>();settings.scaleMode=PanelScaleMode.ScaleWithScreenSize;settings.referenceResolution=new Vector2Int(900,1600);AssetDatabase.CreateAsset(settings,path);}
 doc.panelSettings=settings;ui.worldJson=AssetDatabase.LoadAssetAtPath<TextAsset>("Assets/APM/Data/world.json");
 ui.peopleJson=AssetDatabase.LoadAssetAtPath<TextAsset>("Assets/Resources/APM/people.json");
 EditorSceneManager.SaveScene(scene,"Assets/APM/APMNativeDemo.unity");AssetDatabase.SaveAssets();Selection.activeGameObject=go;
 Debug.Log("APM demo scene created. Assign a Runtime Theme and Korean-capable font if needed, and add scene to Build Profiles.");
 }
}
}
#endif