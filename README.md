# RVR Ramdukes DTFS — Astro 1:1 Component Build

This build preserves the supplied `sprayed.html` visual design, DOM IDs, Three.js behavior, charts, controls, scroll chapters and model loading while splitting the page into reusable Astro components.

## Run

```bash
npm install
npm run dev
```

## Models

- `public/models/Spray_Machine_full_assembly.glb`
- `public/models/Spray_Machin_Duct_Assembly.glb`
- `public/models/Nozzle.glb`

## Logo

The supplied RVR mark is used in the navbar and footer from `public/assets/rvr-logo.png`. The unmodified upload is retained as `public/assets/rvr-logo-original.png`.

## Components

```text
src/components/
├── Background.astro
├── Loader.astro
├── SiteHeader.astro
├── ThreeStage.astro
├── PartExplorerDrawer.astro
├── LineMonitor.astro
├── Toast.astro
├── HeroSection.astro
├── CinematicChapters.astro
├── HowItSprays.astro
├── NozzleArray.astro
├── MeteringSection.astro
├── UniformitySection.astro
├── ProcessFlowSection.astro
├── MillCaseSection.astro
├── ApplicationsSection.astro
├── SpecificationsSection.astro
├── FaqSection.astro
└── SiteFooter.astro
```

The original Three.js implementation remains in `public/js/sprayed.js` so all existing global IDs and interactions continue to work unchanged.

## Image gallery navigation
The Machine and Spray galleries now include overlay previous/next arrows.

- Left arrow: previous image
- Right arrow: next image
- Wrap-around navigation (01 ↔ 03)
- Smooth directional slide + fade transition
- Thumbnail selection remains available
- Left/Right keyboard navigation works when a gallery has focus
- Images: `public/assets/image/machine1.png` ... `machine3.png` and `spray1.png` ... `spray3.png`
