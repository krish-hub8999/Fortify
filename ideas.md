# Password Strength Extension — Design Directions

## Three stylistic approaches

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| Field Manual | A warm, editorial security workspace that makes password hygiene feel understandable rather than intimidating. Dense but breathable information layers resemble a well-designed technical field notebook. | 0.07 |
| Signal Console | A compact, high-contrast control room that treats password analysis as a real-time security signal. Live indicators and calibrated typographic scale make every result instantly legible. | 0.04 |
| Quiet Vault | A refined, library-inspired utility with vellum surfaces, deep ink typography, and quiet confidence. It encourages thoughtful password decisions without alarmist visual language. | 0.09 |

## Chosen approach: Field Manual

### Design Movement

**Editorial data design with field-notebook utility.** The popup is an instrument panel, not a landing page: structured information, purposeful labels, and a subtle paper-and-ink tactility make cybersecurity concepts feel concrete and non-technical.

### Core Principles

1. **Clarity before drama:** The strength verdict and time estimate must be readable in one glance.
2. **Explain every signal:** Scores are accompanied by compact, plain-language reasons, never unexplained gauges.
3. **Security through restraint:** The interface makes no network request, never persists the entered password, and communicates this visibly.
4. **Purposeful density:** A compact extension popup can still reveal progressively deeper detail through clearly separated evidence rows.

### Color Philosophy

The canvas uses warm parchment and graphite to avoid the generic cold-blue “security dashboard” look. A distinct **Signal Vermilion** is reserved for danger and weak-password feedback; olive-green marks durable choices; sunlit ochre marks improvement opportunities. These pigments behave like ink annotations in a field manual, so feedback is precise rather than alarming.

### Layout Paradigm

The popup is built as a vertical **assessment sheet**: a slim masthead, an input instrument, an asymmetric result band, and stacked diagnostic slips. The strength meter runs laterally like a specimen label while the crack-time figure becomes the visual anchor. It does not use a conventional centered-card dashboard.

### Signature Elements

1. **Calibration rail:** a segmented horizontal strip with a moving strength marker.
2. **Margin annotations:** small monospaced labels, ticks, and method notes that make outcomes auditable.
3. **Diagnostic slips:** alternating, slightly offset analysis rows that resemble field notes clipped into a report.

### Interaction Philosophy

Interactions are immediate, quiet, and inspectable. Typing updates analysis locally; the reveal control requires deliberate press; generated password actions offer explicit copy confirmation. Buttons use physical press feedback and no hidden automation.

### Animation

The calibration marker shifts in 180 ms with a crisp ease-out, while diagnosis rows fade and rise by 4 px in staggered 45 ms steps. The generator panel enters through opacity and a small translate only. All nonessential motion is disabled for reduced-motion preferences; there are no looping or attention-seeking effects.

### Typography System

**DM Mono** handles labels, estimate assumptions, password metadata, and generated passwords. **Fraunces** carries the compact editorial masthead and strength verdict. **Manrope** supports body copy and controls. Headers use strong contrast in weight and scale; supporting explanations remain 13–14 px for popup density.

### Brand Essence

**A private field guide for building passwords that hold up under real-world guessing, designed for people who want practical explanations rather than vague scores.**

Personality: **measured, lucid, protective.**

### Brand Voice

Headlines are direct and observational, while CTAs state exactly what they will do. Microcopy is calm and never shaming.

> “This pattern is easy to predict.”

> “Generate a longer, memorable alternative.”

### Wordmark & Logo

The wordmark pairs a small calibrated-shield glyph with a high-contrast serif name, **Fortify Field Notes**. The mark is a bold, textless shield made from three stepped calibration bars, implying both protection and incremental improvement.

### Signature Brand Color

**Signal Vermilion — `#D74C35`**. It is used only for security-critical weakness, high-visibility actions, and the calibration marker.

---

## Cyan Refresh — Three visual directions

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| Aqua Observatory | A bright, restorative cyan workspace that frames password analysis as a calm measurement task beneath an atmospheric, ocean-blue sky. | 0.10 |
| Lagoon Ledger | A soft white-and-mist interface with cyan data marks, sea-glass panels, and a highly legible dark-navy reading surface. | 0.16 |
| Arctic Signal | A crisp cyan-to-indigo security instrument with high-contrast calibration rails and cool, non-glary backgrounds. | 0.07 |

## Chosen refresh: Lagoon Ledger

### Design Movement

**Biophilic data utility.** The field-manual structure remains, but harsh parchment and vermilion are replaced with tranquil sea-glass layers, bright cyan signal ink, and deep navy typography. The system should feel fresh and spacious during long reading sessions rather than like an alarm console.

### Eye-Comfort Palette

The page uses **Lagoon Cyan `#14B8C4`** as the active signal color, **Deep Tide `#0F2940`** for high-legibility text, **Mist `#F2FBFC`** for the canvas, and **Sea Glass `#DDF4F5`** for quiet surfaces. Coral is reserved only for true weak-password warnings; cyan is never used for long body text on white.

### Icon Treatment

The new mark is a textless **cyan lens-shield**: a rounded shield with a centered, bright cyan aperture and three subtle wave-like calibration ridges. It needs a simple silhouette and a generous clear area so it reads cleanly at 16–40 pixels without visual strain.

### Layout Adjustment

The calibration rail becomes the dominant line of sight, featuring cool-cyan ticks, a dark marker, and low-glare neutral segments. The recommendation region becomes a sea-glass diagnostic inset rather than a heavy full-width black band. Supporting panels are subtly layered white cards with cyan edge rules.

### Interaction Tone

Hover, selection, and focus feedback should use a pale cyan halo rather than dark shadows. Motion remains under 200 ms and all controls maintain high text contrast and visible keyboard focus.

### Dimensional Motion Layer

The refreshed interface uses **calm physical depth**, not spectacle. The lens-shield floats on a soft cyan aura with a slow 3D yaw; glass panels rise by 2–4 pixels on hover with a shallow perspective tilt; active model selections settle into a slightly raised sea-glass plane. The calibration marker glides across a recessed rail and the result band gains a gently shifted highlight after each assessment update.

All depth comes from transforms, opacity, layered shadows, and restrained gradients. Motion stays below 420 ms for occasional transitions and below 200 ms for direct controls. Reduced-motion users receive the same hierarchy without positional movement or looping animation.

### Living Motion Choreography

The interface should feel **gently awake**, not artificially busy. Cyan aurora layers drift at slightly different speeds behind the sheet, while the lens-shield catches a slow moving highlight and settles back after each interaction. When a password is entered, the result band resolves with a brief glow, the calibration rail fills in sequence, and diagnostic slips arrive as a small cascading set of evidence cards.

Direct actions receive a clear physical response: controls compress before returning to rest, generated-password panels reveal with a soft unfold, and completed copies receive a short confirmation shimmer. These effects use transform and opacity only, remain reversible on interruption, and are completely still when `prefers-reduced-motion` is enabled.
