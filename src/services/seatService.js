const Seat = require('../models/Seat');
const Match = require('../models/Match');

class SeatService {
  // Check if seat is available
  async isSeatAvailable(matchId, zone, areaNumber) {
    const seat = await Seat.findOne({ matchId, zone, areaNumber });
    
    if (!seat) {
      throw new Error('Seat not found');
    }

    // Check if reservation is expired
    if (seat.isReservationExpired()) {
      await this.releaseSeat(matchId, zone, areaNumber);
      return true;
    }

    return seat.isAvailable;
  }

  // Reserve seat temporarily
  async reserveSeat(matchId, zone, areaNumber, userId) {
    const seat = await Seat.findOne({ matchId, zone, areaNumber });

    if (!seat) {
      throw new Error('Seat not found');
    }

    // Check if seat is available or reservation expired
    if (!seat.isAvailable) {
      if (seat.isReservationExpired()) {
        // Release expired reservation
        seat.release();
      } else {
        throw new Error('Seat is already reserved or booked');
      }
    }

    // Reserve seat for 5 minutes
    seat.reserve(userId, parseInt(process.env.SEAT_RESERVATION_TIMEOUT) || 5);
    await seat.save();

    // Update match available seats count
    await this.updateMatchSeatsCount(matchId);

    return seat;
  }

  // Confirm seat booking
  async confirmBooking(matchId, zone, areaNumber, ticketId) {
    const seat = await Seat.findOne({ matchId, zone, areaNumber });

    if (!seat) {
      throw new Error('Seat not found');
    }

    if (seat.isAvailable) {
      throw new Error('Seat is not reserved');
    }

    seat.confirmBooking(ticketId);
    await seat.save();

    return seat;
  }

  // Release seat
  async releaseSeat(matchId, zone, areaNumber) {
    const seat = await Seat.findOne({ matchId, zone, areaNumber });

    if (!seat) {
      throw new Error('Seat not found');
    }

    seat.release();
    await seat.save();

    // Update match available seats count
    await this.updateMatchSeatsCount(matchId);

    return seat;
  }

  // Release all expired reservations
  async releaseExpiredReservations() {
    const releasedCount = await Seat.releaseExpiredReservations();
    
    if (releasedCount > 0) {
      console.log(`Released ${releasedCount} expired seat reservations`);
    }

    return releasedCount;
  }

  // Update match available seats count
  async updateMatchSeatsCount(matchId) {
    const availableCount = await Seat.countDocuments({
      matchId,
      isAvailable: true
    });

    await Match.findByIdAndUpdate(matchId, {
      availableSeats: availableCount
    });
  }

  // Get available seats for a match
  async getAvailableSeats(matchId, zone = null) {
    const query = { matchId, isAvailable: true };
    if (zone) {
      query.zone = zone;
    }

    const seats = await Seat.find(query).select('zone areaNumber');
    return seats;
  }
}

module.exports = new SeatService();


