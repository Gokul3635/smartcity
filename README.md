# Smart City Management System

A full-stack platform that helps citizens, government departments, and service providers manage a city digitally.

## Features

| Module | Capabilities |
|--------|-------------|
| **Citizen Portal** | Register/Login, report issues, track complaints, pay bills, emergency contacts, announcements |
| **Government Portal** | Manage complaints, assign field workers, monitor services, generate reports |
| **Waste Management** | Collection schedules, vehicle tracking, complaint management |
| **Traffic Management** | Traffic updates, accident reports, route suggestions |
| **Water & Electricity** | Usage monitoring, bill generation, payment history |
| **Public Transport** | Bus tracking, route information, ticket management |
| **Emergency Services** | Ambulance, fire, and police emergency requests |
| **Analytics Dashboard** | City-wide statistics, resolution rates, service performance |

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Recharts
- **Backend:** Node.js, Express, JWT authentication, JSON file storage

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Run the Application

**Option 1 — Single command (recommended):**
```bash
npm run dev
```

**Option 2 — Separate terminals:**

**Terminal 1 — Backend (port 5000):**
```bash
npm run dev:backend
```

**Terminal 2 — Frontend (port 3000):**
```bash
npm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@example.com | password123 |
| Admin | admin@smartcity.gov | password123 |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new citizen |
| POST | `/api/auth/login` | Login |
| PATCH | `/api/auth/profile` | Update profile |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/complaints` | List complaints |
| POST | `/api/complaints` | Create complaint |
| PATCH | `/api/complaints/:id` | Update complaint (admin) |
| GET | `/api/announcements` | Community announcements |
| GET | `/api/waste/schedules` | Waste collection schedules |
| GET | `/api/waste/vehicles` | Waste vehicle tracking |
| GET | `/api/traffic/updates` | Traffic status |
| GET | `/api/traffic/accidents` | Accident reports |
| GET | `/api/utilities/bills` | Utility bills |
| POST | `/api/utilities/bills/:id/pay` | Pay a bill |
| GET | `/api/transport/buses` | Live bus tracking |
| GET | `/api/transport/routes` | Bus routes |
| POST | `/api/emergency/requests` | Submit emergency request |
| GET | `/api/analytics` | Dashboard analytics (admin) |

## Project Structure

```
smartcity/
├── backend/
│   ├── server.js          # Express server
│   ├── routes/            # API route handlers
│   ├── data/store.js      # JSON data store
│   └── middleware/auth.js # JWT middleware
├── frontend/
│   ├── src/
│   │   ├── pages/         # Portal pages
│   │   ├── components/    # Shared UI components
│   │   ├── api/client.js  # API client
│   │   └── context/       # Auth context
│   └── index.html
└── package.json
```
