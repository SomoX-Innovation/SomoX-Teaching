# SomoxLearn - Learning Management System (LMS)

A modern, responsive Learning Management System built with React, featuring a beautiful UI and smooth user experience.

## Features

- 📚 **Dashboard with Blog Cards** - Beautiful blog post cards with images, author info, and dates
- 🎨 **Modern Sidebar Navigation** - Collapsible sidebar with nested menu items
- 🔄 **Smooth Animations** - Hover effects, transitions, and interactive elements
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🎯 **React Router Integration** - Client-side routing for smooth navigation
- 🎭 **Icon Library** - React Icons for consistent and scalable icons

## Technologies Used

- **React 19** - Latest version of React
- **React Router DOM** - Client-side routing
- **React Icons** - Icon library
- **Vite** - Fast build tool and development server
- **CSS3** - Modern styling with custom properties

## Project Structure

```
somoxlearn/
├── public/
│   └── assets/          # Static assets (images, etc.)
├── src/
│   ├── components/      # Reusable components
│   │   ├── Sidebar.jsx
│   │   └── Sidebar.css
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Dashboard.css
│   │   ├── PlaceholderPage.jsx
│   │   └── PlaceholderPage.css
│   ├── assets/          # Source assets
│   │   └── images/
│   ├── App.jsx          # Main app component with routing
│   ├── App.css          # App styles
│   ├── main.jsx         # App entry point
│   └── index.css        # Global styles
├── package.json
└── vite.config.js
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd somoxlearn
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Sidebar Navigation

The sidebar includes:
- User profile section with avatar and name
- Dashboard link
- Task Management (with submenu)
- AI Assistant
- Session Recording (with submenu)
- Zoom Sessions
- Third-Party API (with submenu)

### Dashboard

The dashboard displays:
- Page title and breadcrumb navigation
- Grid of blog post cards
- Each card shows:
  - Featured image
  - Title
  - Excerpt
  - Author information
  - Publication date
  - "Read More" button

### Responsive Design

- **Desktop** (>1024px): 3-column grid layout
- **Tablet** (768px-1024px): 2-column grid layout
- **Mobile** (<768px): Single column layout, collapsible sidebar

## Customization

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.jsx`:

```jsx
<Route 
  path="/your-path" 
  element={<YourComponent />} 
/>
```

### Styling

- Global styles: `src/index.css`
- Component-specific styles: Create a `.css` file next to your component
- Color scheme can be customized in the CSS files

### Adding Sidebar Menu Items

Edit `src/components/Sidebar.jsx` to add new navigation items:

```jsx
<li>
  <Link to="/your-route" className="nav-link">
    <YourIcon className="nav-icon" />
    <span className="nav-text">Your Menu Item</span>
  </Link>
</li>
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact the development team.

## Acknowledgments

- Design inspired by modern LMS platforms
- Icons provided by React Icons
- Built with ❤️ using React and Vite
