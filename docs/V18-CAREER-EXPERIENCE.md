# V18 preview 1 — career experience and history protection

## Contract
- Staff: a fictional additional aide, not a replacement for any historical officeholder. Real elections, appointments, votes, offices, and events remain fixed. Only fictional XP, skills, trust, tasks, follow-ups, and rank change.
- State 51: fictional municipal and state offices only. Local election results live in v18.localElections, never the historical election or federal office arrays. No actual federal seat is created.
- Alternate: existing fictional career and election engine remains available. Historical sources stay separate. Prior historyMode saves remain accessible as explicitly labelled legacy fictional careers.
- Protected careers have separate storage keys from V17.8; combined new career capacity remains five. Do not silently migrate or overwrite legacy careers.
- Photo asset files, portrait mappings and dialogue data are outside this team's scope.

## Preview implemented
Three choices on new career setup; responsive single-office dashboard; quarterly tasks, immediate feedback, follow-ups, six ranks, fictional local elections, skills and awards; historical archive from existing source-linked world data; era color themes; compact campaign progress header for existing election engine; basic decluttering of legacy career home; unit/browser tests.

## Next milestones (not implemented in this preview)
UX: full five-menu architecture, accessible archive navigation, usability testing.
Political RPG: richer scenario choices with tradeoffs, authored P01/P02 learning activities scoped to dates and protected mode, fictional mentor/team relationships and multi-quarter consequence chains, specialization perks, staff role/assignment variety, protected save import.
Election: full counting broadcast, debate pacing and optional timer, fictional local election campaigns and terms, victory/defeat ceremonies.
Living history: sourced news chronology, era-specific visuals/audio with mute/reduced motion, achievement catalog, retirement and career chronicle.

No new historical facts or invented real-person quotations added. Preview is not release approval; verify Node and Chromium on exact candidate head and reconcile concurrent portrait work before merge.

## Preview 2 — Living Political World
- Protected staff and State 51 careers now have a UTC day-level calendar; ordinary dates jump to the next scheduled conversation, registered exact-date news or quarter end. Quarterly action budgets remain underneath. Three pacing presets: 4/8/16 days; registered news always interrupts regardless of pace.
- 19 starter historical newspaper editions independently date-checked against the National Archives, archived White House and Miller Center. Coverage is NOT comprehensive. Undated annual records are not assigned guessed dates. News is reconstructed text, not a real newspaper facsimile.
- P01/P02 scenes are automatically offered as explicitly fictional archive reenactments, only if the existing appointment-core audit filter admits them and their original date is within the preceding 30 days. Existing chain and answer history are reused; generic fictional colleague dialogue fills gaps. No implication of a real appointment or quotation.
- News acknowledgment, dialogue response, contacts, calendar date and archive persist per protected save. News data unavailable pauses time rather than skips events. Legacy/alternate mode keeps existing quarter/campaign clock in this preview; shared calendar integration and campaign-specific scheduling are a future milestone.
- Newspaper styles vary by era; no new historical portrait, original newspaper scan or audio asset is included. Existing photo assets are untouched.
- Tests cover news priority, mandatory interrupts, archive/reload, pace, protected record invariants and desktop/mobile. Full historical news coverage, relationship-driven unique narratives, actual audio/animation, and broader UX remain pending.
