# Chapter publication architecture

Public production builds are selected at build time. A browser flag is never a release boundary.
The complete existing game source and original artwork remain in `src/engine`, `src/ui`, and `public/art`.
Only selected standalone chapter modules and physically separated image pixels enter `dist`.

## Release sequence

1. Forest home: seven research items through construction; eleven buildings; forest survival, jobs, hunting, basic crafting and workshop improvements.
2. Flourishing settlement: planned, pending dependency review and extracted implementation.
3. Industrial era: planned, pending dependency review and extracted implementation.
4. Space travel: planned, pending dependency review and extracted implementation.
5. Time chapter: planned, pending dependency review and extracted implementation.

Only `forest` is publishable. Building any unfinished profile fails rather than accidentally publishing the full game. Later chapters must retain stable released IDs and the cumulative save family. A new profile becomes ready only after its own closure, emitted-build campaign, compatibility, and leakage tests pass. Full implementations still exist in the private source; they are not yet approved chapter artifacts.

## Commands

- `npm run build`: forest release, staging first, verified before replacing `dist`.
- `npm run build -- --chapter forest`: explicit profile selection.
- `npm run build:full`: internal complete build in `.private-build/full`, never `dist`.
- `npm run verify:release`: public build, source and release tests, static audit, and full private campaign regression.

## Source of truth and extraction

`scripts/releases/profiles.mjs` is a private positive membership policy. `scripts/releases/catalog.mjs` derives released prices, rates and prerequisites from the original full source; no browser imports the original catalogue. Forest mechanics live in separate self-contained modules with parity tests against the full simulation. Extraction must preserve released numeric behavior. Future feature modules must not be imported through a nominally shared core.

Retained baseline mechanics include seasonal weather, food consumption, happiness, skills, hunting rewards, mineral events and pollution where applicable. Later-specific storage fields and explorer combat effects are not part of this chapter. First-chapter hunting rewards remain even when later uses are excluded.

The ordered build queue is a baseline feature in the forest chapter. It starts with three slots, gains one after construction research, and includes only chapter-approved buildings, research after a library, and improvements after a workshop. Queued actions use current prices and the ordinary purchase path; one head unit advances per exact simulation tick, including offline replay. Older chapter saves without a queue load an empty queue without resetting progress. Later chapter work must preserve this released behavior rather than treat the queue as a future-only subsystem.

The forest art pack contains only approved standalone crops. An atlas that includes future pictures is private even if only one coordinate is used. Asset extraction is reproducible and verified by its build helper. No original atlas, full art metadata, documentation, source maps or private profile enters the release.

## Release inventory

`release-manifest.json` declares every released file with SHA-256 and byte length. The independent verifier checks exact inventory, approved paths, local references, selected catalog dependencies and excluded content. The manifest is an audit record, not a security boundary by itself. Private profile data and source assets are independently reviewed.

Build output is prepared in `.private-build/release-stage`. Failed checks do not replace the previous valid `dist`. Publishing must use the verified artifact, not the whole checkout.

## Saves and compatibility

Use `beargame.chapters.save.v1`, separate from the old `beargame.save.v1`. The legacy bytes are never automatically overwritten or trimmed. Chapter saves have distinct `family`, schema/version and `contentLevel` headers. Reject incompatible newer or unknown saves before parsing their feature maps. Keep original bytes available for export. Namespaced ownership leases prevent two tabs from writing over each other.

Current full legacy saves include all resource keys, even unused zeros; they cannot be treated as forest saves just because play progress looks early. Any future conversion requires a separately tested migration and explicit backup. No automatic downgrade is supported.

## Acceptance

- Inspect emitted inventory and code/dependency closure.
- Verify physical art crops and every referenced image.
- Run legal-action chapter progression against emitted modules, plus save/load/offline/invalid-action tests.
- Preserve full-source regression coverage and full campaign replay.
- Test chapter upgrade compatibility before adding a new public chapter.
- Check narrow-screen UI and actual deployed routes; a desktop narrow viewport is not a physical-phone performance test.
- Check old excluded URLs after deployment where hosting permits. Prior public downloads cannot be recalled; v48 and earlier were complete public test builds.
