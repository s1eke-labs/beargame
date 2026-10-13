Generated with the built-in image_gen tool using reference-bears-atlas.webp as the style anchor. Final PNGs retain generated alpha unchanged.

semantic-resources-b.png: 1536x1024, 6 columns x 4 rows, all 24 identities and row-major positions preserved. Correction removes accidental zebra horn and reflective shine. The image viewer may expose RGB data beneath alpha; colorful RGB outside icons is invisible because its alpha is zero or near zero. Do not flatten the image onto a background. Use alpha-aware crop/packing.

semantic-resources-extra.png: 1254x1254, 2 columns x 2 rows. Row-major: tanker, megalith, karma, burnedParagon. Current runtime extra atlas is 1536x256, so repack these four source cells to the first four runtime slots using your existing packer.

resources-atlas.png: 1254x1254, 4 columns x 4 rows, exact old row-major semantic order. Includes the correct white reference bear in row 3 column 2.

Use source-crops.json for integration. It supersedes the initial fixed-cell boxes in asset-manifest.json: crops now use whole-image connected components, include detached elements, and add 4px antialias padding. No source grid boundaries clip these rectangles. source-crops-audit.json records the method and all component bounds. Existing runtime crops need updating because silhouettes are now larger and simpler. All exact prompts, including the B correction prompt, are alongside the output assets.

No repository files were modified. No deployment was performed.
