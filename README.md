# Profi Annual Planning 2026🇰🇷

A simple web-based game for 10 teams exploring Busan. Teams complete tasks, check them off, and upload photo proof.

## Features

- **Team Login**: 10 pre-configured teams.
- **Task Categories**:
  - 🛒 Market Food Mission
  - 🔍 Cultural Search Mission
  - 📸 Creative Photo Mission
  - 🎮 Traditional Game Challenge
- **Task Management**:
  - Checkbox to mark completion.
  - "i" icon to view detailed task descriptions.
  - Photo upload for proof.
- **Progress Tracking**: Real-time progress bar and completion count.
- **Persistence**: Data is saved to `db.json` (local file).

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the development server**:
    ```bash
    npm run dev
    ```

3.  **Open the game**:
    Navigate to [http://localhost:3000](http://localhost:3000).

## Login Credentials

There are 10 teams (`team1` to `team10`).
The default password format is `busan` + team number.

- **Team 1**: ID: `team1`, Password: `busan1`
- **Team 2**: ID: `team2`, Password: `busan2`
- ...
- **Team 10**: ID: `team10`, Password: `busan10`

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript
