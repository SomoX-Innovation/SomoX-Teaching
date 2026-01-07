# SomoxLearn LMS - Component Structure

## 📋 Project Overview

This is a modern Learning Management System (LMS) built with React, featuring a sidebar navigation and a blog-style dashboard.

## 🗂️ File Structure

```
somoxlearn/
├── public/
│   └── assets/
│       ├── logo.svg              # CodingGura logo
│       └── profile.svg           # User profile avatar
│
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx           # Main sidebar navigation
│   │   └── Sidebar.css           # Sidebar styles
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx         # Main dashboard with blog cards
│   │   ├── Dashboard.css         # Dashboard styles
│   │   ├── PlaceholderPage.jsx   # Reusable placeholder component
│   │   └── PlaceholderPage.css   # Placeholder styles
│   │
│   ├── App.jsx                   # Main app with routing
│   ├── App.css                   # App layout styles
│   ├── main.jsx                  # App entry point
│   └── index.css                 # Global styles
│
├── package.json                  # Dependencies
├── vite.config.js                # Vite configuration
├── README.md                     # Full documentation
├── QUICKSTART.md                 # Quick start guide
└── COMPONENT_STRUCTURE.md        # This file
```

## 🧩 Component Details

### 1. Sidebar Component
**File:** `src/components/Sidebar.jsx`

**Features:**
- Fixed position sidebar (280px wide)
- Logo at the top
- User profile section with dropdown capability
- Navigation menu with icons
- Active state highlighting
- Submenu support with smooth animations
- Responsive (collapses on mobile)

**Navigation Items:**
1. Dashboard - Direct link
2. Task Management - With submenu
   - Tasks
3. AI Assistant - Direct link
4. Session Recording - With submenu
   - Session Recording List
   - Other Recording List
5. Zoom Sessions - Direct link
6. Third-Party API - With submenu
   - Get API with Key

### 2. Dashboard Component
**File:** `src/pages/Dashboard.jsx`

**Features:**
- Page header with title
- Breadcrumb navigation
- Scrollable content area
- Responsive grid layout:
  - Desktop (>1024px): 3 columns
  - Tablet (768-1024px): 2 columns
  - Mobile (<768px): 1 column

**Blog Card Structure:**
- Image (12rem height)
- Title (2-line clamp)
- Excerpt (3-line clamp)
- Author with icon
- Date with icon
- Read More button with arrow

### 3. PlaceholderPage Component
**File:** `src/pages/PlaceholderPage.jsx`

**Features:**
- Reusable placeholder for unimplemented pages
- Centered card layout
- Icon, title, and description
- Clean, minimal design

### 4. App Component
**File:** `src/App.jsx`

**Features:**
- React Router setup
- Layout with Sidebar + Main content
- Route definitions for all pages
- 404 fallback route

## 🎨 Styling Approach

### CSS Organization
- Component-specific CSS files alongside components
- Global styles in `index.css`
- Layout styles in `App.css`
- No CSS-in-JS or preprocessors (pure CSS)

### Design System

**Colors:**
- Primary Blue: `#3b82f6`
- Secondary Blue: `#2563eb`
- Gray Scale:
  - Background: `#f9fafb`
  - Text Dark: `#1f2937`
  - Text Medium: `#6b7280`
  - Border: `#e5e7eb`

**Spacing:**
- Base unit: `0.25rem` (4px)
- Common values: 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem

**Typography:**
- Font Family: System fonts stack
- Headings: 700 weight
- Body: 400-500 weight
- Sizes: 0.75rem to 1.875rem

**Border Radius:**
- Small: `0.375rem`
- Medium: `0.5rem`
- Large: `0.75rem`

**Shadows:**
- Small: `0 1px 3px rgba(0,0,0,0.1)`
- Medium: `0 4px 6px rgba(0,0,0,0.1)`
- Large: `0 10px 15px rgba(0,0,0,0.1)`

## 🔄 State Management

**Current Implementation:**
- Local component state with `useState`
- No global state management yet

**Recommended for Future:**
- Redux Toolkit for complex state
- React Context for auth/theme
- TanStack Query for server state

## 🛣️ Routing Structure

```
/                                    → Redirect to /dashboard
/dashboard                           → Dashboard (Blog cards)
/dashboard/student-tasks             → Task Management (Placeholder)
/dashboard/chatgpt                   → AI Assistant (Placeholder)
/dashboard/student-session-recording → Session Recording (Placeholder)
/dashboard/student-other-recording   → Other Recording (Placeholder)
/dashboard/zoom-sessions             → Zoom Sessions (Placeholder)
/dashboard/get-api-with-key          → API Management (Placeholder)
/*                                   → 404 Page (Placeholder)
```

## 🔌 Integration Points

### Ready to Connect:

1. **Authentication System**
   - User profile in sidebar
   - Protected routes
   - Login/logout functionality

2. **API Integration**
   - Blog posts from CMS/API
   - User data
   - Task management
   - Recording lists

3. **Database**
   - Blog content
   - User information
   - Course data
   - Recording metadata

4. **Media Storage**
   - Profile images
   - Blog post images
   - Video recordings
   - Documents

5. **Real-time Features**
   - Live chat (AI Assistant)
   - Notifications
   - Session updates

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
- Base: < 768px (Mobile)
- Tablet: >= 768px
- Desktop: >= 1024px
```

## ⚡ Performance Considerations

**Current Optimizations:**
- Vite for fast builds
- React 19 with automatic batching
- CSS only (no runtime style processing)
- Lazy loading ready (add React.lazy)

**Future Optimizations:**
- Image optimization
- Code splitting
- Virtual scrolling for long lists
- Service worker/PWA

## 🧪 Testing Strategy

**Recommended Testing:**
1. Unit tests: Component logic
2. Integration tests: User flows
3. E2E tests: Critical paths
4. Visual regression: UI consistency

**Tools to Add:**
- Vitest (unit testing)
- React Testing Library
- Playwright (E2E)
- Storybook (component development)

## 📚 Documentation

1. **README.md** - Complete project documentation
2. **QUICKSTART.md** - Get started quickly
3. **COMPONENT_STRUCTURE.md** - This file
4. Inline code comments - Throughout source files

## 🚀 Deployment Ready

**Build Command:**
```bash
npm run build
```

**Output:** `dist/` folder

**Deploy to:**
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting

## 🔐 Security Considerations

**To Implement:**
- [ ] Input sanitization
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] Secure authentication
- [ ] API rate limiting
- [ ] Content Security Policy

## ♿ Accessibility

**Current Implementation:**
- Semantic HTML
- ARIA labels on sidebar
- Keyboard navigation support
- Alt text for images

**To Enhance:**
- Focus management
- Screen reader testing
- Color contrast validation
- Skip navigation links

---

**Created:** January 5, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready (Foundation)

