using System;
using System.Linq;
using UnityEngine;
using UnityEngine.UIElements;
namespace APM {
[Serializable] public class NativeMapIndex {public NativeMapEntry[] maps;}
[Serializable] public class NativeMapEntry {public string file,state;public int start,end;}
[Serializable] public class NativeMapData {public MapRing[] rings;public string source;}
[Serializable] public class MapRing {public int feature;public MapPoint[] points;}
[Serializable] public class MapPoint {public float x,y;}
public class NativeMapView:VisualElement {
 readonly NativeMapData map;
 public NativeMapView(NativeMapData data){map=data;style.height=360;style.flexShrink=0;style.backgroundColor=new Color32(16,25,35,255);generateVisualContent+=DrawMap;}
 void DrawMap(MeshGenerationContext ctx){var all=(map.rings??Array.Empty<MapRing>()).SelectMany(r=>r.points??Array.Empty<MapPoint>()).ToArray();if(all.Length==0)return;var rect=contentRect;if(rect.width<10||rect.height<10)return;float minX=all.Min(p=>p.x),maxX=all.Max(p=>p.x),minY=all.Min(p=>p.y),maxY=all.Max(p=>p.y);float scale=Mathf.Min((rect.width-24)/Mathf.Max(.001f,maxX-minX),(rect.height-24)/Mathf.Max(.001f,maxY-minY));var pen=ctx.painter2D;pen.strokeColor=new Color32(155,188,207,255);pen.lineWidth=1.3f;foreach(var ring in map.rings){if(ring.points==null||ring.points.Length<4)continue;pen.BeginPath();for(int i=0;i<ring.points.Length;i++){var p=ring.points[i];var xy=new Vector2(12+(p.x-minX)*scale,12+(maxY-p.y)*scale);if(i==0)pen.MoveTo(xy);else pen.LineTo(xy);}pen.ClosePath();pen.Stroke();}}
 public static NativeMapEntry Match(NativeMapIndex index,string state,int congress)=>index?.maps?.Where(x=>string.Equals(x.state,state,StringComparison.OrdinalIgnoreCase)&&x.start<=congress&&x.end>=congress).OrderBy(x=>x.end-x.start).FirstOrDefault();
}
}