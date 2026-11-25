# APM V17.9 — 1,000 authored political RPG encounters

## Definition of done
1,000 independently authored, substantively distinct scene scripts, not the Cartesian product of names, venues, or paraphrased questions. Each scene has a different purpose, narrative situation, evidence cue, interaction or consequence. A scene has 2–5 opening turns, one four-option response embedded in a dialogue, and separate correct/incorrect follow-up dialogue. Fictional scenes and quotations are explicitly labeled; historical facts and correct answers are independently sourced. No unsupported private conduct, invented historical positions, or targeted real-world campaign advice. Historical election results may appear only after the result was known; simulations are labeled.

## Work allocation
Each pack owns exactly 100 scenes, in four independent 25-scene files. IDs P01-001 to P01-100, etc. Never modify another pack or any shared game source. Packs are staging content until integration is tested.

| Pack | Domain |
|---|---|
| P01 | House members, dated districts, redistricting, delegation introductions |
| P02 | Senators, states, Senate leadership, terms and succession |
| P03 | House/Senate candidates, historical close elections, election returns, special elections |
| P04 | Presidential candidates, primaries, conventions, running mates, Electoral College |
| P05 | Landmark federal legislation 1900–1959: authors, sponsors, provisions, dates and passage |
| P06 | Landmark federal legislation 1960–2026: authors, sponsors, provisions, dates and passage |
| P07 | Congressional committees, leadership, procedure, institutional conflicts |
| P08 | Presidents, vice presidents, governors, cabinets and career transitions |
| P09 | Landmark historical events, Supreme Court cases and constitutional amendments |
| P10 | Multi-person encounters, historical relationship recall, mistaken identity, return meetings |

## Worker prompt
You are writing a content pack for the noncommercial educational game American Political Manager, repository politik348/american-political-manager. Read this file and inspect existing encounters.js and encounters-ui.js first. Your assigned PACK is supplied by the user. Write 100 genuinely different political RPG scenes in four batches of 25; each batch must be complete now when requested, with no promise of background work. A new person, venue, date or synonym alone does not make a new scene. Avoid repetitive staff asking for a missing roster field; use direct NPC questions, interrupted conversations, overheard exchanges, requests to check documents, correcting a misintroduction, a reunion, a legislative discussion, a broadcast, introductions, committee business, and other meaningfully different interaction structures. Use at least 15 distinct interaction mechanisms per pack. At most 10 scenes may share the same mechanism. At least 30 scenes have the player completing a natural sentence; at least 20 have two or more real NPCs where factually appropriate. Never turn a real political figure's invented dialogue into a historical quotation. No obscure bills simply to increase the count. Use only landmark measures and verified links; if information cannot be checked, omit it and replace the scene. Do not assign fictional views or scandals to real people. Make wrong answers plausible and distinct. The response must contain the blank naturally; no quiz-style "Which is correct?" as default. Wrong responses get a natural correction without punishment or humiliation. Consequences can create fictional follow-up appointments, a notebook entry, new contact or an unlocked historical document, not fixed support bonuses. Separate the real history from the fictional consequences.

Verify historical facts on official sources or reputable archival data; capture exact URL and evidence summary. For terms use dates, office, state and district as applicable; don't extrapolate district changes. A candidate need not be a sitting member. Use an event date and knowledge cutoff consistent with the record. No election result before election day, no bill passage before passage. Use Bioguide ID if verified; otherwise exact source-linked name, never guess ID. Portraits reuse existing manifest, with verified official image reference only when available; missing photos use fallback. Korean primary, natural English counterpart for every dialogue and choice.

## JSON staging contract (schema 1)
Save only to data/dialogue-packs/Pxx/part-01.json through part-04.json. Each file is an object: {"schema":1,"pack":"Pxx","part":1,"scenes":[...25 scenes...]}. Each scene has:
- id (Pxx-NNN); mechanism (short stable English slug); learningTarget (specific fact, not general topic)
- date (YYYY-MM-DD historical scene date); venue {ko,en}; context {ko,en}
- cast [{id: verified Bioguide ID or null, name, ko, portrait: verified URL or null, source: official biographical URL}]; use only necessary cast.
- opening [{speaker:"player"|"aide"|"host"|"npc:0"|"npc:1" etc.,ko,en}]; 2–5 turns
- response {speaker:"player",ko,en,choices:[{id:"A",ko,en}, ... B,C,D],correct:"A"|"B"|"C"|"D"}; ko and en each include exactly one literal {{blank}} placeholder.
- followup {correct:[{speaker,ko,en}],incorrect:[{speaker,ko,en}]}; each has at least one complete, natural line. Wrong follow-up explains correct historical fact.
- evidence [{url, claim, asOf:"YYYY-MM-DD"}]; one or more direct URLs covering the correct fact, date and actor.
- outcome {kind:"notebook"|"revisit"|"appointment"|"document",key:"stable-key"}; fictional non-numeric reward
- fictional:true
No markdown in JSON. No shared file updates. Return exact GitHub commit(s), valid scene count, interaction mechanism counts, and missing factual/image coverage. If GitHub unavailable, output complete JSON file instead. Do not claim live gameplay integration; the integrator will handle it. Do not create mock facts, padded duplicates, or future work promises. A later integration pass will verify all 1,000 scenes, portrait lookup, scene scheduling, answer uniqueness, era gating and browser playback before publishing.

## Sources
- https://github.com/unitedstates/congress-legislators
- https://bioguide.congress.gov/
- https://history.house.gov/Institution/Election-Statistics/
- https://www.archives.gov/electoral-college/results
- https://www.archives.gov/milestone-documents/list
- https://www.senate.gov/legislative/landmark-legislation.htm
- https://www.congress.gov/
Use the exact source pages supporting each scene, not just these indexes. If a site is inaccessible, use an accessible official equivalent. 
