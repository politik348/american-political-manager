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