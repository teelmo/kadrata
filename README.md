# kadrata

A three.js WebGL landing-page concept: a cross-fading background scene with drifting cloud sprites, revealing a headline and body text on scroll.

**Live**: https://teelmo.github.io/kadrata

## Tech stack

- [Vite](https://vitejs.dev/) + React 19
- [Biome](https://biomejs.dev/) for formatting/linting
- [@teelmo/web-styles](https://github.com/teelmo/web-tools) for the shared CSS reset/basics
- [three.js](https://threejs.org/) for the WebGL scene, driven directly in `src/jsx/App.jsx` (custom shader material, sprite-based clouds, scroll-triggered scene transitions)

## Development

```
npm install
npm start
```

Opens at http://localhost:8080.

## Build

```
npm run build
```

## Deploy

```
npm run push            # push to GitHub
npm run sync-gh-pages   # publish dist/ to the gh-pages branch
```
