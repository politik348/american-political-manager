# Unity migration scaffold
Target: Unity 6, Android/iOS/desktop. This directory is a C# starter scaffold, NOT a complete runnable Unity project.
1. Create a new Unity 2D project and copy `unity/Assets/APM` into its Assets folder.
2. Copy `data/world.json` to Assets/APM/Data as a TextAsset. Load using GameRules.LoadWorld.
3. Build UI Toolkit or uGUI scenes for career, people, states, elections, history, review, settings. Bind to GameState.
4. Port remaining election, review, vote and successor rules from engine.js and add parity tests. Persist JSON using Application.persistentDataPath.
5. For full Congress data and portraits use documented sources; retain image credit and per-file license. Download and package verified portraits as allowed for native offline use.
The browser app is not directly executable as C#; JSON data and save schema are portable. No Unity Editor build or device test has been performed.