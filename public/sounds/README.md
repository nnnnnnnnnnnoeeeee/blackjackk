# Sound effects

These `.wav` files are **generated procedurally** (no external/copyrighted
assets) by `scripts/gen-sounds.mjs`.

Regenerate / tweak them with:

```bash
node scripts/gen-sounds.mjs
```

Edit the sound-design functions in that script to change a sound. The file
names here must stay in sync with `SOUND_FILES` in `src/hooks/useSound.ts`.
Sound is opt-in: enable it in the in-game Settings panel (`soundEnabled`).
