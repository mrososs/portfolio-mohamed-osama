# Mohamed's Dev World

> Don't just view my portfolio. Explore it.

An interactive, isometric pixel-art world at **`/world`** that sits next to the classic portfolio (**Quick View**, `/`). Both experiences read from the same content source.

## Architecture

```
usePortfolio.ts  ──►  Quick View sections (/)        ─┐
(single source)  ──►  Case-study pages (/projects/*)  ├─ shared <ProjectDetail>
                 ──►  /world page (Vue)  ─────────────┘
                          │  WorldContent (labels only)
                          ▼
                     GameBridge  (typed events + commands, no Phaser import)
                          ▲
                          │
                     Phaser WorldScene  (movement, camera, art, interactions)
```

- **Vue owns the UI.** It handles the HUD, dialogs, project details, contact, mobile controls and navigation. These are accessible HTML, so they work even without the canvas.
- **Phaser owns only the world.** It handles rendering, movement, collision, proximity focus and effects.
- **`GameBridge`** (`app/game/bridge.ts`) is the only connection between the two:
  - Game → Vue events: `ready`, `zone`, `focus`, `interact`, `firstMove`.
  - Vue → Game commands: `travel`, `interact`, `transmit`.
  - Shared state for continuous input: the joystick vector, `paused` and `muted`.
- **Client-only, lazy loading.** `WorldCanvas.vue` does `await import('~/game')` inside `onMounted`. Phaser never runs during SSR and never ships with Quick View; the build output confirms this.
- **Cleanup.** The game is destroyed on route exit (`game.destroy(true)`), and bridge listeners are cleared. Repeated `/` ↔ `/world` navigation leaves exactly one canvas, which is covered by a test.

## Folder structure

```
app/
├── composables/usePortfolio.ts    # shared content: projects (+slug, status, world slot), capabilities, …
├── components/
│   ├── ProjectDetail.vue          # project details used by the world dialog AND /projects/[slug]
│   └── world/
│       ├── WorldCanvas.vue        # client-only Phaser host (dynamic import, destroy on unmount)
│       ├── WorldHud.vue           # title, location, Map / Projects / Contact / sound / Quick View
│       ├── WorldPanel.vue         # every overlay: welcome, guide, projects, project, skill, AI, robot, contact
│       └── WorldTouchControls.vue # joystick + action button (touch devices only)
├── game/                          # Phaser code — never imported statically by Vue
│   ├── index.ts                   # createWorld(): boots Phaser.Game
│   ├── bridge.ts                  # GameBridge + shared types (no Phaser import)
│   ├── types.ts / panels.ts       # WorldContent / WorldOptions, overlay union + mapping
│   ├── layout.ts                  # iso grid math, zones, bridges, walkable map
│   ├── audio.ts                   # synthesised WebAudio SFX (muted by default)
│   ├── art/                       # procedural pixel art: palette, pixel canvas, textures, avatar
│   └── scenes/WorldScene.ts       # the world: zones, props, player, camera, focus, travel
└── pages/
    ├── world.vue                  # /world — SEO, HUD, overlays, deep links, fallback
    └── projects/[slug].vue        # prerendered case-study pages (drafts → 404)
```

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000/world
npm run build      # production build; prerenders /, /world and every case study
npm run preview
```

Deep links:

- `/world?project=<slug>` places the player at that project's display and opens its panel.
- `/world?zone=projects|skills|ai|contact` starts in that zone.

## World layout

| Zone (screen direction) | What's there | Content source |
| --- | --- | --- |
| **Welcome Plaza** (centre) | Spawn point, *Dev World* sign (welcome), floor hologram, Byte the guide bot (fast travel), **Quick View portal** | — |
| **Projects Hall** (north) | Four featured displays: workstation, travel kiosk, giant phone, ID-card terminal. Project archive rack at the back | `projects[].world` |
| **Skills Workshop** (east) | Five holo workbenches | `capabilities` |
| **AI Laboratory** (west) | B-07, a scripted assistant clearly labelled "not a live AI model"; neural core; four workflow displays | `aiWorkflows`, AI-Driven-Form-Builder |
| **Contact Station** (south) | Comm terminal with a transmission effect; antenna beacon | `profile` |

The four zones connect to the plaza by bridges. The HUD **Map** menu fast-travels to any zone.

## Controls

| | Desktop | Touch |
| --- | --- | --- |
| Move | WASD / arrow keys | D-pad (hold; two arrows = diagonal) |
| Walk to a spot | Click the floor | Tap the floor |
| Interact | Walk to a glowing object, then press **E** / **Enter** / **Space**, or click it | **Interact** button (lights up when something is in reach), or tap the object |
| Close overlay | **Esc** | ✕ |
| Shortcuts | HUD: Map, Projects, Contact, sound, Quick View | same |

**Tap / click to move:**

- A tap or click plans an A* route (8-directional, no corner-cutting) over the same cell grid and blocked tiles the collision system uses (`app/game/systems/pathfinding.ts`).
- The route is string-pulled into straight segments and walked through the normal movement code.
- A pixel destination marker (`systems/DestinationMarker.ts`) sits at the world point. It pulses while the player travels, flashes on arrival, and becomes a red cross for unreachable taps.

Movement rules:

- A new tap replaces the route.
- Keyboard or D-pad input cancels it.
- Opening an overlay or fast travelling cancels it.
- Tapping an object walks to it, then interacts.

UI taps never reach the world: Phaser's window input events are off, and only presses that start on the canvas count.

**D-pad:** it only writes a direction into `bridge.input`. The game's existing movement reads and normalises it, so diagonals aren't faster. It releases all directions on pointer-up, pointer-cancel, lost capture, window blur and tab hide.

`prefers-reduced-motion` turns off particles, bobbing, flicker, camera smoothing and fades.

## Project → world mapping

Each project in `usePortfolio.ts` can declare `world: { display, slot }`:

| Slot | Display | Project | Status |
| --- | --- | --- | --- |
| 0 | `workstation` | iSaned Virtual Office | `demo` — from the public `mrososs/virtual-office` README |
| 1 | `kiosk` | Golden Future Travels | **`draft` — needs real content** |
| 2 | `phone` | Pockit Mobile App | `in-progress` — from the public `mrososs/pockit-ng-native-angular` README |
| 3 | `id-terminal` | Digital QR Profiles | **`draft` — needs real content** |

- Drafts are hidden from Quick View, have no case-study page, and show "coming soon" in the world.
- To publish a draft, fill in `description`, `stack`, links and `media`, then remove `status: 'draft'`.
- Skill stations link to projects through `capabilities[].projectSlugs`.

## Asset licensing

There are **no third-party art, audio or font files** in the world:

- **Art:** every texture (tiles, island edges, walls, props, avatar, robots, glow) is generated at boot by `app/game/art/*` from one palette. It's original and committed as code.
- **Audio:** sound effects are synthesised with WebAudio oscillators.
- **Fonts:** Space Grotesk, Manrope and JetBrains Mono, already loaded by the site from Google Fonts (SIL OFL).
- **Engine:** Phaser 3.90.0 (MIT).

The art is a coherent first version, not commissioned final artwork. See the known limitations below.

## Performance decisions

- **Phaser is lazy-loaded.** It's a separate chunk (≈1.24 MB raw / ≈332 KB gzip) requested only by `/world`; Quick View doesn't request it (verified).
- **Ground is baked.** The ground (~1,000 tiles plus island edges) is drawn once into one RenderTexture.
- **Textures are generated once, procedurally.** Nothing is downloaded and no atlas files are needed.
- **Particles are capped.** There's one low-frequency emitter per zone and a single shared burst emitter. All are disabled under reduced motion.
- **Pixel-art rendering is crisp.** It uses integer camera zoom (2–4, based on the viewport), `pixelArt` and `roundPixels`. Text textures use linear filtering at high resolution.
- **Collision runs on the grid.** It works in grid space, one axis at a time, so walls are axis-aligned there and the player slides along them without physics.

## Testing results

Last run: Playwright with Chrome against the **production build** (`node .output/server/index.mjs`). The script is outside the repo; its checks are listed here. **35 / 35 checks passed.**

- **Desktop 1440×900:**
  - welcome on first visit; Esc closes overlays;
  - holding W walks from the plaza across the bridge into the Projects Hall;
  - Map fast travel to all four zones;
  - Projects index → project detail → Back;
  - `?project=` URL sync;
  - Contact panel email;
  - pressing E at the contact terminal opens contact;
  - no runtime errors.
- **Deep links:**
  - `?project=pockit` opens the panel in the Projects Hall;
  - closing clears the query;
  - E at the display reopens it;
  - `?zone=ai` works.
- **Lifecycle:** refreshing `/world` leaves one canvas. Three rounds of `/world` → Quick View → `/world` leave no canvas on `/` and exactly one on `/world`.
- **Mobile 390×844, touch:**
  - touch controls render;
  - the joystick (CDP touch events) walks to the Projects Hall;
  - no horizontal overflow;
  - Projects dialog is readable.
- **Case study and drafts:** `/projects/virtual-office` returns 200 with an h1. A draft slug returns 404.
- **Reduced motion:** a reduced-motion context loads the world without errors.
- **Bundle:** Quick View never requests the Phaser chunk; `/world` does.
- **Static checks:** `vue-tsc` type check is clean; `nuxt build` succeeds; dev hydration shows no mismatch warnings on `/world` or the case-study pages.

Not tested: real phones, Safari or Firefox, screen-reader walkthroughs, low-end GPU frame rates.

### Controls QA

The controls suite ran with Playwright and Chrome against the dev server, using real CDP touch events and reading player state through the dev-only `window.__devWorld`. **44 / 44 checks passed.**

- **D-pad:** each direction moves; holding is continuous; release stops with 0 px drift; two-finger diagonal speed equals straight speed (≈66 px/s).
- **Tap-to-move:** the marker lands at the exact world point; the player arrives within 3 px; routes go around obstacles with 0 off-floor samples; a second tap re-targets; the D-pad and keyboard cancel the route; unreachable taps show the invalid marker.
- **Isolation:** HUD and control taps never move the player.
- **Interact button:** disabled with nothing in reach, enabled near a display, and opens the project.
- **Click-to-move on desktop** works.
- **Responsive:** single-row HUD with no overflow, controls inside the viewport and the player visible at 360×740, 375×667, 390×844, 430×932, 768×1024, 844×390 (landscape) and 1440×900.

## Known limitations

- Golden Future Travels and Digital QR Profiles are **drafts** with titles only, because no public source was found.
- No project has screenshots or video yet. `media` is supported but empty everywhere.
- Project `role` is left empty where it isn't documented; add it once confirmed.
- The procedural art is a consistent v1 and **not** final production artwork. Candidates for commissioned art: the avatar (no portrait likeness), the robots, and the project displays.
- Depth sorting uses footprint centres, so small overlap glitches can appear at prop corners.
- The world is always dark, regardless of the site's light theme.
- `public/sitemap.xml` is static; update it when adding case studies.

## Future expansion

- A real AI assistant for B-07 behind a server route: rate-limited, no keys in the client.
- Project media: screenshots and short clips per display, with a gallery in the panel.
- A minimap and visited-zone tracking.
- Commissioned sprite art behind the same texture keys.
- Ambient soundtrack (opt-in).
- An Experience timeline room driven by `experience`.
