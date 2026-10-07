// Central configuration. Every value can be overridden with an environment
// variable so that no credentials need to live in the source code.
const port = parseInt(process.env.PORT, 10) || 3000;

module.exports = {
    port,
    baseUrl: process.env.BASE_URL || `http://localhost:${port}`,
    sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
    secureCookies: process.env.SECURE_COOKIES === 'true',
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'votinginfo',
    },
    smtp: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT, 10) || 465,
        secure: process.env.SMTP_SECURE !== 'false',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@localhost',
    },
    // How long a "create / reset password" link stays valid.
    passwordTokenTtlHours: parseInt(process.env.PASSWORD_TOKEN_TTL_HOURS, 10) || 24,
};
