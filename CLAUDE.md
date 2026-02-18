# Vortexp

Vektörel çizim yapabilen, düz (flat) vektör tabanlı canvas uygulaması.

---

## Stack

- React 19
- TypeScript
- Vite 7
- Tailwind v4
- Vitest (testing)

---

## Port

- Development: 3003

---

## Brand

- **Obsidian Black** `#222121` — Background, dark surfaces
- **Bone White** `#F9FEFF` — Primary text, foreground
- **Ash Silver** `#E2E7E9` — Borders, dividers, secondary text
- **Theme:** Dark mode only

---

## Commands

- `StartEngine!` — Start development server
- `StopEngine!` — Stop development server
- `npm test` — Run tests
- `npm run test:ui` — Run tests with UI

---

## Architecture

**Canvas Engine:** SVG-based vector drawing canvas
- Tools: Selection, Rectangle, Circle, Line, Pen (Path)
- Properties: Fill, Stroke, Stroke Width
- Export: SVG format

---

## Environment Variables

See `.env.example` for configuration.
