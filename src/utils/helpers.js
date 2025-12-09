// Helper functions

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const formatTime = (time) => {
  return time.substring(0, 5); // HH:MM
};

const generateQRCode = (ticketId) => {
  return `AB${ticketId.toString().slice(-6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
};

const calculateExpiry = (minutes = 5) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

const isExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  return userObj;
};

module.exports = {
  formatDate,
  formatTime,
  generateQRCode,
  calculateExpiry,
  isExpired,
  sanitizeUser
};


