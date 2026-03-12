const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendWelcomeEmail(user) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Welcome to School Management System',
            html: `
                <h1>Welcome ${user.firstName}!</h1>
                <p>Thank you for registering with our School Management System.</p>
                <p>Your account has been created successfully.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
            `
        };

        return await this.transporter.sendMail(mailOptions);
    }

    async sendPasswordResetEmail(user, resetURL) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset</h1>
                <p>You requested a password reset.</p>
                <p>Click the link below to reset your password:</p>
                <a href="${resetURL}">${resetURL}</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService();