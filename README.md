# Our Story - Couple's Memory & Planning App

A beautiful, intimate web application designed for couples to share memories, plan together, and express love.

## Features

🎀 **Secure Love Letters** - Exchange encrypted private messages
📝 **Shared Notes** - Collaborate on notes together
📸 **Photo Gallery** - Store and cherish your memories
💌 **Love Letter Maker** - Create beautiful letters from templates
🍽️ **Culinary Planner** - Plan meals and recipes together
✈️ **Travel Planner** - Dream and plan your adventures
🎁 **Wishlists** - Share wishes and gift ideas

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
copy .env.example .env
```

4. Update the `.env` file with your credentials

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Better-SQLite3 (local SQLite database)
- **Authentication**: Simple session-based auth
- **Encryption**: Crypto-JS for love letters

## Project Structure

```
our_story/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utilities and database
├── public/                 # Static assets
└── types/                  # TypeScript types
```

## Security Note

This is an MVP designed for personal use. For production deployment with internet access, implement:
- Proper authentication (OAuth, JWT)
- HTTPS encryption
- Secure database hosting
- Environment variable protection
- File upload validation

## License

Personal project - All rights reserved
