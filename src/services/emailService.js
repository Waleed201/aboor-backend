const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        console.warn('⚠️  Email service not configured. Email notifications will be skipped.');
        return;
      }

      this.transporter = nodemailer.createTransport(emailConfig);
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  async sendBookingConfirmation(user, ticket, match) {
    if (!this.transporter) {
      console.log('Email service not configured, skipping email send');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: emailConfig.from,
        to: user.email,
        subject: 'تأكيد حجز تذكرة - Aboor Booking Confirmation',
        html: this.getBookingConfirmationTemplate(user, ticket, match)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Booking confirmation email sent:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send booking confirmation email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendCancellationConfirmation(user, ticket, match) {
    if (!this.transporter) {
      console.log('Email service not configured, skipping email send');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: emailConfig.from,
        to: user.email,
        subject: 'إلغاء حجز تذكرة - Aboor Booking Cancellation',
        html: this.getCancellationTemplate(user, ticket, match)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Cancellation email sent:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send cancellation email:', error.message);
      return { success: false, error: error.message };
    }
  }

  getBookingConfirmationTemplate(user, ticket, match) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .ticket-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .info-label { font-weight: bold; color: #666; }
          .info-value { color: #333; }
          .qr-code { text-align: center; margin: 20px 0; padding: 20px; background: white; border: 2px dashed #667eea; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 تم تأكيد حجزك!</h1>
            <p>Booking Confirmed!</p>
          </div>
          <div class="content">
            <p>مرحباً <strong>${user.name}</strong>،</p>
            <p>تم تأكيد حجز تذكرتك بنجاح. نتطلع لرؤيتك في المباراة!</p>
            
            <div class="ticket-info">
              <h3 style="margin-top: 0; color: #667eea;">تفاصيل المباراة</h3>
              <div class="info-row">
                <span class="info-label">المباراة:</span>
                <span class="info-value">${match.homeTeam} vs ${match.awayTeam}</span>
              </div>
              <div class="info-row">
                <span class="info-label">التاريخ:</span>
                <span class="info-value">${new Date(match.date).toLocaleDateString('ar-SA')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">الوقت:</span>
                <span class="info-value">${match.time}</span>
              </div>
              <div class="info-row">
                <span class="info-label">الملعب:</span>
                <span class="info-value">${match.stadium}</span>
              </div>
              <div class="info-row">
                <span class="info-label">المنطقة:</span>
                <span class="info-value">${ticket.seatInfo.zone} - Area ${ticket.seatInfo.areaNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">السعر:</span>
                <span class="info-value">${ticket.price} ريال</span>
              </div>
            </div>

            <div class="qr-code">
              <h3>رمز التذكرة</h3>
              <p style="font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px;">${ticket.qrCode}</p>
              <p style="font-size: 12px; color: #666;">استخدم هذا الرمز عند الدخول</p>
            </div>

            <p style="color: #666; font-size: 14px;">
              <strong>ملاحظات مهمة:</strong><br>
              • يرجى الوصول قبل بداية المباراة بـ 30 دقيقة على الأقل<br>
              • احتفظ بهذه التذكرة أو رمز QR على هاتفك<br>
              • التذكرة صالحة لشخص واحد فقط
            </p>
          </div>
          <div class="footer">
            <p>شكراً لاستخدامك منصة عبور</p>
            <p>Thank you for using Aboor Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getCancellationTemplate(user, ticket, match) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .ticket-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>تم إلغاء الحجز</h1>
            <p>Booking Cancelled</p>
          </div>
          <div class="content">
            <p>مرحباً <strong>${user.name}</strong>،</p>
            <p>تم إلغاء حجز تذكرتك للمباراة التالية:</p>
            
            <div class="ticket-info">
              <p><strong>المباراة:</strong> ${match.homeTeam} vs ${match.awayTeam}</p>
              <p><strong>التاريخ:</strong> ${new Date(match.date).toLocaleDateString('ar-SA')}</p>
              <p><strong>رقم التذكرة:</strong> ${ticket.qrCode}</p>
            </div>

            ${ticket.paymentStatus === 'refunded' ? 
              '<p>تم رد المبلغ المدفوع (${ticket.price} ريال) وسيصل إلى حسابك خلال 5-7 أيام عمل.</p>' : 
              ''}

            <p>نأسف لإلغاء حجزك ونتطلع لخدمتك في المستقبل.</p>
          </div>
          <div class="footer">
            <p>شكراً لاستخدامك منصة عبور</p>
            <p>Thank you for using Aboor Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();


