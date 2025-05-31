# PC Reserve Track

PC Reserve Track is a web application for managing computer reservations, tracking computer usage, and handling faults in a lab or shared environment. It supports multiple user roles (students, admins, technicians), real-time updates, and integrates with Supabase for backend services.

## Features

- **User Authentication**: Secure login and registration with role-based access (Student, Admin, Technician).
- **Computer Reservation**: Students can reserve available computers for a set period.
- **Fault Reporting**: Users can report faults; technicians can mark computers as fixed.
- **Admin Dashboard**: Overview of all computers, user management, and tracking.
- **Profile Management**: Users can update their profile and avatar.
- **Responsive UI**: Built with React, Tailwind CSS, and shadcn/ui components.
- **Supabase Integration**: For authentication, database, and storage.

## Project Structure

```
src/
  components/         # UI and feature components
    admin/            # Admin-specific components
    auth/             # Authentication components
    computers/        # Computer cards, grids, actions
    dashboard/        # Dashboards for each role
    tracking/         # Computer tracking tables
    ui/               # Reusable UI primitives (card, button, form, etc.)
  context/            # React context providers (Auth, Computer, Tracking)
  hooks/              # Custom React hooks (reservation, release, dashboard, etc.)
  integrations/       # Supabase client and integrations
  lib/                # Utility functions
  pages/              # Route components (Dashboard, Profile, Auth, etc.)
  services/           # Data services and mock data
  types/              # TypeScript types and interfaces
  utils/              # Utility helpers
public/               # Static assets
supabase/             # Supabase configuration
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- [Bun](https://bun.sh/) (if using bun.lockb)
- Supabase project (see `supabase/config.toml`)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/pcreservetrack.git
   cd pcreservetrack
   ```

2. **Install dependencies:**
   ```sh
   npm install
   # or
   bun install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env` and fill in Supabase credentials.

4. **Run the development server:**
   ```sh
   npm run dev
   # or
   bun run dev
   ```

5. **Open in browser:**
   - Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

### Build for Production

```sh
npm run build
```

### Linting

```sh
npm run lint
```

## Technologies Used

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [Vite](https://vitejs.dev/)

## Folder Highlights

- [`src/components/computers/ComputerCard.tsx`](src/components/computers/ComputerCard.tsx): Main component for displaying and interacting with a computer.
- [`src/context/ComputerContext.tsx`](src/context/ComputerContext.tsx): Provides computer state and actions throughout the app.
- [`src/hooks/computerActions/useReserveComputer.ts`](src/hooks/computerActions/useReserveComputer.ts): Logic for reserving a computer.
- [`src/pages/Dashboard.tsx`](src/pages/Dashboard.tsx): Main dashboard, routes to role-specific dashboards.

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## License

[MIT](LICENSE)

---

**Maintained by:** [Your Name or Organization]

## Leaderboard & Badges Features

### Overview
This project now includes a **Leaderboard** for the most responsible users and **Badges** for frequent users. These features are designed to encourage responsible computer usage and reward frequent/responsible users.

### Features
- **Leaderboard:**
  - Shows the top 5 users with the fewest no-shows and late returns, and the most successful reservations.
  - Appears at the top of the Student Dashboard (`src/components/dashboard/StudentDashboard.tsx`).
- **Badges:**
  - Users earn badges such as "Early Bird" (for early-morning reservations), "Night Owl" (for late-night reservations), and "Frequent User" (for 10+ successful reservations).
  - Badges are displayed in the "My Badges" section on the Student Dashboard.

### How It Works
- **Mock Logic:**
  - All leaderboard and badge logic is implemented in `src/services/mockData.ts` using a mutable in-memory user list.
  - Functions:
    - `getResponsibleLeaderboard()`: Returns a sorted list of users for the leaderboard.
    - `getUserBadges(userId)`: Returns a string array of badge names for a user.
    - `updateUserStats(userId, outcome)`: Updates user stats and assigns badges based on reservation outcomes.
- **UI Integration:**
  - The Student Dashboard imports and uses these functions to display the leaderboard and badges.
  - The `Badge` component (`src/components/ui/badge.tsx`) is used for badge display.

### Customization & Extension
- To add new badges, update the `assignBadges` function in `mockData.ts`.
- To change leaderboard ranking logic, update the `getResponsibleLeaderboard` function.
- For production, replace the mock logic with real backend integration (e.g., Supabase).

### Example Usage
- The leaderboard and badges are automatically shown for all users on the Student Dashboard.
- To test, update the mock user/reservation data in `mockData.ts` or call `updateUserStats` in your app logic.

---
For more details, see the code in `src/services/mockData.ts` and `src/components/dashboard/StudentDashboard.tsx`.
