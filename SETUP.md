# Aboor Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd aboor-backend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/aboor

# JWT Configuration
JWT_SECRET=your_secure_random_secret_key_here
JWT_EXPIRES_IN=24h

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@aboor.sa

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Seat Reservation Timeout (minutes)
SEAT_RESERVATION_TIMEOUT=5
```

### 3. Install and Start MongoDB

Make sure MongoDB is installed and running:

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
Start MongoDB service from Services panel or run:
```bash
net start MongoDB
```

**Or use MongoDB Atlas (Cloud):**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

### 4. Seed Database

Populate the database with initial data:

```bash
npm run seed
```

This will create:
- 4 test users (1 admin, 3 regular users)
- 5 matches with all seat zones
- Test accounts for login

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 6. Verify Installation

Visit `http://localhost:5000/health` - you should see:
```json
{
  "status": "OK",
  "message": "Aboor API is running"
}
```

## Test Accounts

After running the seed script, you can use these accounts:

**Admin Account:**
- Email: `admin@aboor.sa`
- Password: `admin123`

**User Account:**
- Email: `waleed@example.com`
- Password: `password123`

## Frontend Integration

### 1. Update Frontend API Base URL

In your React app, create an API configuration file:

```javascript
// aboor-ui/src/config/api.js
export const API_BASE_URL = 'http://localhost:5000/api';
export const WS_URL = 'http://localhost:5000';
```

### 2. Install Axios and Socket.IO Client

```bash
cd aboor-ui
npm install axios socket.io-client
```

### 3. Create API Service

```javascript
// aboor-ui/src/services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 4. Replace Hardcoded Data

**Replace MOCK_MATCHES with API call:**

```javascript
// In App.js
import { useEffect } from 'react';
import api from './services/api';

// Inside App component
const [matches, setMatches] = useState([]);

useEffect(() => {
  const fetchMatches = async () => {
    try {
      const response = await api.get('/matches');
      setMatches(response.data.matches);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    }
  };
  
  if (screen === 'matches') {
    fetchMatches();
  }
}, [screen]);
```

**Update Login Handler:**

```javascript
const handleLogin = async (identifier, password) => {
  try {
    const response = await api.post('/auth/login', {
      identifier,
      password
    });
    
    // Store token
    localStorage.setItem('token', response.data.token);
    
    // Store user
    setUser(response.data.user);
    
    setScreen("matches");
  } catch (error) {
    console.error('Login failed:', error);
    alert('Invalid credentials');
  }
};
```

**Update Booking Handler:**

```javascript
const handleBooking = async (matchId, seatInfo) => {
  try {
    // Step 1: Reserve seat
    const bookResponse = await api.post('/tickets/book', {
      matchId,
      seatInfo
    });
    
    const ticket = bookResponse.data.ticket;
    setSelectedTicket(ticket);
    
    // Show payment screen
    setScreen('payment');
    
  } catch (error) {
    console.error('Booking failed:', error);
    alert(error.response?.data?.message || 'Booking failed');
  }
};

const handlePayment = async (ticketId, paymentMethod) => {
  try {
    const response = await api.post(`/tickets/${ticketId}/payment`, {
      paymentMethod
    });
    
    setScreen('success');
  } catch (error) {
    console.error('Payment failed:', error);
    alert(error.response?.data?.message || 'Payment failed');
  }
};
```

### 5. Add WebSocket for Real-time Updates

```javascript
// aboor-ui/src/services/socket.js
import io from 'socket.io-client';
import { WS_URL } from '../config/api';

let socket = null;

export const connectSocket = () => {
  socket = io(WS_URL);
  
  socket.on('connect', () => {
    console.log('WebSocket connected');
  });
  
  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });
  
  return socket;
};

export const joinMatch = (matchId) => {
  if (socket) {
    socket.emit('join:match', matchId);
  }
};

export const leaveMatch = (matchId) => {
  if (socket) {
    socket.emit('leave:match', matchId);
  }
};

export const onSeatUpdate = (callback) => {
  if (socket) {
    socket.on('seat:reserved', callback);
    socket.on('seat:booked', callback);
    socket.on('seat:released', callback);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
```

**Use WebSocket in Match Details Screen:**

```javascript
import { useEffect } from 'react';
import { connectSocket, joinMatch, leaveMatch, onSeatUpdate } from './services/socket';

// Inside MatchDetailsScreen component
useEffect(() => {
  const socket = connectSocket();
  
  if (match?._id) {
    joinMatch(match._id);
    
    onSeatUpdate((data) => {
      console.log('Seat updated:', data);
      // Refresh seat availability
    });
  }
  
  return () => {
    if (match?._id) {
      leaveMatch(match._id);
    }
  };
}, [match]);
```

## Production Deployment

### 1. Environment Variables

Update production `.env`:
- Use strong `JWT_SECRET`
- Use production MongoDB URL
- Update `FRONTEND_URL` to production domain
- Configure production email service

### 2. Build and Deploy

```bash
# Set production environment
export NODE_ENV=production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name aboor-backend

# Or use Docker
docker build -t aboor-backend .
docker run -p 5000:5000 --env-file .env aboor-backend
```

### 3. Security Checklist

- [ ] Change default JWT secret
- [ ] Enable HTTPS
- [ ] Setup rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Setup proper logging
- [ ] Implement API rate limiting
- [ ] Add input sanitization
- [ ] Setup monitoring (PM2, New Relic, etc.)

## Troubleshooting

### MongoDB Connection Issues

**Error: `connect ECONNREFUSED 127.0.0.1:27017`**

Solution:
1. Ensure MongoDB is running: `brew services list` (macOS) or `sudo systemctl status mongod` (Linux)
2. Check MongoDB URI in `.env`
3. Try restarting MongoDB

### Port Already in Use

**Error: `Port 5000 is already in use`**

Solution:
1. Change PORT in `.env` to another port (e.g., 5001)
2. Or kill the process using port 5000:
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Email Sending Issues

If emails are not sending:
1. Check email configuration in `.env`
2. For Gmail, enable "Less secure app access" or use App Password
3. Verify EMAIL_USER and EMAIL_PASSWORD are correct
4. The app will continue to work without email (just won't send notifications)

### WebSocket Connection Issues

If WebSocket doesn't connect:
1. Check CORS configuration in `src/websocket/seatSocket.js`
2. Verify `FRONTEND_URL` in `.env` matches your React app URL
3. Check browser console for connection errors

## API Testing

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "0500000000",
    "nationalId": "1234567890",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "waleed@example.com",
    "password": "password123"
  }'
```

**Get Matches:**
```bash
curl http://localhost:5000/api/matches
```

### Using Postman

1. Import the API endpoints from `docs/api-documentation.md`
2. Create an environment variable for `baseUrl` = `http://localhost:5000/api`
3. Create an environment variable for `token` after login
4. Use `{{baseUrl}}` and `Bearer {{token}}` in requests

## Development Tips

1. **Hot Reload**: Using `nodemon` for automatic server restart on file changes
2. **Logging**: Check console for request logs in development mode
3. **Database GUI**: Use MongoDB Compass to view/edit data
4. **API Testing**: Use Postman or Thunder Client (VS Code extension)
5. **WebSocket Testing**: Use Socket.IO client tester online tools

## Support

For issues or questions:
1. Check the API documentation in `docs/api-documentation.md`
2. Review error messages in console
3. Check MongoDB logs
4. Verify environment variables

## Next Steps

1. ✅ Backend is complete and running
2. Integrate with frontend (see Frontend Integration section)
3. Test all features end-to-end
4. Configure email service (optional)
5. Deploy to production

Happy coding! 🚀


