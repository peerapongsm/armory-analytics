# Tracking — embed this in every web project

Every **web** project in the 365 build shares ONE self-hosted Umami instance.
Projects are separated by **path within one shared website** in the analytics
dashboard, so they all use the **same** website id. All current projects live
on a single host (`peerapongsm.github.io`); multi-host disambiguation is a
future enhancement.

## The snippet

Paste this once into the `<head>` of each web project:

```html
<script defer src="https://umami-host-peerapongsms-projects.vercel.app/script.js"
  data-website-id="3f09453d-0b39-443e-8845-5e65611cc58a"></script>
```

- **Web / static / Pages projects:** paste it. That's the whole integration.
- **Desktop projects:** skip it — they're measured via GitHub Releases download
  counts, not the web pixel.
- **Demo (backend, torn down):** paste it while the demo is live so the showcase
  window is measured.

No Subresource Integrity hash on purpose: the script is first-party (our own
Umami) and auto-updates on each Umami upgrade, which a pinned `integrity` would
break.

## Where things live

- Umami (collector): `https://umami-host-peerapongsms-projects.vercel.app`
- Website id (shared): `3f09453d-0b39-443e-8845-5e65611cc58a`
- Dashboard + promotion score: this repo (`armory-analytics`)
- Source of truth for the project list: the Armory's `projects.json`

The dashboard reads `projects.json`, resolves each web project to its path,
queries Umami for that segment, pulls download counts for desktop projects,
and ranks everything by promotion score.
