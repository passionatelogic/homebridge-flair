# Provenance

This fork is a **patched redistribution** of `@sfenton/homebridge-flair`, maintained
by [passionatelogic](https://github.com/passionatelogic) so the fix survives plugin
reinstalls.

## What is shipped

The compiled `dist/` in this repo is the published **`@sfenton/homebridge-flair@1.6.1`**
build (which includes the OAuth 2.0 `client_credentials` client used with a Flair
`clientId` / `clientSecret`), with the following fixes applied on top:

> 1. **Undefined numeric characteristics → "No Response" (the original bug).** Room,
>    vent, puck and structure accessories wrote raw Flair readings straight into
>    HomeKit's `CurrentRelativeHumidity` / `CurrentTemperature` / `TargetTemperature`
>    characteristics. When Flair returns no value it is `undefined`, and HomeKit
>    requires a finite number, so it rejected the accessory — leaving it stuck at
>    "Connecting…" then "No Response". Every numeric write is now guarded with
>    `Number.isFinite()`.
> 2. **Set handlers could hang HomeKit.** Room/structure set handlers only invoked the
>    HomeKit callback inside `.then()`; a failed Flair API call left Home spinning. A
>    `.catch(callback)` now fails fast.
> 3. **Clearer auth error.** `checkCredentials()` now logs the real error instead of a
>    fixed "incorrect credentials" string.

Published as version **1.6.3** so the Homebridge UI never offers to "update" backward
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
