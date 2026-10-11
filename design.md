# PrepAI — UI/UX and Design System

## 1. Product design direction

**Style:** Premium dark Glassmorphism, academic productivity, calm AI-first workspace.  
**Visual reference:** the user-provided Task Master screenshot. Reuse its visual language—dark canvas, vibrant gradients, sidebar, rounded translucent panels, colorful progress indicators and compact dashboard grid—without copying its branding or task-specific content.

PrepAI must feel focused and trustworthy. The blur and gradients are atmosphere, not the main event; study schedule, deadlines, grounded answers, citations, and progress remain easy to read.

## 2. Visual rules: glass card anatomy

Each major glass surface should follow the multi-layer design formula:

1. **Translucent fill:** dark glass on the dark theme. Start around `rgba(18, 22, 35, 0.72)` and adjust opacity upward where contrast or density requires it.
2. **Backdrop blur:** approximately `blur(20px)` for primary surfaces; use roughly 10px for distant/decorative surfaces and up to 24–30px for focused dialogs/overlays.
3. **Shine border:** 1px reflective edge, brighter at top-left and softer at bottom-right. Use a gradient border technique only where it renders cleanly.
4. **Material shadow:** soft, wide, low-opacity dark shadow, such as `0 8px 32px rgba(0, 0, 0, 0.25)`.
5. **Optional inner highlight:** subtle top-edge sheen or inset highlight, never a thick luminous outline.

Example base styles (adapt to browser and component needs):

```css
.glass-panel {
  background: rgba(18, 22, 35, 0.72);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}
```

For the gradient edge, use a wrapper/pseudo-element or border-image strategy that does not create unwanted clipping. Test the result in the actual browser.

### No double-blur nesting

Do not nest multiple backdrops directly inside each other. Primary cards may contain flat/translucent rows, simple bordered controls, and solid content surfaces, but avoid repeated blur surfaces inside every card. Buttons and inputs use opacity, border, fill, glow, or elevation changes on hover/focus—never animated blur changes.

## 3. Background canvas

- Base background: approximately `#080B12`.
- Use large, softly blended radial gradients in deep indigo, violet, blue, and a small amount of emerald/teal.
- Place gradients behind content rather than on every individual card.
- Add restrained ambient light to make frosted surfaces visible.
- Avoid flat, featureless backgrounds, but also avoid noisy textures, many particles, strong animated meshes, and neon overload.
- On mobile or low-power devices, reduce decorative effects where needed.

## 4. Design tokens

Treat these as starting tokens; refine them only through a deliberate global change rather than per-page improvisation.

```css
:root {
  --bg-base: #080B12;
  --bg-elevated: #101522;
  --text-primary: #F5F7FF;
  --text-secondary: #B6BECE;
  --text-muted: #8B95A8;
  --accent-emerald: #43E58B;
  --accent-violet: #8B7CFF;
  --accent-blue: #60A5FA;
  --accent-amber: #FFAD55;
  --accent-danger: #FF6B78;
  --glass-fill: rgba(18, 22, 35, 0.72);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  --radius-card: 20px;
  --radius-control: 12px;
  --space-unit: 4px;
}
```

Use `#8B95A8` for muted metadata only when its actual contrast on a given surface is sufficient; otherwise brighten it. Accessibility takes priority over visual token purity.

## 5. Accessibility

- Target at least WCAG AA contrast: 4.5:1 for normal text and 3:1 for large text and essential non-text UI graphics.
- Use color + text/icon/shape to indicate status; never rely on color alone.
- Every input has a visible label or an accessible name.
- Focus rings must be clear against dark surfaces.
- All actions must work with keyboard navigation.
- Dialogs manage focus and have an accessible name and close mechanism.
- Charts have titles/labels and a text summary or table alternative where practical.
- Honor reduced-motion preferences where supported.
- Body text should remain comfortably readable; do not shrink content to fit a dense card.

## 6. Typography, spacing, and shape

- Use Inter, Geist, or a similar modern sans-serif UI font.
- Use clear typographic hierarchy: page title, section title, card title, body, labels, helper/error text.
- Follow a 4px/8px spacing scale and maintain consistent card padding.
- Major cards: 16–24px radius; controls: 10–14px radius; pills are reserved for concise statuses/chips.
- Keep icon sizes and stroke weights consistent using Lucide React.
- Avoid emoji as primary navigation or action icons.

## 7. Application shell

### Sidebar
- Desktop width around 240–270px; compact/collapsible mode optional.
- PrepAI logo and label at top.
- Navigation: Dashboard, AI Study Planner, My Tasks, Calendar, AI Study Assistant, My Documents, Progress & Analytics, Settings.
- Active item uses a subtle accent background/edge, clear text, and icon; do not rely only on glow.
- Profile and study streak sit near the bottom.
- Tablet/mobile uses a drawer or compact navigation.

### Top bar
- Context-sensitive page title/breadcrumb.
- Global search: “Search topics, tasks, documents...”
- Notifications and user profile; theme switch if themes are implemented.
- Keep height compact and avoid duplicated large headings.

### Main content
- At 1440px desktop, aim for 32–40px outer margin and 20–24px between major cards.
- Use a responsive 12-column or equivalent CSS grid.
- Maintain consistent alignment across card boundaries and chart headings.
- Avoid fixed heights that clip content.

## 8. Required screens and page-specific guidance

### 8.1 Authentication
- Premium but quiet sign-in/register screen.
- Heading: “Welcome back to your learning space.”
- Email, password with show/hide, forgot password, sign-in, registration, reset/error/loading states.
- Optional second panel with a tasteful academic visual: document preview, small study calendar, AI spark.

### 8.2 Dashboard
- Personalized greeting/date and actions “Generate Study Plan” and “Ask PrepAI”.
- Summary cards: today's study hours, completed tasks, upcoming exams, study streak.
- Primary area: today's study sessions and upcoming deadlines.
- Secondary area: PrepAI Insights and quick ask box.
- Lower area: weekly study-hours chart, subject progress, recent activity.
- Use real API values after data is available. If sample fixtures are used, label them as demo data.

### 8.3 AI Study Planner
- Availability/setup wizard, subjects/topics and deadlines, duration/difficulty/importance inputs.
- Day/week schedule view with session type, subject, time, and status.
- Explain why high-priority items appear where they do.
- Provide Generate, Adjust Availability, Reschedule, Mark Complete, and Regenerate Remaining Plan actions.
- Preview plan changes before applying them. Preserve completed sessions.

### 8.4 My Tasks
- Add Task action, search, filters: All, Today, Upcoming, Overdue, Completed; sorting by date, priority, subject.
- Task rows display title, subject, due date, duration, priority, status, and optional linked session.
- Support create/edit modal, completion/reopen, delete confirmation, empty/loading/error states.

### 8.5 Calendar
- Month/week/day modes, Today button, prior/next navigation, selected-day agenda.
- Study sessions, assignments, exams, and revision blocks have readable category markers and labels.
- No overlapping unreadable event blocks; use overflow indicators and agenda fallback.

### 8.6 AI Study Assistant
- Left panel: new chat, search, recent conversations.
- Main panel: chat history and accessible composer.
- Optional collapsible sources panel: source title, page/slide, retrieved passage.
- Assistant answer typography supports headings, lists, code and tables.
- Citations appear inline or as source chips, e.g. `[Python_Unit_3.pdf · p. 12]`.
- Selecting a citation opens a source preview or retrieved passage.
- Insufficient evidence state: “I couldn't find sufficient information in your uploaded materials to answer this confidently.”
- Actions: copy, regenerate, feedback, follow-up, view sources. Make model loading and service unavailable states clear.

### 8.7 My Documents
- Drag-and-drop upload, upload button, search, filters by subject/type/status, grid/list switch.
- Card/row fields: file icon, title, subject, size/date when available, processing status, page count when available.
- States: Uploaded, Processing, Indexed, Failed.
- Actions: open/preview, ask questions, rename, assign subject, retry, remove.
- A document is not “ready for questions” until indexing succeeds.

### 8.8 Progress & Analytics
- Total study time, completed sessions, task completion rate, topic/subject completion, weekly consistency, revision activity.
- Weekly/monthly chart and planned-versus-completed comparison.
- Useful filters, legends, tooltips, responsive labels.
- Empty states instead of fabricated statistics.

### 8.9 Settings
- Profile, academic details, subjects, availability, study preferences, reminders, appearance, account security, data/document management.
- Save/cancel/loading/error/success states. Confirm destructive actions.

## 9. Motion and interaction states

- Hover: slightly brighter fill/border or subtle elevation.
- Focus: high-contrast ring and visible control outline.
- Pressed: small fill/position change without excessive motion.
- Selected: consistent active surface and label.
- Loading: skeletons or inline progress indicators; preserve layout.
- Disabled: visibly inactive with accessible explanatory text where useful.
- Dialogs: restrained fade/scale, approximately 150–250ms transitions.
- Never animate backdrop blur. Keep transitions smooth and purposeful.

## 10. Responsive breakpoints and behavior

- Wide desktop: expanded sidebar and multi-column dashboard.
- Tablet: collapsible sidebar and fewer dashboard columns.
- Mobile: one-column cards, drawer navigation, touch-friendly controls, adaptable calendar, full-width chat composer, collapsible source panel.
- Avoid horizontal page overflow and clipped chart labels.
- Test at least 1440px, 1024px, 768px, and 390px widths.

## 11. Design acceptance checklist

- [ ] Background uses colorful, high-contrast organic gradient shapes behind the UI.
- [ ] Glass layers use translucent fill, 16–24px typical blur, reflective edge, and material shadow.
- [ ] Nested double-blur is avoided.
- [ ] Contrast and focus states are accessible.
- [ ] Navigation labels and icons are consistent.
- [ ] Cards and page headings align to a predictable spacing grid.
- [ ] Dashboard includes planner and RAG entry points.
- [ ] RAG citations and document-processing states are visually distinct and understandable.
- [ ] Empty/loading/error/success states are designed for core flows.
- [ ] Responsive layouts are checked at desktop, tablet, and phone widths.
- [ ] Motion is restrained, performant, and does not animate blur.
