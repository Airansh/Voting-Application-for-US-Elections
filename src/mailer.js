const nodemailer = require('nodemailer');
const config = require('./config');

let transporter = null;
if (config.smtp.host && config.smtp.user) {
    transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
}

// Sends an e-mail. When SMTP is not configured (e.g. local development) the
// message is printed to the console instead so the links can still be used.
async function sendMail(to, subject, text) {
    if (!transporter) {
        console.log(`[mail disabled] To: ${to}\nSubject: ${subject}\n${text}\n`);
        return;
    }
    try {
        await transporter.sendMail({ from: config.smtp.from, to, subject, text });
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error(`Error sending email to ${to}:`, err.message);
    }
}

module.exports = { sendMail };
