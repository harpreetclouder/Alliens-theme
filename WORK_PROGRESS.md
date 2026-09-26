# Work Progress — Orbital

## Status
**v0.0.42** — `@giphy/js-fetch-api` is a real dependency and is bundled into the extension

## GIFs
- Package: `@giphy/js-fetch-api` in `package.json`
- A celebration uses GIFs already saved in the local cache
- If the cache is empty and `orbital.giphy.sdkKey` is set, the package fills the cache in the background
- No key: the pack GIFs in `media/gifs` play, and the network is not called

## Evidence
[orbital-verifier](1a583887-921e-42af-8c2f-a4920fbb73e5) **PASS**. Typecheck clean, 152 tests. `@giphy/js-fetch-api` is inlined in `out/celebrations/giphy.js`. Celebrations use the cache and do not wait on the network.
