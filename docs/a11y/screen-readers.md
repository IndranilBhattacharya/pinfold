# Screen-reader matrix: accordion

Automated checks (axe, keyboard, focus, reduced motion, forced colours) run on every CI build:
`node scripts/a11y-report.mjs` writes `a11y-report/report.md` (CI uploads it as the
`a11y-report` artifact). Screen readers need a person. Run this script before each stable release
and fill in the table.

## How to test
1. `npm run build`, then `node scripts/a11y-report.mjs`. Open the fixture page it renders (or the
   site's playground) in the browser under test.
2. With the screen reader on, for the first accordion:
   - Navigate by headings (H / Ctrl+Option+Cmd+H / swipe). Expect each row as a heading, level 3.
   - Tab to the first trigger. Expect: "<title>, button, expanded" (or "collapsed").
   - Press Enter, then Space. Expect the state to be announced as it changes.
   - Arrow Down / Up, Home / End. Expect focus to move between triggers and each to be announced.
   - On the disabled row ("Warranty"). Expect "dimmed" / "unavailable", and no state change on Enter.
   - Open a row and move into its content. Expect a region named after its trigger.
   - Tab past a closed row. Expect its content (the "Policy" link) to be skipped.
   - Browser find (Ctrl/Cmd+F) for "Policy" (Chromium). Expect the row to open on the match.

## Results

| Screen reader | Browser / platform | Version | Date | Result | Notes |
|---|---|---|---|---|---|
| NVDA | Chrome, Windows | | | Not yet run | |
| NVDA | Firefox, Windows | | | Not yet run | |
| JAWS | Chrome, Windows | | | Not yet run | |
| Narrator | Edge, Windows | | | Not yet run | |
| VoiceOver | Safari, macOS | | | Not yet run | |
| VoiceOver | Safari, iOS | | | Not yet run | |
| TalkBack | Chrome, Android | | | Not yet run | |

Result values: Pass, Pass with notes, Fail (link an issue).
