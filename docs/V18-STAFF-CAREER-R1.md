# V18 staff career: first slow-growth pass

- New staff careers start as volunteers. Existing rank/XP are retained via a one-time rank mapping; they do not get assigned invented historical employers.
- Work outcome base probabilities 5/15/55/15/10%, modified by fit, skill and fatigue. XP 1–5; office trust changes by at most one per successful quarter, losses possible. Dialogue earns at most two XP per quarter and cannot bypass the trust cap.
- Real sitting members with exact term records in the selected state and party are available as fictional employer options. Prior service (under 3, 3–7, 8+ years) is only a proxy for game difficulty, not a verified electoral safety measure; future results are not used. Hiring costs one action and energy. Promotions require cumulative experience, tenure, trust, skills and a quarterly simulated review.
- Confirmed end of the same seat can terminate fictional employment if the full congress catalog is available. Missing records never trigger job loss. Career XP is retained. State 51 and alternate history gameplay remain separate.
- Not yet included: historical district-level vote margins, candidate campaigns, staff vacancies as persistent entities, job salary, and detailed office-specific task narratives. All appointments and hiring probabilities are simulated, not actual congressional personnel records.

## R2
- Election data adapter uses MIT MEDSL House 1976–2024 via the documented electiondata.dev yearly JSON API. Only previous regular general election, matching party and district, complete vote totals and no decennial boundary mismatch; no future results. On failed or absent data, uses past service, never fabricated margin. External API availability and coverage must be verified; Senate margins and pre-1976 returns not covered.
- Deterministic persistent fictional vacancies and applicant counts, fewer openings in stable offices, a closed position cannot be applied to. Campaign options are explicitly fictional district newcomer campaigns, not actual historical candidates; temporary contracts terminate election-year Q4, no effect on real elections. Promotion competes for simulated vacancies.
- Current V18 UI improvements retained; legacy 17.8 encounter UI intentionally remains frozen. Browser cache assertions updated to match the new cache generation.

### Static data staging
Pinned public copy of the MEDSL V15 TSV, source mirror and exact Git blob recorded. The isolated staging workflow validates coverage and selected close races, then persists compact margins only to the PR branch. The client reads the local JSON before considering the API. Data staging and browser checks must succeed before release. The mirror is not independently byte-compared to Harvard Dataverse by this workflow.

### R3 data import result
25 regular election years (1976–2024), 9,498 district-year observations passed complete-vote and candidate validation. Data committed to isolated branch b60fe545690913ed114d1314f03711747bb7b880. Data included in offline shell; latest main spaced-practice UI preserved. Final validation remains required.

### R7 trust pacing
State 51 now shares the staff-mode quarterly trust budget: recommended work and positive dialogue combined may add at most one trust point per quarter; other work adds no trust. The budget is persisted across reloads. Staff work probabilities, XP, fictional support, historical records and existing accumulated trust are unchanged. This is a gameplay balance rule, not an empirical model of political trust.
