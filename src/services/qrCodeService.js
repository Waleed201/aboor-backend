const QRCode = require('qrcode');

/**
 * Generate QR code for ticket verification
 * @param {Object} ticketData - Ticket information
 * @returns {Promise<string>} QR code as data URI (base64 image)
 */
const generateTicketQRCode = async (ticketData) => {
  try {
    // Create verification data object
    const verificationData = {
      ticketId: ticketData._id.toString(),
      userId: ticketData.user.toString(),
      matchId: ticketData.match._id.toString(),
      seatNumber: ticketData.seatNumber,
      zone: ticketData.zone,
      area: ticketData.area,
      qrCode: ticketData.qrCode,
      bookingDate: ticketData.createdAt,
      matchDate: ticketData.match.dateTime,
      homeTeam: ticketData.match.homeTeam,
      awayTeam: ticketData.match.awayTeam,
      stadium: ticketData.match.stadium,
      verified: true
    };

    // Convert to JSON string
    const dataString = JSON.stringify(verificationData);

    // Generate QR code as data URI (PNG image encoded in base64)
    const qrCodeDataURI = await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'H', // High error correction
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataURI;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate simple QR code from string
 * @param {string} text - Text to encode in QR code
 * @returns {Promise<string>} QR code as data URI
 */
const generateSimpleQRCode = async (text) => {
  try {
    const qrCodeDataURI = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 250
    });

    return qrCodeDataURI;
  } catch (error) {
    console.error('Error generating simple QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate two QR codes for a ticket
 * @param {string} qrCode1 - First random string
 * @param {string} qrCode2 - Second random string
 * @param {string} ticketId - Ticket ID for verification
 * @returns {Promise<Object>} Object with both QR code images
 */
const generateDualQRCodes = async (qrCode1, qrCode2, ticketId) => {
  try {
    // Generate first QR code with verification data
    const data1 = JSON.stringify({
      ticketId,
      qrCode: qrCode1,
      type: 'primary',
      timestamp: Date.now()
    });

    // Generate second QR code with verification data
    const data2 = JSON.stringify({
      ticketId,
      qrCode: qrCode2,
      type: 'secondary',
      timestamp: Date.now()
    });

    // Generate both QR code images
    const qrCodeImage1 = await QRCode.toDataURL(data1, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const qrCodeImage2 = await QRCode.toDataURL(data2, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return {
      qrCodeImage1,
      qrCodeImage2
    };
  } catch (error) {
    console.error('Error generating dual QR codes:', error);
    throw new Error('Failed to generate QR codes');
  }
};

/**
 * Verify QR code data
 * @param {string} qrData - Scanned QR code data
 * @returns {Object} Parsed verification data
 */
const verifyQRCode = (qrData) => {
  try {
    const data = JSON.parse(qrData);
    
    // Validate required fields
    if (!data.ticketId || !data.userId || !data.matchId || !data.qrCode) {
      throw new Error('Invalid QR code data');
    }

    return {
      valid: true,
      data: data
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid or corrupted QR code'
    };
  }
};

module.exports = {
  generateTicketQRCode,
  generateSimpleQRCode,
  generateDualQRCodes,
  verifyQRCode
};

