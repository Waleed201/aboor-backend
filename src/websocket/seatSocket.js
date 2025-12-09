const { Server } = require('socket.io');
const seatService = require('../services/seatService');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join match room
    socket.on('join:match', (matchId) => {
      socket.join(`match:${matchId}`);
      console.log(`👥 Client ${socket.id} joined match room: ${matchId}`);
    });

    // Leave match room
    socket.on('leave:match', (matchId) => {
      socket.leave(`match:${matchId}`);
      console.log(`👋 Client ${socket.id} left match room: ${matchId}`);
    });

    // Check seat availability
    socket.on('seat:check', async ({ matchId, zone, areaNumber }) => {
      try {
        const isAvailable = await seatService.isSeatAvailable(matchId, zone, areaNumber);
        socket.emit('seat:status', { matchId, zone, areaNumber, isAvailable });
      } catch (error) {
        socket.emit('seat:error', { message: error.message });
      }
    });

    // Get all available seats for a match
    socket.on('seats:getAvailable', async ({ matchId, zone }) => {
      try {
        const seats = await seatService.getAvailableSeats(matchId, zone);
        socket.emit('seats:available', { matchId, zone, seats });
      } catch (error) {
        socket.emit('seat:error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Cleanup expired reservations every minute
  setInterval(async () => {
    try {
      const releasedCount = await seatService.releaseExpiredReservations();
      if (releasedCount > 0) {
        // Notify all connected clients about released seats
        // In production, you'd want to be more specific about which matches
        io.emit('seats:updated');
      }
    } catch (error) {
      console.error('Error releasing expired reservations:', error);
    }
  }, 60000); // Run every minute

  console.log('✅ WebSocket initialized');
  return io;
};

// Emit events from other parts of the application
const emitSeatReserved = (matchId, zone, areaNumber, userId) => {
  if (io) {
    io.to(`match:${matchId}`).emit('seat:reserved', {
      matchId,
      zone,
      areaNumber,
      userId,
      timestamp: new Date()
    });
  }
};

const emitSeatBooked = (matchId, zone, areaNumber, ticketId) => {
  if (io) {
    io.to(`match:${matchId}`).emit('seat:booked', {
      matchId,
      zone,
      areaNumber,
      ticketId,
      timestamp: new Date()
    });
  }
};

const emitSeatReleased = (matchId, zone, areaNumber) => {
  if (io) {
    io.to(`match:${matchId}`).emit('seat:released', {
      matchId,
      zone,
      areaNumber,
      timestamp: new Date()
    });
  }
};

const emitSeatsUpdated = (matchId) => {
  if (io) {
    io.to(`match:${matchId}`).emit('seats:updated', {
      matchId,
      timestamp: new Date()
    });
  }
};

module.exports = {
  initializeSocket,
  emitSeatReserved,
  emitSeatBooked,
  emitSeatReleased,
  emitSeatsUpdated
};


