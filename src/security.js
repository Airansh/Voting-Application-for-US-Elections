const crypto = require('crypto');

const KEY_LENGTH = 64;
const HASH_PREFIX = 'scrypt';

// Hash a password with scrypt and a random salt. The result has the form
// "scrypt$<salt>$<hash>" so it can be told apart from legacy plain-text values.
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
    return `${HASH_PREFIX}$${salt}$${hash}`;
}

function isHashed(stored) {
    return typeof stored === 'string' && stored.startsWith(`${HASH_PREFIX}$`);
}

function safeEqual(a, b) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

function verifyPassword(password, stored) {
    if (typeof password !== 'string' || typeof stored !== 'string') {
        return false;
    }
    if (!isHashed(stored)) {
        // Legacy rows stored the password in plain text.
        return safeEqual(password, stored);
    }
    const [, salt, hash] = stored.split('$');
    if (!salt || !hash) {
        return false;
    }
    const candidate = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
    return safeEqual(candidate, hash);
}

// One-time tokens are e-mailed in plain form; only their SHA-256 digest is stored.
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

// Voter IDs are the voter's initials followed by a random four digit number.
function generateVoterId(firstName, lastName) {
    const initials = `${(firstName || 'X')[0]}${(lastName || 'X')[0]}`.toUpperCase();
    return initials + crypto.randomInt(1000, 10000);
}

module.exports = {
    hashPassword,
    isHashed,
    verifyPassword,
    generateToken,
    hashToken,
    generateVoterId,
};
