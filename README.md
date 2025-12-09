# Aboor Backend API

Backend API for Aboor - Saudi Football Ticket Booking Platform

## Features

- JWT Authentication
- Match Management (CRUD)
- Ticket Booking System with Seat Reservation
- Real-time Seat Availability (WebSocket)
- **Real QR Code Generation** - Scannable QR codes for every ticket
- **QR Code Verification API** - Validate tickets at stadium entrance
- Email Notifications
- Admin Panel APIs
- MongoDB Database

## Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Email**: Nodemailer
- **Validation**: Express-validator
- **QR Codes**: qrcode (generates base64 PNG images)

## Prerequisites

- Node.js (v20.11.1 or higher)
- MongoDB (v6.0 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
   - Set `MONGODB_URI` to your MongoDB connection string
   - Set `JWT_SECRET` to a secure random string
   - Configure email settings if using email notifications

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Seed Database
```bash
npm run seed
```

## API Documentation

See [API Documentation](./docs/api-documentation.md) for detailed endpoint information.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/tickets` - Get user tickets

### Matches
- `GET /api/matches` - List all matches
- `GET /api/matches/:id` - Get match details
- `POST /api/matches` - Create match (Admin)
- `PUT /api/matches/:id` - Update match (Admin)
- `DELETE /api/matches/:id` - Delete match (Admin)

### Tickets
- `POST /api/tickets/book` - Book a ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id/cancel` - Cancel ticket
- `POST /api/tickets/:id/payment` - Process payment

### Admin
- `GET /api/admin/bookings` - List all bookings
- `GET /api/admin/analytics` - Get analytics
- `PUT /api/admin/tickets/:id/status` - Update ticket status
- `GET /api/admin/users` - List all users

## WebSocket Events

- `seat:check` - Check seat availability
- `seat:reserved` - Seat temporarily held
- `seat:booked` - Seat confirmed
- `seat:released` - Seat becomes available

## Project Structure

```
aboor-backend/
├── src/
│   ├── config/         # Configuration files
│   ├── models/         # Database models
│   ├── controllers/    # Route controllers
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic services
│   ├── websocket/      # WebSocket handlers
│   ├── utils/          # Utility functions
│   └── app.js          # Express app setup
├── docs/               # API documentation
├── .env.example        # Environment variables template
├── .gitignore
├── package.json
└── server.js           # Entry point
```

## Environment Variables

See `.env.example` for all available environment variables.

## License

ISC


