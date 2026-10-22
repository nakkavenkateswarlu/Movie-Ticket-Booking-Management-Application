# 🎬 Movie Ticket Booking Management Application

A modern web-based **Movie Ticket Booking Management Application** designed to manage the complete movie ticket request lifecycle, from creating a booking request to tracking its progress and generating automated correspondence after completion.

The application provides a structured interface for managing movies, shows, bookings, booking details, and automated correspondence. It is built using **React, TypeScript, Vite, Tailwind CSS, and Supabase**.

## 📌 Project Overview

The Movie Ticket Booking Management Application provides a centralized interface for handling movie ticket requests and managing their lifecycle.

Users can create new movie booking requests, view available movies and shows, monitor booking status, inspect booking details, and manage completed requests. The system also supports automated correspondence, where dynamic booking information such as **Case ID, Movie Name, Show Date & Time, and ticket-related details** can be mapped into a notification when the request is completed.

The project follows a component-based React architecture with reusable UI components and a Supabase-backed data layer.

## ✨ Key Features

### 🎥 Movie & Show Management

- View available movies and shows.
- Display movie and show information through a dedicated interface.
- Manage movie/show-related data using the application interface.

### 🎟️ Movie Ticket Booking

- Create new movie ticket booking requests.
- Enter and manage booking information.
- Track booking requests through different stages.
- View individual booking details.

### 📋 Booking Management

- Display a list of movie ticket bookings.
- View detailed information for individual bookings.
- Track the current status of booking requests.
- Manage the booking lifecycle from request creation to completion.

### 📊 Dashboard

- Centralized dashboard for managing movie ticket requests.
- Provides an overview of booking-related information.
- Helps users navigate between movies, shows, bookings, and correspondence.

### 📩 Automated Correspondence

One of the key workflows of the application is automated correspondence.

After a movie ticket request reaches completion, the system can generate a correspondence notification using predefined rules and dynamically map booking information such as:

- Case ID
- Movie Name
- Show Date & Time
- Number of Tickets
- Other relevant booking properties

This helps demonstrate an automated request-resolution workflow.

### 🔄 Stage Progress Tracking

The application includes a stage-progress interface that helps visualize the progress of a movie ticket request through its lifecycle.

### 🗃️ Database Management

The repository contains SQL migration and seed files for creating the application database schema and populating movie/show data.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **React** | Frontend user interface |
| **TypeScript** | Type-safe application development |
| **Vite** | Frontend build and development environment |
| **Tailwind CSS** | UI styling |
| **Supabase** | Backend/database integration |
| **SQL** | Database schema and seed data |
| **ESLint** | Code quality and linting |

## 🏗️ Application Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │   + TypeScript      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌──────────────┐
       │   Movies   │   │  Bookings  │   │Correspondence│
       │  & Shows   │   │ Management │   │   Workflow   │
       └────────────┘   └─────┬──────┘   └──────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │      Supabase       │
                    │ Database / Backend  │
                    └─────────────────────┘
```

## 📂 Project Structure

```text
Movie-Ticket-Booking-Management-Application/
│
├── App.tsx
├── main.tsx
├── index.html
├── index.css
│
├── Dashboard.tsx
├── MoviesShows.tsx
├── NewBooking.tsx
├── BookingList.tsx
├── BookingDetail.tsx
├── CorrespondenceView.tsx
├── StageProgress.tsx
│
├── Badge.tsx
├── Button.tsx
├── EmptyState.tsx
├── Field.tsx
├── Modal.tsx
│
├── bookingApi.ts
├── supabase.ts
├── types.ts
├── utils.ts
│
├── config.json
├── package.json
├── package-lock.json
│
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
│
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
│
└── SQL Migration & Seed Files
    ├── create_cinewave_schema.sql
    ├── seed_movies_and_shows.sql
    └── fix_set_updated_at_search_path.sql
```

The repository currently contains React/TypeScript components for the dashboard, movies and shows, new bookings, booking lists/details, correspondence, and stage progress, along with Supabase/database configuration and SQL migration/seed files.

## ⚙️ Prerequisites

Before running the project, make sure you have:

- **Node.js**
- **npm**
- A **Supabase** project/database if using the application's Supabase integration
- Git

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nakkavenkateswarlu/Movie-Ticket-Booking-Management-Application.git
```

### 2. Navigate to the Project

```bash
cd Movie-Ticket-Booking-Management-Application
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Supabase

Configure the Supabase project according to the application's Supabase configuration.

The repository includes:

```text
supabase.ts
```

and SQL files for database schema creation and movie/show seed data.

### 5. Start the Development Server

```bash
npm run dev
```

Vite will provide a local development URL in the terminal, typically:

```text
http://localhost:5173
```

## 🗄️ Database Setup

The repository contains SQL scripts for database setup, including:

- Creating the CineWave database schema.
- Seeding movie and show data.
- Applying database-related fixes.

The SQL files included in the repository are:

```text
20260831143014_create_cinewave_schema.sql
20260831143055_seed_movies_and_shows.sql
20260831143925_fix_set_updated_at_search_path.sql
```

Run the appropriate SQL migrations in your Supabase project before using database-dependent features.

## 🔄 Application Workflow

```text
1. Open Application
        ↓
2. View Dashboard
        ↓
3. Browse Movies & Shows
        ↓
4. Create New Booking Request
        ↓
5. View Booking List
        ↓
6. Open Booking Details
        ↓
7. Track Request Progress
        ↓
8. Complete Booking Request
        ↓
9. Generate Correspondence
```

## 📩 Correspondence Workflow

The application demonstrates an automated correspondence workflow for completed movie ticket requests.

```text
Movie Ticket Request
        ↓
Request Processing
        ↓
Stage Progress
        ↓
Request Completed
        ↓
Correspondence Rule
        ↓
Dynamic Data Mapping
        ↓
Automated Notification
```

Dynamic information can include:

```text
Case ID
Movie Name
Show Date & Time
Number of Tickets
```

## 🎯 Project Objectives

The main objectives of this project are:

- Build a structured movie ticket booking management interface.
- Practice modern React development.
- Use TypeScript for type-safe frontend development.
- Implement reusable UI components.
- Manage booking-related application data.
- Integrate a backend/database service using Supabase.
- Implement a complete request lifecycle.
- Demonstrate automated correspondence generation.
- Practice database schema design and SQL migrations.

## 💡 Skills Demonstrated

This project demonstrates practical experience with:

- React component development
- TypeScript
- Vite
- Tailwind CSS
- Supabase integration
- SQL database management
- CRUD-oriented application workflows
- Component-based UI architecture
- Form handling
- Booking lifecycle management
- Dynamic data mapping
- Automated correspondence workflows
- Frontend application development

## 🔮 Future Enhancements

Potential future improvements include:

- User authentication and role-based access control.
- Online payment gateway integration.
- Real-time seat availability.
- Movie search and filtering.
- Ticket cancellation and refund management.
- QR-code-based digital tickets.
- Email/SMS notification integration.
- Admin analytics and booking reports.
- Movie ratings and reviews.
- Deployment with a production backend.

## 📸 Screenshots

Add application screenshots here:

```markdown
## 📸 Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Movies & Shows
![Movies & Shows](screenshots/movies-shows.png)

### New Booking
![New Booking](screenshots/new-booking.png)

### Booking Details
![Booking Details](screenshots/booking-details.png)

### Correspondence
![Correspondence](screenshots/correspondence.png)
```

## 📜 License

This project is intended for **educational and portfolio purposes**.

## 👨‍💻 Author

**Nakka Venkateswarlu**

GitHub:  
`https://github.com/nakkavenkateswarlu/Movie-Ticket-Booking-Management-Application`

---

⭐ If you found this project interesting, consider giving the repository a star!
