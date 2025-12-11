const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Match = require('../models/Match');  // Need to load Match model for populate
const qrCodeService = require('../services/qrCodeService');
require('dotenv').config();

/**
 * Regenerate QR codes for existing tickets that don't have images
 */
async function regenerateQRCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aboor');
    console.log('✅ Connected to MongoDB');

    // Find tickets without QR code images
    const tickets = await Ticket.find({
      $or: [
        { qrCodeImage1: null },
        { qrCodeImage2: null },
        { qrCodeImage1: { $exists: false } },
        { qrCodeImage2: { $exists: false } }
      ]
    }).populate('matchId');

    console.log(`\n📊 Found ${tickets.length} tickets without QR code images\n`);

    if (tickets.length === 0) {
      console.log('✅ All tickets already have QR code images!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const ticket of tickets) {
      try {
        console.log(`Processing ticket ${ticket._id}...`);

        // Generate both QR code images
        const qrCodeImages = await qrCodeService.generateDualQRCodes(
          ticket.qrCode1,
          ticket.qrCode2,
          ticket._id.toString()
        );

        // Update ticket
        ticket.qrCodeImage1 = qrCodeImages.qrCodeImage1;
        ticket.qrCodeImage2 = qrCodeImages.qrCodeImage2;
        await ticket.save();

        successCount++;
        console.log(`✅ Generated QR codes for ticket ${ticket._id}`);
        console.log(`   QR Code 1: ${ticket.qrCode1}`);
        console.log(`   QR Code 2: ${ticket.qrCode2}\n`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ticket ${ticket._id}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${tickets.length}`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
regenerateQRCodes();

