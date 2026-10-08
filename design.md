# PRAROHA --- UI Design System & Exact Visual Specification

## 1. Product Identity

**Product name:** PRAROHA\
**Tagline:** Seed → Universe\
**Design metaphor:** A small seed becomes a complete universe. Every
screen should feel like a calm, living garden where ideas are planted,
grown, revisited, and sometimes returned to the "graveyard."

The interface must feel: - Organic rather than technological - Premium
but not luxurious - Warm, calm, imaginative, and slightly mystical -
Editorial and handcrafted rather than generic SaaS - Soft, spacious,
tactile, and highly readable - Consistent across Home, My Creations,
Graveyard, and Profile

Avoid: - Neon colors - Pure white backgrounds - Heavy gradients -
Glassmorphism as the dominant style - Sharp rectangular cards -
Excessive drop shadows - Dark-mode styling - Generic blue/purple AI-app
aesthetics - Excessive animation

------------------------------------------------------------------------

# 2. Global Visual Language

## 2.1 Core Palette

Use the following palette as the source of truth.

  Token                Hex         Usage
  -------------------- ----------- ----------------------------------------
  `--cream-50`         `#F8F4E8`   Main page background
  `--cream-100`        `#F2EBDD`   Card interiors / subtle surfaces
  `--cream-200`        `#E8E0D0`   Borders and dividers
  `--cream-300`        `#D8CCB7`   Stronger borders / inactive separators
  `--sage-900`         `#294B3A`   Main heading and primary text
  `--sage-800`         `#355A46`   Primary buttons / active states
  `--sage-700`         `#466A55`   Icons and secondary emphasis
  `--sage-500`         `#718875`   Supporting text / decorative elements
  `--sage-200`         `#C8D0BE`   Soft sage surfaces
  `--sage-100`         `#DDE2D2`   Active navigation background
  `--terracotta-700`   `#A0522D`   Warm accent / Story / AI Magic
  `--terracotta-500`   `#B8734F`   Secondary warm accent
  `--terracotta-200`   `#E7C8B5`   Warm accent backgrounds
  `--plum-700`         `#6A4B67`   Sound / audio accent
  `--plum-200`         `#DCCDD8`   Sound card background
  `--gold-500`         `#C59A55`   Tiny decorative highlights
  `--gold-200`         `#E9DDBF`   Chat / warm secondary surface
  `--text-primary`     `#294B3A`   Headings
  `--text-body`        `#394840`   Normal text
  `--text-muted`       `#6D756F`   Metadata / helper text
  `--danger`           `#B85C46`   Delete / destructive actions
  `--danger-soft`      `#F1DDD5`   Delete button background

### Important color rule

The UI should look **cream first, sage second, terracotta third**.

Sage is the dominant interaction color. Terracotta is used as a
controlled emotional accent. Plum and gold are only used to distinguish
content types.

Do not make every icon a different color.

------------------------------------------------------------------------

# 3. Background

## 3.1 Base background

The entire application uses a warm parchment/ivory background:

``` css
background: #F8F4E8;
```

The background should never appear perfectly flat.

Add an extremely subtle paper texture: - Opacity: approximately 3--5% -
Very fine grain - No visible repeating pattern - No hard noise - No
strong vignette

Suggested implementation:

``` css
background-color: #F8F4E8;
background-image:
  radial-gradient(rgba(72, 67, 55, 0.025) 0.6px, transparent 0.6px);
background-size: 7px 7px;
```

Keep the texture subtle enough that users notice the warmth rather than
the noise.

## 3.2 Botanical decoration

Use hand-painted / softly illustrated dried leaves around the page
edges.

Placement: - Top-right corner - Bottom-left corner - Occasionally
bottom-right - Never behind important text or controls

Leaves should use muted terracotta / tan tones: - `#C38A66` -
`#D0A27F` - `#B98260`

Opacity: - 45--75%

The leaves should look like a botanical illustration printed onto paper,
not a glossy 3D asset.

------------------------------------------------------------------------

# 4. Typography

## 4.1 Headings

Use an elegant editorial serif.

Preferred: - `Cormorant Garamond` - fallback: `Georgia` - fallback:
serif

Characteristics: - High contrast - Calm - Slightly literary - Large
line-height - Dark sage color

Example:

``` css
font-family: "Cormorant Garamond", Georgia, serif;
color: #294B3A;
```

## 4.2 Body/UI text

Use a clean humanist sans-serif.

Preferred: - `Inter` - fallback: `system-ui`

Body text should be: - 15--17px - Medium/regular weight - Dark
gray-green rather than black

## 4.3 Logo

"PRAROHA": - Serif or refined display font - Uppercase - Letter spacing:
approximately `0.18em` - Dark sage - Centered beneath the leaf logo

Tagline: `Seed → Universe`

Use a smaller sans-serif or elegant serif.

------------------------------------------------------------------------

# 5. Layout System

## 5.1 Desktop frame

Design primarily for: - 1440 × 1024 - 1536 × 1024 - 1920 × 1080

Main application:

``` text
┌──────────────┬─────────────────────────────────────────┐
│              │                                         │
│   Sidebar    │              Main content               │
│              │                                         │
│              │                                         │
│              │                                         │
│              │                                         │
└──────────────┴─────────────────────────────────────────┘
```

## 5.2 Sidebar

Width: - 265--280px

Background: - Slightly warmer cream: `#F4EEDF`

Right divider: - `#D8CCB7` - 1px

Padding: - 22--30px

The sidebar should feel like a permanent wooden/paper spine rather than
a floating panel.

------------------------------------------------------------------------

# 6. Sidebar

## Brand area

Top: - PRAROHA leaf symbol - Small terracotta star/spark above leaf -
PRAROHA wordmark - `Seed → Universe`

Navigation order:

1.  Home
2.  My Creations
3.  Graveyard

Bottom: 4. Profile

### Navigation item

Height: - 54--58px

Border radius: - 16--18px

Icon: - 25--28px

Text: - 16--17px

Active state:

``` text
background: #DDE2D2
text: #294B3A
```

Inactive state:

``` text
background: transparent
text: #394840
```

Hover: - Slight sage tint - 150--200ms transition

------------------------------------------------------------------------

# 7. Cards

All major cards should have:

``` css
background: rgba(248, 244, 232, 0.72);
border: 1px solid #D8CCB7;
border-radius: 18px;
```

Shadow should be extremely soft:

``` css
box-shadow: 0 5px 20px rgba(67, 70, 56, 0.05);
```

Do not use: - Black shadows - Large elevation - Strong glass blur

Cards should appear almost like paper sheets resting on a desk.

------------------------------------------------------------------------

# 8. Borders

Use thin, low-contrast borders.

Primary: `#D8CCB7`

Secondary: `#E3DCCF`

Border width: - 1px

Avoid thick outlines.

------------------------------------------------------------------------

# 9. Buttons

## Primary

``` text
background: #355A46
text: #F8F4E8
```

Border radius: - 18--24px

Height: - 44--52px

Hover: - Darken slightly toward `#294B3A`

## Secondary

``` text
background: #F2EBDD
border: #D8CCB7
text: #355A46
```

## Destructive

``` text
background: #F1DDD5
text: #B85C46
border: transparent
```

Buttons should feel soft and pill-like.

------------------------------------------------------------------------

# 10. Iconography

Use simple outlined icons.

Recommended style: - 2px stroke - Rounded line caps - Rounded joins - No
filled emoji-style icons

Icon categories:

  Feature     Accent
  ----------- -----------------
  Seed        Sage
  Image       Sage
  Story       Terracotta
  Sound       Plum
  Video       Sage
  Chat        Gold/Terracotta
  AI Magic    Terracotta
  Graveyard   Plum
  Favorites   Sage
  Delete      Terracotta

Icons should never overpower text.

------------------------------------------------------------------------

# 11. HOME SCREEN

## Header statement

Display:

> Universes exist in a seed form,\
> autonomously unfolds with initial agency.\
> Forms hidden in formless.

Large serif typography: - 30--38px - Sage - Generous line-height

Center decorative separator: - horizontal lines - small PRAROHA leaf
symbol

## Seed input area

Large rounded input card.

Placeholder:

> Enter your seed... (text, image, sound or idea)

The seed icon appears at the left.

Right side: - circular sage submit button - white arrow

Input: - height around 72px - radius 36px

## Creation modes

Five equal cards:

1.  Image
2.  Story
3.  Sound
4.  Video
5.  Chat

Each card: - 145--160px wide - 130--140px high - 20px radius

Use very soft category backgrounds.

Image: `#DDE2D2`

Story: `#E8D5C4`

Sound: `#DCCDD8`

Video: `#DDE2D2`

Chat: `#E9DDBF`

## Recent Creations

Three-card horizontal row.

Each card contains: - Image/thumbnail - Content-type icon overlay -
Title - Type - Time - Three-dot menu

Thumbnail: - 16:9 - radius 12--14px - photographic / cinematic

------------------------------------------------------------------------

# 12. MY CREATIONS SCREEN

Purpose: Show everything the user has created.

## Header

Title: `My Creations`

Subtitle: `Everything your seeds have grown into.`

Top-right: - Search field - Sort dropdown

Search placeholder: `Search your creations...`

Sort default: `Recently created`

## Filter bar

Pills:

-   All
-   Image
-   Story
-   Sound
-   Video
-   Chat

Additional controls: - Favorites - Archived - Creation count

Active: - sage filled pill - cream text

Inactive: - cream background - thin border

## Gallery

Use a 3-column grid.

Card content: 1. Thumbnail 2. Content-type icon 3. Title 4. Type 5. Time
6. Three-dot menu

Example cards: - Mountain Sunset - Forest Vibes - Dreamscape - A Quiet
Morning - Nebula Garden - Rain on Leaves - The Last Seed - Hidden
Valley - Idea Bloom

Spacing: - 18--22px

Cards should remain visually consistent regardless of content type.

------------------------------------------------------------------------

# 13. GRAVEYARD SCREEN

The Graveyard is not a scary/dark page.

It represents ideas that were removed but can still be recovered.

## Header

Title: `Graveyard`

Use a subtle tombstone/seed icon.

Subtitle:

> Ideas that didn't make it, but still planted a part\
> of your imagination. Revisit, restore or let them rest.

Tone: - reflective - poetic - calm

Never use horror imagery.

## Controls

Top-right: - Search - Sort: Recently deleted

Filter pills: - All - Image - Story - Sound - Video - Chat

Right side: `Clear all`

Clear all should use a subtle trash icon.

## Deleted creation cards

Three-column grid.

Each card contains: - Thumbnail - Content icon - Title - Type - Deleted
date - Restore button - Delete permanently button

Example:

`Floating Islands` `Image · Deleted 2 days ago`

Buttons:

`Restore`

`Delete`

Restore: - sage

Permanent delete: - soft terracotta/red

## Graveyard interaction

Permanent deletion should require confirmation.

Confirmation copy:

> Let this seed return to the earth?

Buttons: - Keep it - Delete permanently

------------------------------------------------------------------------

# 14. PROFILE SCREEN

## Header

Title: `Profile`

Subtitle: `Manage your account, creations and preferences.`

Settings gear: - top-right - sage - outlined

## Profile identity card

Large horizontal card.

Contains: - Circular botanical avatar - User name - Username - Plan
badge - Short bio - Edit icon - Creation statistics

Example stats:

`24` Total Creations

`12` Favorites

`3` In Graveyard

## Profile tabs

-   My Creations
-   Favorites
-   Archived
-   Recently Deleted

Active: - sage filled

Inactive: - cream with border

## Your Creations

Use the same creation card system as My Creations.

This visual consistency is important.

## Account panel

Right-side card:

`Account`

Options:

-   Edit Profile
-   Change Password
-   Notification Settings
-   Help & Support
-   About Paroha

Each row: - Icon - Label - right arrow - subtle divider

Bottom: `Log Out`

Use soft danger styling.

------------------------------------------------------------------------

# 15. Imagery

Images should feel: - cinematic - natural - slightly dreamy - warm -
atmospheric

Preferred subjects: - forests - mountains - seeds - leaves - flowers -
valleys - sunlight - mist - dreamlike landscapes - tiny living details

Color grading: - warm highlights - muted shadows - slightly reduced
saturation - natural greens - golden sunlight

Avoid: - highly saturated AI-looking images - cyberpunk - neon - plastic
3D rendering - overly sharp HDR

------------------------------------------------------------------------

# 16. Texture & Material

The entire UI should subtly resemble: - handmade paper - botanical
journal - premium stationery - old field notebook

Texture characteristics: - fine paper grain - barely visible fibers -
soft tonal variation - no obvious repeating pattern

Cards can have a tiny amount of transparency, but readability always
wins.

------------------------------------------------------------------------

# 17. Radius System

Use these approximate values:

``` text
Small controls:       12px
Input fields:         22–36px
Cards:                18px
Large panels:         20–24px
Pills:                999px
Avatar:               50%
```

Avoid sharp 0--4px corners.

------------------------------------------------------------------------

# 18. Spacing System

Base unit: `4px`

Common spacing:

``` text
4px   micro
8px   compact
12px  small
16px  normal
20px  card gap
24px  section gap
32px  large gap
40px  page section
48px  major separation
64px  hero spacing
```

The interface should breathe.

------------------------------------------------------------------------

# 19. Shadows

Use extremely soft shadows.

Default:

``` css
box-shadow:
  0 4px 18px rgba(60, 64, 51, 0.045);
```

Hover:

``` css
box-shadow:
  0 8px 24px rgba(60, 64, 51, 0.07);
```

Never use:

``` text
0 10px 40px rgba(0,0,0,0.3)
```

The product should never look like floating glass cards.

------------------------------------------------------------------------

# 20. Motion & Interaction

Animation should feel like a seed slowly unfolding.

## Standard transitions

``` css
transition: all 180ms ease;
```

## Hover

Cards: - translateY(-2px) - slightly stronger shadow

Buttons: - translateY(-1px)

Icons: - subtle scale 1.03--1.05

## Page transitions

Use: - opacity - small vertical movement - 200--300ms

Avoid: - bouncing - elastic animations - excessive parallax

## Special "seed" interaction

When generating a new universe: 1. Seed icon gently pulses. 2. Input
glow increases slightly. 3. Small leaf particles can appear. 4. Content
grows outward from the seed. 5. Final creation settles into the standard
card.

This should feel organic, not magical in a flashy way.

------------------------------------------------------------------------

# 21. Accessibility

Minimum requirements:

-   Body text contrast should be readable against cream.
-   Do not rely on color alone to communicate content type.
-   Every icon button needs an accessible label.
-   Keyboard focus must be visible.
-   Focus ring:
    -   sage
    -   2px
    -   offset 2px
-   Touch targets: minimum 44×44px.

------------------------------------------------------------------------

# 22. Responsive Behavior

## Desktop

Sidebar remains visible.

Creation grid: - 3 columns

## Tablet

Sidebar: - narrower - labels may collapse

Grid: - 2 columns

## Mobile

Sidebar becomes bottom navigation or collapsible drawer.

Grid: - 1 column

Profile: - account panel moves below profile content

Home creation mode cards: - horizontal scrolling row or 2-column grid

Do not shrink desktop layouts until text becomes unreadable.

------------------------------------------------------------------------

# 23. Content-Type Visual Language

Every creation type needs a recognizable but subtle visual identity.

### Image

Icon: outlined landscape\
Accent: sage

### Story

Icon: document/page\
Accent: terracotta

### Sound

Icon: waveform\
Accent: plum

### Video

Icon: play\
Accent: sage

### Chat

Icon: speech bubble\
Accent: warm gold/terracotta

The card layout remains identical; only the icon/accent changes.

------------------------------------------------------------------------

# 24. Empty States

Empty states should remain poetic.

## My Creations empty state

Title:

`Your garden is waiting.`

Subtitle:

`Plant your first seed and watch an idea become a universe.`

CTA:

`Plant a seed`

Visual: - small seed/leaf illustration

## Graveyard empty state

Title:

`Nothing rests here yet.`

Subtitle:

`Every seed deserves a chance to grow.`

No dark imagery.

------------------------------------------------------------------------

# 25. Microcopy Style

Writing should be: - short - poetic - human - warm - slightly mysterious

Good: - `Plant a seed` - `Let it grow` -
`Your universe is taking shape` - `Return to the garden` -
`Ideas that still remember you` - `Nothing is truly lost`

Avoid: - `Generate Now` - `AI Output` - `Process Complete` -
`Delete Item` - `Data Repository`

The product should feel like a creative world, not an admin dashboard.

------------------------------------------------------------------------

# 26. AI-Specific UI

AI controls should not dominate the visual hierarchy.

For AI Magic: - terracotta spark icon - subtle terracotta background -
small label

Suggested state:

`AI Magic ✓`

When enabled: - soft terracotta outline - subtle warm glow - no neon
effect

The AI should feel like a tool inside the creative ecosystem, not the
identity of the entire product.

------------------------------------------------------------------------

# 27. Design Principles for Antigravity Implementation

When generating the UI, Antigravity should follow these rules in
priority order:

1.  **Preserve the warm botanical identity.**
2.  **Use cream as the dominant background.**
3.  **Use dark sage as the dominant text/interaction color.**
4.  **Use terracotta only as an accent.**
5.  **Use thin borders and very soft shadows.**
6.  **Use editorial serif headings + clean sans-serif UI text.**
7.  **Use rounded cards and pill controls.**
8.  **Use botanical corner illustrations sparingly.**
9.  **Keep generous whitespace.**
10. **Keep all screens visually related.**
11. **Do not introduce generic AI-dashboard styling.**
12. **Do not introduce neon, blue/purple gradients, or dark cyber
    aesthetics.**
13. **Keep imagery cinematic, natural, warm, and slightly dreamlike.**
14. **Use the same component language across Home, My Creations,
    Graveyard, and Profile.**
15. **The interface should feel like a living botanical journal for
    ideas.**

------------------------------------------------------------------------

# 28. Component Consistency Checklist

Before considering a screen complete, verify:

-   [ ] Background is warm cream.
-   [ ] Paper texture is subtle.
-   [ ] Botanical decorations are present but not distracting.
-   [ ] Sidebar matches the global system.
-   [ ] Active navigation uses sage.
-   [ ] Headings use elegant serif typography.
-   [ ] Body/UI text uses clean sans-serif typography.
-   [ ] Cards have 18--24px radius.
-   [ ] Borders are thin and muted.
-   [ ] Shadows are soft.
-   [ ] Primary buttons use sage.
-   [ ] Destructive actions use muted terracotta.
-   [ ] Content-type icons use the correct accent.
-   [ ] Image thumbnails have rounded corners.
-   [ ] Spacing is generous.
-   [ ] No neon colors.
-   [ ] No harsh black.
-   [ ] No excessive gradients.
-   [ ] No excessive glassmorphism.
-   [ ] No unnecessary visual noise.

------------------------------------------------------------------------

# 29. Final Art Direction

The final result should look like:

**"A premium botanical creative journal where every idea is planted as a
seed and grows into a universe."**

The UI should communicate three emotions immediately:

**Calm → Curiosity → Creation**

It should feel handcrafted, warm, intelligent, imaginative, and alive.

The user should never feel that they are operating a generic AI tool.

They should feel that they are **cultivating ideas.**
