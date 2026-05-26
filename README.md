# She Can Foundation — Education & Empowerment for Women

She Can Foundation is a registered non-profit organization based in Kolkata, West Bengal, working to bridge the opportunity gap for female students and underprivileged youth. This repository contains the source code for the official, premium, responsive, and secure landing page of the She Can Foundation.

Deployed Demo: Ready to deploy on Vercel.

---

## 🎨 Design System & UX Highlights
* **iOS-Style Glassmorphism**: Translucent card layouts with HSL-tailored colors, smooth gradients, and glowing accents.
* **Smart Hiding Header**: The sticky frosted-glass navigation bar slides up out of view when scrolling down to give a clean reading area, and slides back down immediately on scroll up for accessible navigation.
* **Ambient Mesh Glows**: Background circles featuring soft radial gradients that adaptively shift colors between light and dark modes, creating a state-of-the-art visual experience.
* **Interactive Leaflet Map**: Rendered for the head office location in Salt Lake Sector V, Kolkata, with tile style overrides matching the user's active theme.
* **Interactive Elements**: Dynamic count-up counter triggers on viewport intersection, image viewing lightbox modal, and responsive testimonial carousel.
* **Staggered Scroll Reveals**: Pure CSS and `IntersectionObserver`-based slide-ins that render elements smoothly on scroll without the weight of external animation frameworks.

---

## 🛡️ Security Hardening & Best Practices
This project has been built following high-quality code guidelines with robust client-side security measures to prevent common web vulnerabilities:
* **XSS Protection**: Inputs from form controls are escaped using an HTML escape helper function before any DOM rendering.
* **Input Sanitization**: User data is strictly trimmed and stripped of control characters, with size boundaries validated in both JavaScript and HTML (`maxlength` attributes).
* **Form Submission Throttling (Rate Limiting)**: Rate-limits submissions (3-second cooldown) to block script-driven automated spamming.
* **Subresource Integrity (SRI)**: Verifies checksum hashes for Font Awesome, Google Fonts, and Leaflet CSS/JS assets, blocking man-in-the-middle CDN injection attacks.
* **Target Blank Protection**: Every external link uses `rel="noopener noreferrer"` to prevent tab-nabbing vulnerabilities.
* **LocalStorage Theme Verification**: Sanitizes local storage parameters on load to ensure only valid themes (`light` or `dark`) are processed.
* **Strict Runtime Safety**: JavaScript is executed in strict mode (`'use strict'`) and partitioned into try-catch blocks to prevent single component failures from stopping critical page scripts.

---

## 🚀 Tech Stack
* **HTML5**: Structured semantic markup with proper ARIA roles and headings structure for accessibility.
* **Vanilla CSS3**: Styled dynamically with CSS variables, HSL color palettes, responsive flex/grid layouts, and transitions.
* **Vanilla JavaScript (ES6+)**: Custom animations, carousel logic, form validation, and map pointer behaviors.
* **Leaflet.js**: Lightweight open-source mapping.
* **Vite**: Ultra-fast next-generation frontend bundler.

---

## 💻 Local Setup & Development

Follow these steps to run the project locally on your machine:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 2. Install Dependencies
Clone the repository and install the project packages:
```bash
npm install
```

### 3. Start Development Server
Run Vite's local dev server (default port is `5173`):
```bash
npm run dev
```

### 4. Build for Production
Bundle and optimize all CSS, JS, HTML, and assets into the `/dist` directory for production deployment:
```bash
npm run build
```

