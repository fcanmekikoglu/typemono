# Typemono

> Minimalist, monochrome PWA markdown editor

Typemono is a fast, offline-capable, and minimalist markdown editor built with modern web technologies. 

## Features

- **Rich Markdown Editing:** Powered by [Milkdown](https://milkdown.dev/).
- **Offline First (PWA):** Installable as a Progressive Web App, works offline.
- **Local Storage:** Documents are safely stored in your browser using IndexedDB (via [Dexie.js](https://dexie.org/)).
- **Monochrome Aesthetics:** Clean, distraction-free writing environment.
- **Modern Routing:** Type-safe routing with [TanStack Router](https://tanstack.com/router/latest).

## Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS 4
- **Editor:** @milkdown/crepe, @milkdown/kit, marked
- **Database:** Dexie.js (IndexedDB)
- **Routing:** @tanstack/react-router
- **PWA:** vite-plugin-pwa
- **Testing:** Vitest & React Testing Library

## Getting Started

### Prerequisites
Make sure you have Node.js and a package manager (npm, pnpm, or yarn) installed.

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/fcanmekikoglu/typemono.git
   cd typemono
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Builds the app for production.
- `npm run preview`: Previews the production build locally.
- `npm run test`: Runs the Vitest test suite.
- `npm run lint`: Checks for linting errors with ESLint.
- `npm run format`: Formats code with Prettier.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
