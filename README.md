# 🥘 HomeMunchin - Local Food Marketplace

A platform that connects individual home cooks with local consumers, enabling cooks to post available food items and consumers to place orders for pickup.

## Features

### 👩‍🍳 Cook Side
- Sign up and login (email/password authentication)
- Create and manage cook profile (name, bio, profile picture, pickup location)
- Add food listings with:
  - Title, description, price per item
  - Quantity available
  - Pickup time/date
  - Food photo
- Mark items as sold out or expired
- View and manage orders dashboard
- Update order status (Pending → Confirmed → Picked up)

### 👨‍👩‍👧‍👦 Consumer Side
- Browse available food listings
- View cook profile and listing details
- Place orders for available item(s)
- See pickup instructions (time & location)
- View order history and status
- Cancel pending orders

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (email/password)
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (local or hosted)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd HomeMunchin
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/homemunchin?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
```

4. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (or use migrations)
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Users
- `id` - Unique identifier
- `name` - User's name
- `email` - Email address (unique)
- `password_hash` - Hashed password
- `is_cook` - Boolean flag for cook accounts
- `created_at` - Timestamp

### CookProfiles
- `id` - Unique identifier
- `user_id` - Foreign key to Users
- `bio` - Cook's bio/description
- `location` - General pickup location
- `profile_picture_url` - URL to profile picture

### FoodListings
- `id` - Unique identifier
- `cook_id` - Foreign key to CookProfiles
- `title` - Listing title
- `description` - Food description
- `price` - Price per item
- `quantity_available` - Available quantity
- `image_url` - URL to food image
- `listing_date` - When listing is active
- `pickup_time` - When food can be picked up
- `pickup_location` - Specific pickup location
- `is_sold_out` - Sold out flag

### Orders
- `id` - Unique identifier
- `consumer_id` - Foreign key to Users
- `food_listing_id` - Foreign key to FoodListings
- `quantity` - Number of items ordered
- `total_price` - Total order price
- `status` - Order status (PENDING, CONFIRMED, PICKED_UP, CANCELLED)
- `created_at` - Timestamp

## Project Structure

```
HomeMunchin/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── cook/         # Cook-specific endpoints
│   │   ├── listings/     # Food listing endpoints
│   │   └── orders/       # Order endpoints
│   ├── auth/             # Authentication pages
│   ├── cook/             # Cook dashboard pages
│   ├── listings/         # Listing detail pages
│   └── orders/           # Order pages
├── components/           # React components
├── lib/                  # Utility functions
├── prisma/               # Database schema
└── types/                # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Deployment

### Database Setup
1. Set up a PostgreSQL database (Supabase, Railway, or any PostgreSQL provider)
2. Update `DATABASE_URL` in your environment variables

### Frontend/Backend Deployment
1. Deploy to Vercel (recommended for Next.js):
   - Connect your GitHub repository
   - Add environment variables
   - Deploy automatically

2. Or deploy to Railway/Render:
   - Connect your repository
   - Set up build command: `npm run build`
   - Set start command: `npm start`
   - Add environment variables

## Notes

- **Payment**: No payment integration in MVP. Payment is handled manually (cash/Venmo) between cook and consumer.
- **Image Upload**: Currently supports image URLs. For production, consider integrating with Cloudinary, AWS S3, or Supabase Storage.
- **Email Notifications**: Not implemented in MVP. Consider adding email notifications for order updates.

## License

MIT

