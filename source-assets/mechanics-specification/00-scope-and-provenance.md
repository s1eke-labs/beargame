# Beargame independent mechanics specification

Reference: Kittens Game checkout at commit `781e379f79f1e7512d168849cba21ed111502644`, inspected 2026-10-08. All line references in this directory are relative to that fixed checkout. The reference is a source of gameplay facts, numerical measurements and dependencies only. Its WET PAWS license is not permission to reuse code, descriptions, art, tables, or implementation. No reference source belongs in the deliverable. This specification is independently written; implementation architecture, UI text, illustrations and code must be original. It is not a legal opinion.

## Confidence and implementation claims

- `VERIFIED`: directly inspected numeric/mechanical fact at the cited reference location.
- `CATALOGUED`: existence and source location established, detailed behavior still needs inspection.
- `UNVERIFIED`: insufficient source review or runtime comparison; never label equivalent.
- A verified rule is not automatically an implemented rule. Engine/UI/QA workers own their implementation and test matrix. This directory intentionally does not assert that implementation is complete.
- Primary goal is behavioral/numerical correspondence, including long-game systems, with original bear-world terminology. Reference identifiers used below are provenance handles, not required player-facing labels.

## Original thematic mapping

A Chinese-language woodland bear civilization lives through the seasons. A hive produces honey. Bears eat honey and work in gathering, forestry, mining, scholarship and ritual. Catnip maps to honey; kitten maps to bear; field maps to beehive; farmer maps to beekeeper. Wood remains wood. The 100-food-to-1-wood initial action is a provisioned forest expedition: spend 100 honey to bring back 1 wood, not honey physically becoming wood. Its improved-refinement technology becomes expedition provisioning. Initial manual food gathering is collecting wild honey.

Other ordinary materials retain their factual meanings in Chinese (wood, ore, iron, steel, coal, oil, science/knowledge, culture, faith). Fantasy resources and world names should receive coherent newly authored labels; do not use the reference's expressive descriptions. Unusual spellings in provenance handles (`concrate`, `compedium`, `sattelite`) need not become user-facing typos.

## Practical engine separation

Keep progression facts distinct from the original simulation code. Recommended functional boundaries are: command validation; time advancement; effect aggregation; production/consumption; storage; prerequisites; craft transforms; trade and random events; celestial/faith/prestige state; persistence and migrations. Every command should return success/failure plus a reason without partially charging resources. Fractional resource costs and outputs are meaningful; do not round the internal model to displayed integers. UI cannot silently permit locked actions.
