# Provenance

This fork is a **patched redistribution** of `@sfenton/homebridge-flair`, maintained
by [passionatelogic](https://github.com/passionatelogic) so the fix survives plugin
reinstalls.

## What is shipped

The compiled `dist/` in this repo is the published **`@sfenton/homebridge-flair@1.6.1`**
build (which includes the OAuth 2.0 `client_credentials` client used with a Flair
`clientId` / `clientSecret`), with **one bug fix applied**:

> Room thermostats and puck sensors wrote `undefined` into HomeKit's
> `CurrentRelativeHumidity` characteristic whenever the Flair API returned no humidity
> reading. HomeKit requires a finite number, so it rejected the accessories, leaving
> Flair vents stuck at "Connecting…" and then "No Response" in the Home app. All four
> humidity writes are now guarded with `Number.isFinite()`.

Published as version **1.6.2** so the Homebridge UI never offers to "update" backward
to the unpatched npm 1.6.1.

## Important: do not rebuild

sfenton's public git history (this fork's `upstream`) lags their npm releases — the
OAuth client that ships in npm 1.6.1 was never pushed to a public branch. The `src/`
here therefore reflects the public sfenton source (older auth) plus the humidity fix,
and does **not** compile to the shipped `dist/`. The shipped `dist/` is authoritative.
Do not run `npm run build`; it would overwrite `dist/` with the older auth code and
break `client_credentials` login.

## Updating when sfenton publishes a new version

```sh
npm pack @sfenton/homebridge-flair@<new-version>   # get the new published build
# overlay its dist/, config.schema.json, README.md, CHANGELOG.md into this repo
# re-apply the Number.isFinite() humidity guards to dist/roomPlatformAccessory.js
#   and dist/puckPlatformAccessory.js
# bump version above the published one, commit, push
```

## The humidity fix as a clean source patch

The `src/` humidity guards are also offered upstream as a normal source contribution;
see the `fix/humidity-undefined-characteristic` branch / the upstream pull request.
