# Fonts

Inter and Newsreader are subset to Latin plus the marks the site sets (`U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+0192,U+02C6,U+02DC,U+2013-2014,U+2018-201E,U+2020-2022,U+2026,U+2030,U+2032-2033,U+2039-203A,U+20AC,U+2122,U+2190-2199,U+21A9,U+2212,U+2215,U+2248,U+2260,U+2264-2265,U+25CF,U+261C-261F`; ƒ for camera settings), the script to `U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2032-2033,U+20AC,U+2122,U+2190-2193,U+2212`, with `pyftsubset`. The family names are rewritten so the app can ask for them plainly.

- **Inter** (`Inter.ttf`, `Inter-Italic.ttf`): variable `opsz` 14–32 and `wght` 100–900. From google/fonts `ofl/inter`. SIL OFL, see `OFL-Inter.txt`. Used for the interface: the Site card, Close, labels and controls.
- **Newsreader** (`Newsreader.ttf`, `Newsreader-Italic.ttf`): variable `wght` 200–800 and `opsz` 6–72. From google/fonts `ofl/newsreader`. Family renamed from "Newsreader 16pt". SIL OFL, see `OFL-Newsreader.txt`. Used for reading text and headings.
- **Macintosh Skeletal** (`MacintoshSkeletal.otf`): from github.com/npwitk/Macintosh-Skeletal-Filled, `MacintoshSkeletalVariableJoined.otf`. It is a rebuild of Apple's "hello" handwriting. To make it:
  1. Subset it, keeping every layout feature, since `calt` inserts the join bridges.
  2. Instance it at `wght=300` with `fonttools varLib.instancer`.
  3. Convert CFF2 to CFF with `fonttools cffLib.CFF2ToCFF`.
  4. Subroutinize it with `cffsubr`.

  That takes it from 52 MB to 1.9 MB. Weight is pen radius, so the plate gets any weight back in the shader by offsetting the lettering's distance field.
- **Lilex** (monospace) comes with `gpui_fonts`.
