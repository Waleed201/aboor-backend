const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
require('dotenv').config();

/**
 * Fix duplicate QR codes in the database
 * This script regenerates QR codes for all tickets to ensure uniqueness
 */

async function fixDuplicateQRCodes() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all tickets
    const tickets = await Ticket.find({});
    console.log(`📋 Found ${tickets.length} tickets in database`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const ticket of tickets) {
      try {
        // Generate new unique QR codes
        const ticketId = ticket._id.toString();
        const timestamp = Date.now().toString(36).toUpperCase();
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        
        const randomPart1 = Array.from({ length: 12 }, () => 
          characters.charAt(Math.floor(Math.random() * characters.length))
        ).join('');
        
        const randomPart2 = Array.from({ length: 12 }, () => 
          characters.charAt(Math.floor(Math.random() * characters.length))
        ).join('');
        
        const idSuffix = ticketId.slice(-4).toUpperCase();
        
        // Generate new unique codes
        const newQrCode1 = `1${timestamp}${randomPart1}${idSuffix}`;
        const newQrCode2 = `2${timestamp}${randomPart2}${idSuffix}`;
        
        // Update ticket
        ticket.qrCode1 = newQrCode1;
        ticket.qrCode2 = newQrCode2;
        
        await ticket.save({ validateBeforeSave: false });
        fixedCount++;
        
        console.log(`✅ Fixed ticket ${ticket._id}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error fixing ticket ${ticket._id}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Fixed: ${fixedCount} tickets`);
    console.log(`❌ Errors: ${errorCount} tickets`);
    console.log('🎉 Done!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the fix
fixDuplicateQRCodes();
