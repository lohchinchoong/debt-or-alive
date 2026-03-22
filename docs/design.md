# Design System Strategy: The Fiscal Atelier
## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Fiscal Atelier."**
Unlike generic fintech platforms that rely on sterile, high-contrast grids and aggressive "action" colors, this system treats personal finance as a craft. It evokes the atmosphere of a high-end conservatory—quiet, authoritative, and meticulously organized. We break the "template" look by utilizing intentional asymmetry, where heavy editorial typography (Manrope) is paired with expansive white space and layered surfaces. By prioritizing tool accessibility over account management, the UI becomes a series of specialized workstations, using depth and tonal transitions to guide the user's eye without the clutter of traditional structural lines.
## 2. Colors & Surface Architecture
This system utilizes a sophisticated palette of deep botanical greens and soft, mineral neutrals to establish trust and "old-money" stability.
### The "No-Line" Rule
To maintain a premium, editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through background color shifts.
*   **Method:** Use `surface-container-low` (`#f2f4f2`) for the main page body, and transition to `surface-container` (`#eceeec`) or `surface-container-high` (`#e6e9e7`) for tool sections. This creates a natural "valley and peak" flow to the content.
### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper.
*   **Layering:** Place `surface-container-lowest` (#ffffff) cards on top of `surface-container-low` (#f2f4f2) backgrounds.
*   **Depth:** For secondary interactive elements, use `surface-container-highest` (#e1e3e1) to indicate a "recessed" or "pressed" area, such as a calculator input field.
### The "Glass & Gradient" Rule
Flat colors can feel clinical. To add "soul":
*   **Floating Elements:** Use Glassmorphism for tooltips and floating navigation bars. Apply `surface` colors at 80% opacity with a `12px` backdrop-blur.
*   **Signature Textures:** For primary CTAs and Hero sections, use a subtle linear gradient (45-degree) from `primary` (#00351f) to `primary_container` (#0e4d31). This adds a velvet-like depth that solid hex codes cannot achieve.
## 3. Typography: The Manrope Scale
Manrope is our sole typeface. Its geometric construction provides modern clarity, while its open apertures ensure readability in complex financial data.
*   **Display (lg/md):** Used for large-scale impact. Set with `-0.02em` letter spacing to feel "locked in" and authoritative.
*   **Headline (lg/md):** Your primary navigational markers. Use these to frame the "Financial Conservatory" experience.
*   **Body (lg/md):** The workhorse for tool descriptions. Ensure a line height of `1.6` for long-form explanatory text to provide "breathing room."
*   **Label (md/sm):** Used exclusively for data points and input captions. Always set in Medium or Semi-Bold weight to ensure they don't get lost in the tonal background.
## 4. Elevation & Depth
In this design system, depth is a function of light and shadow, not lines.
*   **The Layering Principle:** Avoid shadows for static content. Create hierarchy by stacking tiers: `surface` (base) -> `surface-container-low` (section) -> `surface-container-lowest` (interactive card).
*   **Ambient Shadows:** For elements that truly float (Modals, Dropdowns), use a "Botanical Shadow":
    *   `Box-shadow: 0 20px 40px rgba(14, 77, 49, 0.06);`
    *   This uses a tint of our primary green rather than grey, making the shadow feel like a natural part of the environment.
*   **The "Ghost Border":** If accessibility requires a container boundary, use `outline_variant` (#c0c9c0) at **15% opacity**. It should be felt, not seen.
## 5. Components & Primitive Styling
### Buttons (The Statement Piece)
*   **Primary:** Round-8 (0.5rem) corners. Uses the Signature Gradient. No border. White text.
*   **Secondary:** `surface-container-highest` background. Dark green text. Focus on a "soft-touch" feel.
*   **Tertiary:** Text-only with an underline that appears on hover, using `primary_fixed` (#b3f0ca) as a high-contrast highlight.
### Input Fields (The Workstation)
*   **Style:** Abandon the "box." Use a `surface-container-lowest` background with a `2px` bottom-only stroke in `outline_variant`.
*   **Focus State:** The bottom stroke transitions to `primary` (#00351f) with a subtle glow.
### Cards & Tool Modules
*   **Rule:** Forbid divider lines within cards. Use `Spacing Scale 4` (1.4rem) to separate internal groups of data.
*   **Interactive State:** On hover, a card should shift from `surface-container-lowest` to `surface-container-low`, creating a subtle "sink" effect rather than a "lift."
### Progress & Data Visualization
*   **Financial Bars:** Use `primary` (#00351f) for positive values and `tertiary` (#4f1b1f) for debt or negative values. Avoid bright "traffic light" reds; use our muted, sophisticated wine-red instead.
## 6. Do's and Don'ts
### Do
*   **Do** use asymmetrical margins. For example, a calculator can be offset to the right with a large `display-lg` headline sitting 2/3rds to the left.
*   **Do** use `Spacing 12` (4rem) and `16` (5.5rem) between major tool sections to prevent the UI from feeling "crowded."
*   **Do** prioritize the "Zero-Account" flow. The tool should be fully functional on the first screen.
### Don't
*   **Don't** use 100% black (#000000). Always use `on_surface` (#191c1b) for text to maintain the soft, conservatory aesthetic.
*   **Don't** use standard "drop shadows." If it looks like a default CSS shadow, it's too heavy.
*   **Don't** use sharp corners. Every interactive element must adhere to the `Round 8` (0.5rem) or `lg` (1rem) scale to maintain the modern, approachable tone.
