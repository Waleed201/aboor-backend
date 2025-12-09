// Mock payment service
class PaymentService {
  // Process payment (mock implementation)
  async processPayment(amount, method = 'mada') {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock success (in production, this would call actual payment gateway)
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return {
      success: true,
      transactionId,
      amount,
      method,
      timestamp: new Date()
    };
  }

  // Refund payment (mock implementation)
  async refundPayment(transactionId, amount) {
    // Simulate refund processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const refundId = `REF${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return {
      success: true,
      refundId,
      originalTransactionId: transactionId,
      amount,
      timestamp: new Date()
    };
  }
}

module.exports = new PaymentService();


