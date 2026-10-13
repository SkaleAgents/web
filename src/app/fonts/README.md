# Bundled Syne

`Syne.ttf` is the source variable Syne font from
<https://github.com/google/fonts/tree/main/ofl/syne>, downloaded on 2026-09-25.
The app serves `Syne.woff2`, converted from this source with FontTools 4.66.0
and Brotli 1.2.0. It preserves the variable weight axis and reduces the asset
from 146,980 bytes to 60,704 bytes. Its SIL Open Font License is preserved in
`Syne-OFL.txt`.

SHA-256: `ce5ac77142a65cab2248a1a2ebb740b1d4d9c20b52488877d3ff664d1356104a`.

The local asset avoids the Syne Google Fonts response that caused Turbopack's
`next/font/google queries have exactly one entry` build failure in CI.

# Bundled Source Sans 3

`SourceSans3.woff2` is the Latin subset of the variable Source Sans 3 font
(weights 400 to 600) served by Google Fonts, downloaded on 2026-10-13. Its SIL
Open Font License is in `SourceSans3-OFL.txt`. It is bundled because Railway
builds failed with `next/font/google queries have exactly one entry` for the
Google Fonts response.
