# Class Registration App - Frontend

This is the frontend application for the Class Registration System, built with Next.js 15+ using the App Router.

## Project Structure

```
/FrontEnd
  /app          - Next.js App Router pages and layouts
  /js           - JavaScript components and utilities
  /CSS          - Stylesheets
  /HTML         - HTML templates (if needed)
  /public       - Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on port 3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set the backend API URL if different from default.

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001).

### Build

Build for production:
```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3000)
- `NEXT_PUBLIC_APP_NAME` - Application name

## Features

- User registration and authentication
- Class browsing and enrollment
- Class management (enroll/unenroll)
- Responsive design
- Real-time password strength validation

## Technology Stack

- Next.js 15+ (App Router)
- React 19+
- Native Fetch API for HTTP requests
- CSS3 for styling
