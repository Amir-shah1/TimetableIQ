# TimetableIQ — Design Specification
> This document defines the complete visual design, layout, component behavior, and UI rules
> for the TimetableIQ web application.
> It is written for an AI agent to use as the single source of truth when building the UI.
> No backend or functional logic is defined here — only how things look, feel, and behave visually.

---

## 1. Design Intent

TimetableIQ must feel like a natural, clean extension of the CUIATD university portal.
Students already know the university's visual language — this app must not feel foreign to them.
The design stays close to the existing portal style: white surfaces, tight borders, Helvetica type,
and a restrained color palette — with just enough modern structure to make it usable on mobile.

---

## 2. Design Tokens

All components must use these tokens. Never use raw hex values directly in component styles.

### 2.1 Color Tokens

```
/* Text */
color.text.primary      = #555555   /* All body text, labels, table content */
color.text.secondary    = #888888   /* Subtext, placeholders, helper text */
color.text.tertiary     = #ffffff   /* Text on dark backgrounds (nav, header) */
color.text.inverse      = #cccccc   /* Dimmed text on dark backgrounds */
color.text.link         = #0000ff   /* Instructor names, clickable links — matches portal */
color.text.warning      = #cc0000   /* Clash indicators, error states, special class notes */

/* Surfaces */
color.surface.base      = #000000   /* Top navigation bar background */
color.surface.page      = #ffffff   /* Main page background */
color.surface.muted     = #f0f0f0   /* Alternate table rows, inactive tab backgrounds */
color.surface.raised    = #f7f7f7   /* Card backgrounds, input backgrounds */
color.surface.overlay   = #e8e8e8   /* Hover states on table rows */

/* Borders */
color.border.strong     = #555555   /* Table outer borders, nav borders */
color.border.muted      = #dddddd   /* Table inner cell borders, input borders */
color.border.focus      = #0000ff   /* Focus ring on all interactive elements */

/* Status */
color.status.clash      = #cc0000   /* Clash detected — text and border */
color.status.free       = #006600   /* Free room indicator */
color.status.occupied   = #cc0000   /* Occupied room indicator */
color.status.nodata     = #888888   /* Empty state, no results */
```

### 2.2 Typography Tokens

```
font.family.primary     = Helvetica
font.family.stack       = Helvetica, Arial, sans-serif

font.size.xs            = 10.2px    /* Footer, metadata, tiny labels */
font.size.sm            = 11px      /* Default body, table cell content */
font.size.md            = 12px      /* Input labels, card body text */
font.size.lg            = 13.33px   /* Section headings, card titles */
font.size.xl            = 14px      /* Page-level subheadings */
font.size.2xl           = 17px      /* Feature headings (e.g. "Clash Detector") */
font.size.3xl           = 31px      /* Rarely used — reserved for hero text if needed */

font.weight.base        = 400       /* Normal text */
font.weight.medium      = 600       /* Labels, table headers, nav items */
font.weight.bold        = 700       /* Headings, active state labels */

font.lineHeight.base    = 1.4       /* Body text line height */
font.lineHeight.tight   = 1.1       /* Table cells, compact rows */
```

### 2.3 Spacing Tokens

```
space.1   = 5px     /* Tight internal padding (table cells, tags) */
space.2   = 10px    /* Standard padding (inputs, buttons, cards) */
space.3   = 12px    /* Section internal padding */
space.4   = 15px    /* Component separation */
space.5   = 40px    /* Section-level separation */
```

### 2.4 Border & Radius Tokens

```
radius.none   = 0px     /* Tables, nav bar — no rounding, matches portal */
radius.xs     = 6px     /* Buttons, inputs, tags, cards */
radius.sm     = 4px     /* Small badges, status chips */

border.width.default  = 1px
border.width.table    = 1px
border.style.default  = solid
```

### 2.5 Shadow Tokens

```
shadow.none     = none
shadow.card     = 0 1px 3px rgba(0,0,0,0.10)
shadow.dropdown = 0 2px 8px rgba(0,0,0,0.15)
```

---

## 3. Global Layout

### 3.1 Page Structure

Every page must have this structure top to bottom:

```
[ Top Navigation Bar ]        — fixed, full width, black background
[ Feature Content Area ]      — scrollable, white background, full width
[ Footer ]                    — minimal, single line
```

There is no sidebar. No drawer. No split panel. The layout is single-column on mobile, full-width on desktop.

### 3.2 Content Container

- Maximum content width: `960px`
- Content must be horizontally centered inside the viewport.
- Left and right padding on mobile: `space.3` (12px)
- Left and right padding on desktop: `space.5` (40px)

### 3.3 Responsive Breakpoints

```
mobile    = < 640px
tablet    = 640px – 1024px
desktop   = > 1024px
```

All components must be tested and specified at all three breakpoints.

---

## 4. Top Navigation Bar

### 4.1 Anatomy

```
[ Logo / App Name ]  [ Nav Item ] [ Nav Item ] [ Nav Item ] [ Nav Item ] [ Nav Item ] [ Nav Item ]
```

- Background: `color.surface.base` (#000000)
- Height: `44px` on desktop, `auto` on mobile (wraps to two lines if needed)
- Logo/App Name text: "TimetableIQ" — `font.size.xl`, `font.weight.bold`, `color.text.tertiary`
- Nav items: 6 items — Clash Detector, Timetable Builder, Teacher Timetable, Free Room Finder, Section Comparison, Teacher Directory

### 4.2 Nav Item States

```
default       — color.text.inverse (#cccccc), font.size.sm, font.weight.medium, no underline
hover         — color.text.tertiary (#ffffff), underline
active        — color.text.tertiary (#ffffff), font.weight.bold, bottom border 2px solid #ffffff
focus-visible — outline: 2px solid color.border.focus, outline-offset: 2px
```

### 4.3 Mobile Navigation

- On mobile (< 640px), the nav items collapse into a hamburger menu button.
- Hamburger button: top-right corner, white icon, black background.
- When opened, nav items stack vertically in a full-width dropdown below the bar.
- Each mobile nav item: `padding: space.3 space.4`, full width, `color.text.tertiary`, `border-bottom: 1px solid #333333`
- Active item on mobile: `background: #222222`

---

## 5. Timetable Grid Component

This is the most important visual component. It appears in: Timetable Builder, Teacher Timetable View, and is referenced visually in Clash Detector results.

### 5.1 Design Reference

The grid must closely match the existing CUIATD timetable shown on the portal:
- White background
- Black outer border
- 1px `color.border.muted` borders between all cells
- No rounded corners on the table itself (`radius.none`)
- Alternating row backgrounds: odd rows `color.surface.page` (#ffffff), even rows `color.surface.muted` (#f0f0f0)
- Column headers (time slots): `font.weight.bold`, `font.size.sm`, `color.text.primary`, centered, `background: color.surface.muted`
- Row headers (days): `font.weight.bold`, `font.size.sm`, `color.text.primary`, left-aligned

### 5.2 Cell Content

Each populated cell must show in this order, top to bottom:
1. Course name — `font.size.sm`, `font.weight.medium`, `color.text.primary`
2. Room — `font.size.sm`, `font.weight.base`, `color.text.primary`
3. Instructor name — `font.size.sm`, `color.text.link` (#0000ff), appears as a clickable link

Empty cells: no content, no background change from the row's alternating color.

### 5.3 Clash State in Timetable

When a cell contains a clashing course:
- Cell background: `#fff0f0` (light red tint)
- Border: `1px solid color.status.clash`
- A small red label "CLASH" appears above the course name in `color.status.clash`, `font.size.xs`, `font.weight.bold`

### 5.4 Responsive Behavior

- On desktop: full table, all columns visible, horizontal scroll if needed
- On tablet: horizontal scroll enabled, table does not collapse
- On mobile: the table scrolls horizontally inside a scroll container. The Day column (first column) must be **sticky** (position: sticky, left: 0) so students always know which row they're reading.
- Mobile cell minimum width: `120px`
- Day column width: `80px` fixed

---

## 6. Component Library

### 6.1 Buttons

**Primary Button** (main actions: Export PDF, Export Image, Check Clashes)
```
background     : color.surface.base (#000000)
text           : color.text.tertiary (#ffffff)
font           : font.size.md, font.weight.medium
padding        : space.1 space.3 (5px 12px)
border-radius  : radius.xs (6px)
border         : 1px solid color.border.strong

hover          : background #333333
active         : background #555555
focus-visible  : outline 2px solid color.border.focus, outline-offset 2px
disabled       : background color.surface.muted, text color.text.secondary, cursor not-allowed
```

**Secondary Button** (cancel, reset, clear selection)
```
background     : color.surface.page (#ffffff)
text           : color.text.primary (#555555)
font           : font.size.md, font.weight.medium
padding        : space.1 space.3
border-radius  : radius.xs
border         : 1px solid color.border.muted

hover          : background color.surface.muted
active         : background color.surface.overlay
focus-visible  : outline 2px solid color.border.focus, outline-offset 2px
disabled       : text color.text.secondary, cursor not-allowed
```

**Destructive / Warning Button** (clear all, remove)
```
Same as Secondary but:
text           : color.status.clash (#cc0000)
border         : 1px solid color.status.clash
hover          : background #fff0f0
```

### 6.2 Inputs and Dropdowns

**Text Input** (search fields)
```
background     : color.surface.raised (#f7f7f7)
text           : color.text.primary
font           : font.size.md
padding        : space.2 (10px)
border         : 1px solid color.border.muted
border-radius  : radius.xs

placeholder    : color.text.secondary
hover          : border-color color.border.strong
focus-visible  : border-color color.border.focus, outline none, box-shadow 0 0 0 2px rgba(0,0,255,0.15)
error          : border-color color.status.clash
disabled       : background color.surface.muted, color color.text.secondary
```

**Dropdown / Select**
```
Same visual rules as Text Input.
The dropdown list panel:
  background     : color.surface.page (#ffffff)
  border         : 1px solid color.border.muted
  box-shadow     : shadow.dropdown
  border-radius  : radius.xs
  max-height     : 240px, overflow-y scroll

Each option:
  padding        : space.2 space.3
  font           : font.size.md, color.text.primary
  hover          : background color.surface.muted
  selected       : background color.surface.muted, font.weight.medium
  focus-visible  : outline 2px solid color.border.focus inset
```

**Time Input** (Free Room Finder day/time selectors)
```
Same as Text Input.
Display as <select> dropdowns populated from data, not free-text inputs.
Show times in HH:MM 24-hour format (e.g. 08:00, 09:30, 11:00).
```

### 6.3 Checkboxes (Course Selection Lists)

```
Size           : 14px × 14px
Border         : 1px solid color.border.strong
Border-radius  : radius.sm (4px)
Background     : color.surface.page

checked        : background color.surface.base (#000000), white checkmark icon
hover          : border-color color.text.primary
focus-visible  : outline 2px solid color.border.focus, outline-offset 2px
disabled       : background color.surface.muted, border color.border.muted
```

Label text next to checkbox: `font.size.md`, `color.text.primary`, cursor pointer, `padding-left: space.2`

### 6.4 Cards

Used for: teacher directory cards, result summary cards.

```
background     : color.surface.raised (#f7f7f7)
border         : 1px solid color.border.muted
border-radius  : radius.xs (6px)
padding        : space.3 space.4 (12px 15px)
box-shadow     : shadow.card

Card title     : font.size.lg, font.weight.bold, color.text.primary
Card subtitle  : font.size.md, color.text.secondary
Card body      : font.size.sm, color.text.primary, line-height font.lineHeight.base
Card link      : color.text.link, font.size.sm
```

Cards must not have hover effects unless they are clickable. If a card is clickable, add:
```
hover          : box-shadow shadow.dropdown, border-color color.border.strong, cursor pointer
```

### 6.5 Tags / Badges

Used for: department labels (CS / SE), status chips (Free / Occupied / Clash).

```
padding        : space.1 space.2 (5px 10px)
border-radius  : radius.sm (4px)
font           : font.size.xs, font.weight.medium

CS department  : background #e8f0ff, text #0000cc, border 1px solid #aabbff
SE department  : background #fff0e8, text #884400, border 1px solid #ffccaa
Free           : background #e8ffe8, text color.status.free, border 1px solid #aaddaa
Occupied       : background #fff0f0, text color.status.occupied, border 1px solid #ffaaaa
Clash          : background #fff0f0, text color.status.clash, border 1px solid color.status.clash
```

### 6.6 Tables (List Tables)

Used for: course selection lists, section comparison, room result lists.

```
width          : 100%
border-collapse: collapse
border         : 1px solid color.border.strong

Header row     : background color.surface.muted, font.weight.bold, font.size.sm, color.text.primary
                 padding: space.2 space.3, text-align left
                 border-bottom: 2px solid color.border.strong

Data row       : background color.surface.page (odd), color.surface.muted (even)
                 padding: space.2 space.3, font.size.sm, color.text.primary
                 border-bottom: 1px solid color.border.muted

Row hover      : background color.surface.overlay (#e8e8e8)

Selected row   : background #e8f0ff, border-left 3px solid #0000ff
```

On mobile, list tables must scroll horizontally inside a container. Do not collapse columns or hide data.

---

## 7. Feature-Specific UI Layout

### 7.1 Clash Detector

**Layout (desktop):**
```
[ Department Filter (All / CS / SE) — radio buttons or tab strip ]
[ Course Selection Table ]
    — columns: checkbox | Course | Section | Instructor | Day | Time | Room
    — full width, scrollable
[ Clash Results Panel ]
    — appears below the table once 2+ courses are selected
    — if no clash: green text "No clashes detected among selected courses."
    — if clash: red bordered box listing each clashing pair
```

**Clash Result Item:**
```
border-left    : 4px solid color.status.clash
background     : #fff0f0
padding        : space.3
margin-bottom  : space.2
font           : font.size.md, color.text.primary

Format: "[Course A] (Section X) clashes with [Course B] (Section Y) on [Day] — [TimeA] overlaps with [TimeB]"
"clashes with" text in color.status.clash, font.weight.bold
```

**Layout (mobile):**
- Department filter becomes a full-width `<select>` dropdown.
- Course table scrolls horizontally.
- Clash results panel stacks below, full width.

### 7.2 Personal Timetable Builder

**Layout:**
```
[ Department Filter ]
[ Course Selection Table ]  — same as Clash Detector
[ "Build Timetable" button ]  — primary button, disabled until at least 1 course selected
[ Generated Timetable Grid ]  — appears below after courses are selected
[ Export Row: "Export as PDF" button | "Save as Image" button ]
```

- The timetable grid follows all rules from Section 5.
- Export buttons are `secondary` style, placed side by side, right-aligned on desktop, full-width stacked on mobile.
- If a clash exists in selected courses, show a warning banner above the grid:
  ```
  background     : #fff0f0
  border         : 1px solid color.status.clash
  padding        : space.3
  text           : color.status.clash, font.size.md
  Content        : "Warning: Your selection contains clashing courses. Conflicts are highlighted in red."
  ```

### 7.3 Teacher Timetable View

**Layout:**
```
[ Search / Select Teacher — searchable dropdown, full width ]
[ Teacher Info Bar ]           — shown once teacher is selected
[ Teacher Timetable Grid ]     — full timetable for that teacher
```

**Teacher Info Bar:**
```
background     : color.surface.raised
border         : 1px solid color.border.muted
border-radius  : radius.xs
padding        : space.3 space.4
margin-bottom  : space.4
display        : flex, wrap on mobile

Fields shown   : Name (font.weight.bold), Email (color.text.link), Office Room, Office Hours
Each field     : label in color.text.secondary, value in color.text.primary
```

If no teacher is selected, show an empty state:
```
text-align     : center
padding        : space.5
font           : font.size.lg, color.text.secondary
Content        : "Search for a teacher to view their timetable."
```

### 7.4 Free Room Finder

**Layout:**
```
[ Filter Row: Day dropdown | Start Time dropdown | End Time dropdown ]
[ Results: two columns side by side on desktop, stacked on mobile ]
    Left column  : "Free Rooms" — green header
    Right column : "Occupied Rooms" — red header
```

**Filter Row:**
- Day dropdown: full list of days from data.
- Start Time / End Time: dropdowns showing all time slots from data, in 24hr format.
- All three must be selected before results are shown.
- If Start Time >= End Time, show inline validation: `color.status.clash`, `font.size.sm`, below the End Time field: "End time must be after start time."

**Free Rooms Column:**
```
Header         : "Free Rooms", font.size.lg, font.weight.bold, color.status.free
Each room      : one row in a list table, single column "Room"
                 left border 3px solid color.status.free
Empty state    : "No free rooms found for this slot." in color.text.secondary
```

**Occupied Rooms Column:**
```
Header         : "Occupied Rooms", font.size.lg, font.weight.bold, color.status.occupied
Each room      : one row showing — Room | Course | Section | Instructor | Time
                 left border 3px solid color.status.occupied
Empty state    : "All rooms are free during this slot." in color.status.free
```

### 7.5 Section Comparison

**Layout:**
```
[ Course Name dropdown — full width ]
[ Section Selector — shown after course is selected ]
    — list of available sections with radio buttons or checkboxes
    — max two selectable; third selection replaces the second
[ Comparison Table — shown when exactly 2 sections are selected ]
```

**Comparison Table:**
```
Two-column layout inside a bordered table.
First column   : Field label (Section, Instructor, Day, Time, Room, Email, Office Hours)
Second column  : Value for Section A
Third column   : Value for Section B

Column headers : Section A name and Section B name, font.weight.bold
Label column   : color.text.secondary, font.size.sm, font.weight.medium
Value cells    : color.text.primary, font.size.sm

If a field differs between sections: highlight the row with background color.surface.muted
Email fields   : render as color.text.link
```

If only one section is available, show:
```
padding        : space.4
font           : font.size.md, color.text.secondary
Content        : "Only one section is available for this course. No comparison possible."
```

### 7.6 Teacher Directory

**Layout:**
```
[ Search Input — full width, placeholder "Search by teacher name..." ]
[ Results Grid — 1 column on mobile, 2 columns on tablet, 3 columns on desktop ]
```

**Teacher Card:**
```
Follows Section 6.4 card rules.

Card header    : Teacher name, font.size.lg, font.weight.bold, color.text.primary
Sub-row 1      : Email — color.text.link, font.size.sm
Sub-row 2      : Office Room — label "Office:" color.text.secondary, value color.text.primary
Sub-row 3      : Office Hours — label "Hours:" color.text.secondary, value color.text.primary
Divider        : 1px solid color.border.muted, margin space.2 0

Courses section: heading "Courses Taught", font.size.sm, font.weight.medium, color.text.secondary
Each course    : font.size.sm, color.text.primary
               : Format — "Course Name — Section — Day HH:MM–HH:MM"
```

Empty state (no results):
```
text-align     : center
padding        : space.5
font           : font.size.lg, color.text.secondary
Content        : "No teacher found matching your search."
```

Empty state (search not yet entered, but default is show all teachers):
Show all teacher cards sorted alphabetically.

---

## 8. Navigation Active State and Page Transitions

- The active nav item must always reflect the currently visible feature.
- On navigation, the old content fades out and new content appears. Transition duration: `150ms`, `ease-in-out`. This is subtle — not dramatic.
- No loading spinners needed (data is in-memory). If a computation takes time, show a brief inline text "Calculating..." in `color.text.secondary` where the result will appear.

---

## 9. Empty States

Every feature must define an empty state for when no data is available or no input is given yet.

General empty state rules:
```
text-align     : center
padding        : space.5 space.4
icon           : optional, simple Unicode or SVG, color.text.secondary, 32px
heading        : font.size.lg, color.text.secondary
subtext        : font.size.md, color.text.secondary
```

Specific empty states:

| Feature | Message |
|---|---|
| Clash Detector — no courses selected | "Select two or more courses to check for clashes." |
| Clash Detector — only one selected | "Select at least one more course to compare." |
| Timetable Builder — no courses selected | "Select courses above to generate your timetable." |
| Teacher Timetable — no teacher selected | "Search for a teacher to view their timetable." |
| Free Room Finder — inputs incomplete | "Select a day and time range to find free rooms." |
| Section Comparison — no course selected | "Select a course to compare its sections." |
| Teacher Directory — no search yet | Show all teachers. |
| Teacher Directory — no match | "No teacher found matching your search." |
| Any feature — data file missing | "Timetable data is currently unavailable. Please contact TechNest." in color.status.clash |

---

## 10. Typography Rules

- All text must use `font.family.stack`.
- No font sizes outside the defined scale are permitted.
- Headings within feature areas (e.g. "Clash Detector"): `font.size.2xl`, `font.weight.bold`, `color.text.primary`, `margin-bottom: space.3`
- Feature subheadings (e.g. "Select your courses"): `font.size.xl`, `font.weight.medium`, `color.text.secondary`
- Table headers: `font.size.sm`, `font.weight.bold`
- Table cell text: `font.size.sm`, `font.weight.base`
- Button labels: `font.size.md`, `font.weight.medium`
- Input labels: `font.size.md`, `font.weight.medium`, `color.text.primary`, displayed above the input

---

## 11. Spacing Rules

- Component internal padding must use spacing tokens only — no arbitrary pixel values.
- Vertical spacing between sections within a feature page: `space.5` (40px)
- Vertical spacing between a label and its input: `space.1` (5px)
- Vertical spacing between sibling inputs in a filter row: `space.3` (12px)
- Vertical spacing between table rows: defined by cell padding, no extra margin
- Horizontal spacing between side-by-side buttons: `space.2` (10px)

---

## 12. Accessibility Requirements

All rules below must be testable.

- **Contrast**: All text on white backgrounds must meet 4.5:1 ratio. `color.text.primary` (#555555) on white (#ffffff) = 5.74:1 ✓. `color.text.secondary` (#888888) on white = 3.54:1 — this fails AA for body text; use it only for labels 14px+ or non-critical subtext.
- **Focus**: Every interactive element (button, input, checkbox, nav item, dropdown option) must show a visible focus ring. Use `outline: 2px solid color.border.focus` with `outline-offset: 2px`. Never use `outline: none` without a visible custom focus replacement.
- **Keyboard navigation**: Tab order must follow logical reading order. Dropdowns must open on Enter/Space and navigate options with arrow keys. Tables must be navigable by keyboard. Checkboxes must toggle on Space.
- **Links**: Instructor name links must have descriptive accessible labels — not just the name. Use `aria-label="View timetable for [Instructor Name]"`.
- **Tables**: All timetable grids must use `<table>` with `<th scope="col">` for time columns and `<th scope="row">` for day rows.
- **Forms**: All inputs must have a visible `<label>` element or `aria-label`. Placeholder text does not count as a label.
- **Error messages**: Validation messages must be associated with their input via `aria-describedby`.
- **Mobile touch**: All touch targets must be at minimum 44×44px. Increase padding on mobile if needed.

---

## 13. Anti-Patterns — What Must NOT Be Done

- **Do not** use raw hex values in component styles — use tokens.
- **Do not** use fonts other than `font.family.stack`.
- **Do not** use font sizes outside the defined scale.
- **Do not** add rounded corners to the timetable grid — it must have `radius.none`.
- **Do not** use colored backgrounds for the main nav items — the nav bar stays black.
- **Do not** show placeholder text as a substitute for a proper input label.
- **Do not** use red text for anything other than clash/error/occupied states.
- **Do not** use blue text (`color.text.link`) for anything other than clickable instructor names and email addresses.
- **Do not** use `outline: none` on any focused element without a fully visible custom replacement.
- **Do not** make the timetable collapse into a card-stack layout on mobile — it must scroll horizontally with a sticky day column.
- **Do not** add animations or transitions beyond the 150ms nav fade.
- **Do not** use shadows on tables — only on cards and dropdowns.
- **Do not** add a login screen, user profile section, or any authentication UI anywhere in the application.

---

## 14. QA Checklist

Before the UI is considered complete, every item below must pass:

**Tokens**
- [ ] No raw hex values appear in component CSS — all colors reference tokens
- [ ] No font sizes used outside the defined scale
- [ ] No spacing values used outside the defined scale

**Navigation**
- [ ] Active nav item is visually distinct from inactive items
- [ ] Mobile hamburger menu opens and closes correctly
- [ ] All 6 nav items are present and navigate to the correct feature

**Timetable Grid**
- [ ] Grid matches the CUIATD portal reference style (white, bordered, alternating rows, blue instructor names)
- [ ] Day column is sticky on mobile horizontal scroll
- [ ] Clash cells are highlighted in red with "CLASH" label
- [ ] Empty cells are visually blank

**Interactivity**
- [ ] Clash results update in real time as courses are selected/deselected
- [ ] Free Room Finder results update when any dropdown changes
- [ ] Teacher search results update as user types
- [ ] Section comparison table appears when exactly 2 sections are selected

**Accessibility**
- [ ] All interactive elements have visible focus indicators
- [ ] All table headers use `scope` attributes
- [ ] All inputs have visible labels
- [ ] All error/validation messages are associated with their input
- [ ] Touch targets are minimum 44×44px on mobile

**Responsive**
- [ ] All 6 features render correctly on mobile (< 640px)
- [ ] Timetable scrolls horizontally on mobile, does not collapse
- [ ] Teacher directory shows 1 column on mobile, 3 on desktop
- [ ] Buttons are full-width on mobile where appropriate
- [ ] No horizontal overflow on the page itself (only within scroll containers)

**Empty States**
- [ ] All 8 empty state scenarios are implemented with correct messages
- [ ] Data-unavailable error state is shown when Excel files are missing

---

*End of Design Specification — TimetableIQ v1.0*
*Prepared by: Amir | TechNest, CUIATD*
