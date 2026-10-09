# Kreevo — Remotion

Standalone [Remotion](https://www.remotion.dev) project for Kreevo videos. It has its own
`package.json` and is excluded from the Next.js app's typecheck and lint.

```bash
cd remotion
npm install
npm run studio   # preview & edit at http://localhost:3000
npm run render   # → out/kreevo-intro.mp4
npm run still    # → out/kreevo-intro.png (frame 60)
```

Compositions are registered in `src/Root.tsx`.
