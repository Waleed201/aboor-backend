# Aboor API Documentation

Version: 1.0.0  
Base URL: `http://localhost:5000/api`

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Matches](#matches)
4. [Tickets](#tickets)
5. [Admin](#admin)
6. [WebSocket Events](#websocket-events)
7. [Error Responses](#error-responses)

---

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "وليد الزهراني",
  "email": "waleed@example.com",
  "phone": "0500000000",
  "nationalId": "1234567890",
  "password": "password123",
  "favoriteTeam": "الاتفاق"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64abc123def456789",
    "name": "وليد الزهراني",
    "email": "waleed@example.com",
    "phone": "0500000000",
    "nationalId": "1234567890",
    "favoriteTeam": "الاتفاق",
    "role": "user",
    "createdAt": "2025-12-08T10:00:00.000Z"
  }
}
```

### Login

**POST** `/auth/login`

Login with email or national ID.

**Request Body:**
```json
{
  "identifier": "waleed@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64abc123def456789",
    "name": "وليد الزهراني",
    "email": "waleed@example.com",
    "phone": "0500000000",
    "nationalId": "1234567890",
    "favoriteTeam": "الاتفاق",
    "role": "user",
    "createdAt": "2025-12-08T10:00:00.000Z"
  }
}
```

### Get Current User

**GET** `/auth/me`

Get the current authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "64abc123def456789",
    "name": "وليد الزهراني",
    "email": "waleed@example.com",
    "phone": "0500000000",
    "nationalId": "1234567890",
    "favoriteTeam": "الاتفاق",
    "role": "user",
    "createdAt": "2025-12-08T10:00:00.000Z"
  }
}
```

---

## Users

### Get User Profile

**GET** `/users/profile`

Get the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "64abc123def456789",
    "name": "وليد الزهراني",
    "email": "waleed@example.com",
    "phone": "0500000000",
    "nationalId": "1234567890",
    "favoriteTeam": "الاتفاق",
    "role": "user",
    "createdAt": "2025-12-08T10:00:00.000Z"
  }
}
```

### Update User Profile

**PUT** `/users/profile`

Update the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Waleed Alzahrani",
  "phone": "0501234567",
  "favoriteTeam": "الهلال"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "64abc123def456789",
    "name": "Waleed Alzahrani",
    "email": "waleed@example.com",
    "phone": "0501234567",
    "nationalId": "1234567890",
    "favoriteTeam": "الهلال",
    "role": "user",
    "createdAt": "2025-12-08T10:00:00.000Z"
  }
}
```

### Get User's Tickets

**GET** `/users/tickets`

Get all tickets for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 2,
  "tickets": [
    {
      "_id": "64def123abc456789",
      "userId": "64abc123def456789",
      "matchId": {
        "_id": "64match123",
        "homeTeam": "الأهلي",
        "awayTeam": "الهلال",
        "date": "2026-02-17T00:00:00.000Z",
        "time": "21:00",
        "stadium": "Red Arena",
        "basePrice": 50
      },
      "seatInfo": {
        "zone": "Red",
        "areaNumber": "105"
      },
      "price": 50,
      "status": "active",
      "paymentStatus": "completed",
      "qrCode": "AB456789ABC123",
      "bookingDate": "2025-12-08T10:00:00.000Z"
    }
  ]
}
```

---

## Matches

### Get All Matches

**GET** `/matches`

Get all matches with optional filters.

**Query Parameters:**
- `team` (optional): Filter by team name
- `stadium` (optional): Filter by stadium
- `status` (optional): Filter by status (upcoming, completed, cancelled)
- `startDate` (optional): Filter matches after this date
- `endDate` (optional): Filter matches before this date

**Example:** `/matches?status=upcoming&team=الهلال`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 3,
  "matches": [
    {
      "_id": "64match123",
      "homeTeam": "الأهلي",
      "homeTeamIcon": "🟢",
      "homeTeamLogo": "/Alahli.png",
      "awayTeam": "الهلال",
      "awayTeamIcon": "🌙",
      "awayTeamLogo": "/alhilal.png",
      "date": "2026-02-17T00:00:00.000Z",
      "time": "21:00",
      "stadium": "Red Arena",
      "basePrice": 50,
      "status": "upcoming",
      "totalSeats": 385,
      "availableSeats": 380,
      "createdAt": "2025-12-08T10:00:00.000Z",
      "updatedAt": "2025-12-08T10:00:00.000Z"
    }
  ]
}
```

### Get Single Match

**GET** `/matches/:id`

Get detailed information about a specific match including available seats by zone.

**Response:** `200 OK`
```json
{
  "success": true,
  "match": {
    "_id": "64match123",
    "homeTeam": "الأهلي",
    "homeTeamIcon": "🟢",
    "homeTeamLogo": "/Alahli.png",
    "awayTeam": "الهلال",
    "awayTeamIcon": "🌙",
    "awayTeamLogo": "/alhilal.png",
    "date": "2026-02-17T00:00:00.000Z",
    "time": "21:00",
    "stadium": "Red Arena",
    "basePrice": 50,
    "status": "upcoming",
    "totalSeats": 385,
    "availableSeats": 380
  },
  "availableSeatsByZone": [
    { "_id": "Red", "count": 55 },
    { "_id": "Blue", "count": 54 },
    { "_id": "Green", "count": 55 }
  ]
}
```

### Create Match (Admin Only)

**POST** `/matches`

Create a new match. Requires admin authentication.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "homeTeam": "النصر",
  "homeTeamIcon": "🟡",
  "homeTeamLogo": "/Al-Nassr.png",
  "awayTeam": "الشباب",
  "awayTeamIcon": "⚡",
  "awayTeamLogo": "/AlShabab.png",
  "date": "2026-04-10",
  "time": "19:00",
  "stadium": "Blue Arena",
  "basePrice": 60
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Match created successfully",
  "match": {
    "_id": "64match456",
    "homeTeam": "النصر",
    "awayTeam": "الشباب",
    "date": "2026-04-10T00:00:00.000Z",
    "time": "19:00",
    "stadium": "Blue Arena",
    "basePrice": 60,
    "status": "upcoming",
    "totalSeats": 385,
    "availableSeats": 385
  }
}
```

### Update Match (Admin Only)

**PUT** `/matches/:id`

Update an existing match.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "basePrice": 70,
  "status": "upcoming"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Match updated successfully",
  "match": {
    "_id": "64match456",
    "homeTeam": "النصر",
    "awayTeam": "الشباب",
    "basePrice": 70,
    "status": "upcoming"
  }
}
```

### Delete Match (Admin Only)

**DELETE** `/matches/:id`

Delete a match and all associated seats.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Match deleted successfully"
}
```

---

## Tickets

### Book Ticket

**POST** `/tickets/book`

Reserve a seat for a match. Reservation is held for 5 minutes.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "matchId": "64match123",
  "seatInfo": {
    "zone": "Red",
    "areaNumber": "105"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Seat reserved successfully. Complete payment within 5 minutes.",
  "ticket": {
    "_id": "64ticket123",
    "userId": "64abc123def456789",
    "matchId": {
      "_id": "64match123",
      "homeTeam": "الأهلي",
      "awayTeam": "الهلال",
      "date": "2026-02-17T00:00:00.000Z",
      "stadium": "Red Arena"
    },
    "seatInfo": {
      "zone": "Red",
      "areaNumber": "105"
    },
    "price": 50,
    "status": "reserved",
    "paymentStatus": "pending",
    "reservedUntil": "2025-12-08T10:05:00.000Z"
  },
  "reservedUntil": "2025-12-08T10:05:00.000Z"
}
```

### Get Ticket Details

**GET** `/tickets/:id`

Get details of a specific ticket.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "ticket": {
    "_id": "64ticket123",
    "userId": {
      "_id": "64abc123def456789",
      "name": "وليد الزهراني",
      "email": "waleed@example.com"
    },
    "matchId": {
      "_id": "64match123",
      "homeTeam": "الأهلي",
      "awayTeam": "الهلال",
      "date": "2026-02-17T00:00:00.000Z"
    },
    "seatInfo": {
      "zone": "Red",
      "areaNumber": "105"
    },
    "price": 50,
    "status": "active",
    "paymentStatus": "completed",
    "qrCode": "AB123456XYZ789"
  }
}
```

### Process Payment

**POST** `/tickets/:id/payment`

Process payment and confirm booking.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "paymentMethod": "mada"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Payment successful. Booking confirmed!",
  "ticket": {
    "_id": "64ticket123",
    "status": "active",
    "paymentStatus": "completed",
    "qrCode": "AB123456XYZ789"
  },
  "payment": {
    "transactionId": "TXN1733654400ABC123",
    "amount": 50,
    "method": "mada"
  }
}
```

### Cancel Ticket

**PUT** `/tickets/:id/cancel`

Cancel a ticket and release the seat.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Ticket cancelled successfully",
  "ticket": {
    "_id": "64ticket123",
    "status": "cancelled",
    "paymentStatus": "refunded"
  }
}
```

---

## Admin

All admin routes require authentication with admin role.

### Get All Bookings

**GET** `/admin/bookings`

Get all bookings with filters and pagination.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `status` (optional): Filter by status
- `matchId` (optional): Filter by match
- `userId` (optional): Filter by user
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "totalPages": 8,
  "tickets": [
    {
      "_id": "64ticket123",
      "userId": {
        "name": "وليد الزهراني",
        "email": "waleed@example.com"
      },
      "matchId": {
        "homeTeam": "الأهلي",
        "awayTeam": "الهلال"
      },
      "status": "active",
      "price": 50
    }
  ]
}
```

### Get Analytics

**GET** `/admin/analytics`

Get booking analytics and statistics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "analytics": {
    "bookings": {
      "total": 150,
      "byStatus": [
        { "_id": "active", "count": 120 },
        { "_id": "cancelled", "count": 20 },
        { "_id": "used", "count": 10 }
      ]
    },
    "revenue": {
      "total": 7500,
      "currency": "SAR"
    },
    "popularMatches": [
      {
        "_id": {
          "homeTeam": "الأهلي",
          "awayTeam": "الهلال"
        },
        "ticketsSold": 50,
        "revenue": 2500
      }
    ],
    "recentBookings": [...],
    "users": {
      "total": 200,
      "active": 195
    }
  }
}
```

### Update Ticket Status

**PUT** `/admin/tickets/:id/status`

Update ticket status.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "used"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Ticket status updated successfully",
  "ticket": {
    "_id": "64ticket123",
    "status": "used"
  }
}
```

### Get All Users

**GET** `/admin/users`

Get all users with pagination.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `role` (optional): Filter by role
- `isActive` (optional): Filter by active status
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 20,
  "total": 200,
  "page": 1,
  "totalPages": 10,
  "users": [
    {
      "_id": "64abc123",
      "name": "وليد الزهراني",
      "email": "waleed@example.com",
      "role": "user",
      "isActive": true
    }
  ]
}
```

---

## WebSocket Events

Connect to WebSocket: `ws://localhost:5000`

### Client -> Server Events

#### Join Match Room
```javascript
socket.emit('join:match', matchId);
```

#### Leave Match Room
```javascript
socket.emit('leave:match', matchId);
```

#### Check Seat Availability
```javascript
socket.emit('seat:check', {
  matchId: '64match123',
  zone: 'Red',
  areaNumber: '105'
});
```

#### Get Available Seats
```javascript
socket.emit('seats:getAvailable', {
  matchId: '64match123',
  zone: 'Red' // optional
});
```

### Server -> Client Events

#### Seat Status Response
```javascript
socket.on('seat:status', (data) => {
  // data: { matchId, zone, areaNumber, isAvailable }
});
```

#### Seat Reserved
```javascript
socket.on('seat:reserved', (data) => {
  // data: { matchId, zone, areaNumber, userId, timestamp }
});
```

#### Seat Booked (Confirmed)
```javascript
socket.on('seat:booked', (data) => {
  // data: { matchId, zone, areaNumber, ticketId, timestamp }
});
```

#### Seat Released
```javascript
socket.on('seat:released', (data) => {
  // data: { matchId, zone, areaNumber, timestamp }
});
```

#### Seats Updated
```javascript
socket.on('seats:updated', (data) => {
  // data: { matchId, timestamp }
});
```

#### Available Seats Response
```javascript
socket.on('seats:available', (data) => {
  // data: { matchId, zone, seats: [{ zone, areaNumber }] }
});
```

#### Error
```javascript
socket.on('seat:error', (data) => {
  // data: { message }
});
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error or invalid request
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Example Error Responses

**Validation Error:**
```json
{
  "error": "Validation Error",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

**Authentication Error:**
```json
{
  "error": "Not authorized",
  "message": "Invalid token"
}
```

**Resource Not Found:**
```json
{
  "error": "Match not found"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing rate limiting to prevent abuse.

## Authentication Flow

1. Register or login to receive JWT token
2. Include token in Authorization header for all protected routes
3. Token expires after 24 hours (configurable)
4. Upon expiration, user must login again

## Best Practices

1. Always validate user input on the client side before sending requests
2. Handle WebSocket disconnections and reconnect automatically
3. Implement proper error handling for all API calls
4. Store JWT tokens securely (httpOnly cookies in production)
5. Refresh seat availability periodically when viewing match details
6. Show countdown timer for reserved seats (5 minutes)

---

For support or questions, please contact the development team.


