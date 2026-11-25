# Unity migration scaffold
Target: Unity 6, Android/iOS/desktop. This directory is a C# starter scaffold, NOT a complete runnable Unity project.
1. Create a new Unity 2D project and copy `unity/Assets/APM` into its Assets folder.
2. The included Assets/APM/Data/world.json mirrors the root data/world.json. Load it as a TextAsset using GameRules.LoadWorld; keep both copies synchronized.
3. Build UI Toolkit or uGUI scenes for career, people, states, elections, history, review, settings. Bind to GameState.
4. The C# rules include actions, election, review, vote and succession. Verify parity against engine.js and add Unity tests. Persist JSON using Application.persistentDataPath.
5. For full Congress data and portraits use documented sources; retain image credit and per-file license. Download and package verified portraits as allowed for native offline use.
The browser app is not directly executable as C#; JSON data and save schema are portable. No Unity Editor build or device test has been performed.