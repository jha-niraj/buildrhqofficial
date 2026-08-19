# Auth background artwork

Two files are generated from one photograph. `auth-bg.webp` is sharp and is used
under the brand column, where the ridge lines are the point.
`auth-bg-blur.webp` is pre-blurred and is used for the page surround and the
mobile wash - see the header comment in
`app/(auth)/_components/auth-backdrop.tsx` for why the surround needed a blurred
image rather than the sharp one, and why the blur is baked in rather than applied
with a CSS filter.

## Source

| | |
|---|---|
| Source | Unsplash |
| Original | `https://images.unsplash.com/photo-1444927714506-8492d94b4e3d` |
| Photo page | `https://unsplash.com/photos/1444927714506-8492d94b4e3d` |
| Subject | Layered mountain ridges in haze |
| License | Unsplash License - free to use, including commercially, no permission or attribution required |

**Processing applied** (from the 2400px original):

- fully desaturated - the original haze is blue, and `CLAUDE.md` pins the palette
  to monochrome black/neutral with blue explicitly ruled out. A partial
  desaturation still reads as a blue wash behind a monochrome UI
- contrast +6%, because greyscaling a hazy image flattens exactly the ridge
  separation that makes it worth using
- `auth-bg.webp`: resized to 2000px wide, WebP q76 - 16 KB, so one file serves
  every breakpoint rather than an `image-set()` of several
- `auth-bg-blur.webp`: downscaled to 1000px, Gaussian blur 13px, WebP q82 - 4 KB
  over the wire. Blurred pixels carry almost no high-frequency detail, so the
  hard downscale is invisible once the browser scales it back up

## Before this ships

Two things worth confirming, because they could not be verified from here:

1. **The photographer.** Unsplash's metadata endpoints (`/napi`, `/oembed`) now
   require an API key, so the individual photo page was not read. The file was
   downloaded from `images.unsplash.com`, which is Unsplash's own CDN and only
   serves Unsplash-licensed photos, but open the photo page above to confirm the
   attribution and that it has not been withdrawn.
2. **Attribution is not required** by the Unsplash License, but crediting the
   photographer is the norm and costs nothing.

## What was NOT used, and why

The original request was to take images from a Pinterest search. Pinterest is an
index of other people's work: the overwhelming majority of pins are copyrighted
photographs re-pinned without a licence, with no reliable way to trace the owner
from the pin. Shipping one as the background of a commercial product is a real
infringement risk - hero and background images are exactly what stock agencies
pursue - so the same look was sourced from Unsplash instead, where the licence
grants commercial use outright.
