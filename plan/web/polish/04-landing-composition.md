# 04 - Landing page composition

**Serves:** definition of done 6
**Blocked by:** `01-content-truth.md`
**Reference:** `gurukulhq/apps/web/components/(landingpage)/`

## Today's order

```
Hero -> Studio -> Features -> AI Tools -> Projects -> Assessments
     -> Credits -> Testimonials -> Pricing -> FAQs -> Footer
```

Two problems, independent of styling.

**One section is about to be deleted.** Studio (see `01-content-truth.md`).

**Four sections make the same argument.** Features, AI Tools, Projects and
Assessments are all "here are things the product does". A reader gets four
consecutive feature lists and no narrative between them. Nothing in that sequence
answers *why this instead of the free alternative*, which is the actual question a
student arrives with.

## The proposed order

```
Hero            the promise
Problem         what is broken about how people prepare today
Features        what the product does about it  (one section, not four)
Proof           the container demo - the thing competitors cannot show
Projects        the concrete output a user walks away with
Compare         why this and not LeetCode / a course
Pricing         the ask
FAQs            the objections
Footer
```

The change in kind: the current page is a catalogue, the proposed page is an
argument. Every section earns its place by answering the question the previous one
raises.

## Port candidates, assessed

Each was read before being judged. **Do not port the whole directory** - most of
gurukul's sections argue for school software.

| component | lines | verdict | reasoning |
|---|---|---|---|
| `problem-scroll.tsx` | 288 | **PORT** | The missing section. Sets up the problem before the product answers it, which is exactly the narrative gap above. Structure ports cleanly; content is entirely rewritten |
| `faq-section.tsx` | 164 | **PORT** | Small, self-contained, and the current `faqs.tsx` can adopt its structure. Check whether it emits `FAQPage` JSON-LD - if so that is an SEO win the current one may lack |
| `reveal.tsx` | 57 | **PORT** | Scroll-reveal without a motion library on every section. See `06-performance.md` |
| `lazy-mount.tsx` | 57 | **PORT** | Defers below-fold sections. The single highest-leverage perf component in the reference |
| `feature-stack.tsx` | 360 | **CONSIDER** | Good pattern for replacing four feature sections with one. Port only if the content audit lands on a stack rather than a grid |
| `before-after.tsx` | 1002 | **NO** | Enormous, and its argument is "your school before and after Gurukul". A student's before/after is not a comparable narrative and 1000 lines is a lot of surface to maintain for a maybe |
| `features-showcase.tsx` | 555 | **NO** | Overlaps `feature-stack`. Pick one; this is the heavier |
| `integrations.tsx` | 385 | **NO** | This product integrates with nothing worth a logo wall yet. A wall of grey placeholders is worse than no section |
| `world-map.tsx`, `schools-map.tsx`, `impact-stats.tsx` | - | **NO** | Geography and institutional scale. Not this product's story, and see the sourcing rule for any stat |
| `role-features.tsx`, `school-method.tsx` | - | **NO** | Personas and methodology specific to schools |
| `testimonials.tsx` | - | **BLOCKED** | Port only after the sourcing question in `01-content-truth.md` is resolved. Do not port a testimonial component while the testimonials are unverified |
| `video-background.tsx` | - | **NO** | A video background is a large asset on the page whose load time matters most |

## The section this product has and gurukul does not

**The container demo.** `apps/shipitworker` runs user code in a real Linux
container with node, python, gcc, g++ and a JDK. That is a genuine technical
differentiator over every "watch a video then answer a quiz" competitor, and the
landing page currently mentions it in a single line inside a feature list
("cloud-based sandboxes").

It deserves its own section: paste code, press run, see real output. If it can be
made interactive against a rate-limited public endpoint, it is the strongest thing
on the page. If not, a recorded terminal is still better than a bullet point.

This is a **build**, not a port - the reference has nothing like it. It is scoped
as its own task (`WEB-34`) and is explicitly optional, because it is the one item
here that could absorb a week on its own.

## Tasks

See `tasks.md` `WEB-30` through `WEB-36`.

## Verification

- The page reads top to bottom as one argument. Test: give a stranger the page and
  ask what the product does and who it is for. If they cannot answer both, the
  composition has not worked.
- No two sections make the same argument.
- Every section survives the `01-content-truth.md` audit.
- Below-fold sections are lazily mounted (`06-performance.md`).
