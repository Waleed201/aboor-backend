# Frontend Integration Checklist

Complete guide to integrate the Aboor backend with the existing React frontend.

## Prerequisites

- ✅ Backend server running on `http://localhost:5000`
- ✅ Database seeded with test data
- ✅ Frontend running on `http://localhost:3000`

## Step-by-Step Integration

### Step 1: Install Required Packages

```bash
cd aboor-ui
npm install axios socket.io-client
```

### Step 2: Create API Configuration

Create `src/config/api.js`:

```javascript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
```

### Step 3: Create API Service

Create `src/services/api.js`:

```javascript
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aboor_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('aboor_token');
      localStorage.removeItem('aboor_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 4: Create WebSocket Service

Create `src/services/socket.js`:

```javascript
import io from 'socket.io-client';
import { WS_URL } from '../config/api';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinMatch(matchId) {
    if (this.socket) {
      this.socket.emit('join:match', matchId);
      console.log(`👥 Joined match room: ${matchId}`);
    }
  }

  leaveMatch(matchId) {
    if (this.socket) {
      this.socket.emit('leave:match', matchId);
      console.log(`👋 Left match room: ${matchId}`);
    }
  }

  onSeatReserved(callback) {
    if (this.socket) {
      this.socket.on('seat:reserved', callback);
    }
  }

  onSeatBooked(callback) {
    if (this.socket) {
      this.socket.on('seat:booked', callback);
    }
  }

  onSeatReleased(callback) {
    if (this.socket) {
      this.socket.on('seat:released', callback);
    }
  }

  onSeatsUpdated(callback) {
    if (this.socket) {
      this.socket.on('seats:updated', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();
```

### Step 5: Update App.js

Replace the hardcoded data and state management with API calls:

```javascript
import React, { useState, useEffect } from "react";
import "./index.css";
import api from './services/api';
import socketService from './services/socket';

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [seatInfo, setSeatInfo] = useState({ zone: "", areaNumber: "" });
  const [tickets, setTickets] = useState([]);
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('aboor_token');
    const savedUser = localStorage.getItem('aboor_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      socketService.connect();
    }
  }, []);

  // Fetch matches when needed
  useEffect(() => {
    if (screen === 'matches' && user) {
      fetchMatches();
    }
  }, [screen, user]);

  // Fetch user tickets
  useEffect(() => {
    if (screen === 'myTickets' && user) {
      fetchUserTickets();
    }
  }, [screen, user]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/matches?status=upcoming');
      setMatches(response.data.matches);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      alert('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/tickets');
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      alert('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (identifier, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', {
        identifier,
        password
      });

      // Save token and user
      localStorage.setItem('aboor_token', response.data.token);
      localStorage.setItem('aboor_user', JSON.stringify(response.data.user));
      setUser(response.data.user);

      // Connect WebSocket
      socketService.connect();

      setScreen("matches");
    } catch (error) {
      console.error('Login failed:', error);
      alert(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    socketService.joinMatch(match._id);
    setScreen("matchDetails");
  };

  const handleGoConfirm = () => {
    if (!seatInfo.zone || !seatInfo.areaNumber) {
      alert('Please select a seat zone and area number');
      return;
    }
    setScreen("confirm");
  };

  const handleConfirmBooking = async () => {
    try {
      setLoading(true);
      const response = await api.post('/tickets/book', {
        matchId: selectedMatch._id,
        seatInfo
      });

      setSelectedTicket(response.data.ticket);
      setScreen("payment");
    } catch (error) {
      console.error('Booking failed:', error);
      alert(error.response?.data?.message || 'Failed to book ticket');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/tickets/${selectedTicket._id}/payment`, {
        paymentMethod: 'mada'
      });

      // Update ticket with confirmed booking
      setSelectedTicket(response.data.ticket);
      setScreen("success");
    } catch (error) {
      console.error('Payment failed:', error);
      alert(error.response?.data?.message || 'Payment processing failed');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aboor_token');
    localStorage.removeItem('aboor_user');
    setUser(null);
    setTickets([]);
    setMatches([]);
    socketService.disconnect();
    setScreen("landing");
  };

  // Rest of your component remains the same...
  // Just pass handleLogin to NafathLoginScreen with identifier parameter
  
  return (
    <div className="app-root">
      {/* Your existing JSX */}
    </div>
  );
}
```

### Step 6: Update NafathLoginScreen

Modify the login screen to capture identifier and password:

```javascript
function NafathLoginScreen({ onLogin, onBack }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (!identifier || !password) {
      alert('Please enter your credentials');
      return;
    }
    onLogin(identifier, password);
  };

  return (
    <div className="screen nafath-screen">
      <button className="nafath-back" onClick={onBack}>
        ← العودة
      </button>
      <div className="nafath-card">
        <div className="nafath-header">
          <div className="nafath-logo-word">نفاذ</div>
          <div className="nafath-subtitle">النفاذ الوطني الموحد</div>
          <p>مرحباً بك في منصة عبور</p>
        </div>
        <div className="nafath-section-title">الدخول</div>
        
        <label className="nafath-label">البريد الإلكتروني أو رقم الهوية *</label>
        <input
          type="text"
          className="nafath-input"
          placeholder="أدخل البريد الإلكتروني أو رقم الهوية"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <label className="nafath-label">كلمة المرور *</label>
        <input
          type="password"
          className="nafath-input"
          placeholder="أدخل كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="nafath-login-button" onClick={handleSubmit}>
          تسجيل الدخول
        </button>

        <div className="nafath-test-accounts" style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
          <p>حسابات تجريبية:</p>
          <p>Email: waleed@example.com | Password: password123</p>
        </div>
      </div>
    </div>
  );
}
```

### Step 7: Update Match Display

Ensure matches display correctly with the new data structure:

```javascript
function MatchListScreen({ matches, onSelectMatch }) {
  return (
    <div className="screen">
      <h2 className="screen-title">المباريات المتاحة</h2>
      {matches.length === 0 ? (
        <p className="hint-text">لا توجد مباريات متاحة حالياً</p>
      ) : (
        <div className="match-list">
          {matches.map((match) => (
            <button
              key={match._id}
              className="match-card"
              onClick={() => onSelectMatch(match)}
            >
              {match.time && (
                <div className="match-time">{match.time}</div>
              )}
              <div className="match-card-content">
                <div className="match-team-section">
                  <img 
                    src={match.homeTeamLogo} 
                    alt={match.homeTeam}
                    className="team-logo"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/100x100/667eea/ffffff?text=${encodeURIComponent(match.homeTeamIcon)}`;
                    }}
                  />
                  <div className="team-name">{match.homeTeam}</div>
                </div>
                
                <div className="match-vs-section">
                  <div className="vs-text">VS</div>
                </div>
                
                <div className="match-team-section">
                  <img 
                    src={match.awayTeamLogo} 
                    alt={match.awayTeam}
                    className="team-logo"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/100x100/667eea/ffffff?text=${encodeURIComponent(match.awayTeamIcon)}`;
                    }}
                  />
                  <div className="team-name">{match.awayTeam}</div>
                </div>
              </div>
              <div className="match-meta">
                <span>{new Date(match.date).toLocaleDateString('ar-SA')}</span>
                <span>{match.stadium}</span>
                <span>{match.availableSeats} مقعد متاح</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 8: Add Real-time Updates to Match Details

```javascript
function MatchDetailsScreen({ match, seatInfo, onSeatChange, onNext, onBack }) {
  const [availableSeats, setAvailableSeats] = useState(match?.availableSeats || 0);

  useEffect(() => {
    if (match?._id) {
      // Join match room for real-time updates
      socketService.joinMatch(match._id);

      // Listen for seat updates
      socketService.onSeatsUpdated(() => {
        // Refresh available seats
        console.log('Seats updated, refreshing...');
        // Could refetch match details here
      });

      return () => {
        socketService.leaveMatch(match._id);
        socketService.removeAllListeners();
      };
    }
  }, [match]);

  // Rest of your component...
}
```

### Step 9: Update Environment Variables

Create `.env` in `aboor-ui/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=http://localhost:5000
```

### Step 10: Test the Integration

1. **Start Backend:**
```bash
cd aboor-backend
npm run dev
```

2. **Start Frontend:**
```bash
cd aboor-ui
npm start
```

3. **Test Login:**
   - Email: `waleed@example.com`
   - Password: `password123`

4. **Test Features:**
   - ✅ View matches
   - ✅ Select a match
   - ✅ Choose seat zone and area
   - ✅ Book ticket (creates reservation)
   - ✅ Process payment (confirms booking)
   - ✅ View tickets
   - ✅ Real-time seat updates
   - ✅ Cancel ticket

## Common Issues and Solutions

### CORS Errors

If you see CORS errors in console:
1. Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
2. Check CORS configuration in `src/app.js` and `src/websocket/seatSocket.js`

### Token Expiration

Tokens expire after 24 hours. To handle:
1. Check for 401 errors in axios interceptor
2. Redirect to login when token expires
3. Clear localStorage

### WebSocket Not Connecting

1. Check WebSocket URL in frontend config
2. Verify backend WebSocket is initialized
3. Check browser console for connection errors

### Matches Not Loading

1. Verify backend is running
2. Check network tab in browser dev tools
3. Ensure user is logged in (token in localStorage)

## Production Checklist

- [ ] Update API URLs to production endpoints
- [ ] Enable HTTPS
- [ ] Configure production CORS
- [ ] Setup error tracking (Sentry, etc.)
- [ ] Add loading states
- [ ] Add proper error messages
- [ ] Test all user flows
- [ ] Optimize images
- [ ] Add retry logic for failed requests
- [ ] Implement proper token refresh

## Additional Features to Consider

1. **Auto-refresh**: Refresh matches and tickets periodically
2. **Notifications**: Show toast notifications for booking confirmations
3. **Loading States**: Add spinners for all async operations
4. **Error Boundaries**: Catch and display React errors gracefully
5. **Offline Support**: Handle network errors gracefully
6. **Countdown Timer**: Show countdown for seat reservations
7. **Search/Filter**: Add match search and filtering
8. **Booking History**: Show past bookings

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify API endpoints in `docs/api-documentation.md`
4. Test API endpoints directly with curl or Postman

Happy integrating! 🎉


