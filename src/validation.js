// Pure validation helpers shared by the socket handlers. Each validator returns
// { valid: true, value } with trimmed/normalised data, or { valid: false, errors }.

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
const ZIP_RE = /^\d{5}$/;
const MIN_VOTING_AGE = 18;

function str(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email) {
    return EMAIL_RE.test(str(email));
}

function isValidZip(zip) {
    return ZIP_RE.test(str(String(zip ?? '')));
}

function result(errors, value) {
    return errors.length ? { valid: false, errors } : { valid: true, value };
}

function requireFields(value, fields, errors) {
    fields.forEach((field) => {
        if (!value[field]) {
            errors.push(`${field} is required`);
        }
    });
}

function validateRegistration(data = {}) {
    const value = {
        email: str(data.email).toLowerCase(),
        first: str(data.first),
        last: str(data.last),
        address: str(data.address),
        city: str(data.city),
        zipCode: str(String(data.zipCode ?? '')),
        age: parseInt(data.age, 10),
        id: str(data.id),
    };
    const errors = [];
    requireFields(value, ['first', 'last', 'address', 'city', 'id'], errors);
    if (!isValidEmail(value.email)) errors.push('A valid email address is required');
    if (!isValidZip(value.zipCode)) errors.push('Zip code must be 5 digits');
    if (!Number.isInteger(value.age) || value.age < MIN_VOTING_AGE || value.age > 130) {
        errors.push(`Age must be a number between ${MIN_VOTING_AGE} and 130`);
    }
    return result(errors, value);
}

function validateDetailsChange(data = {}) {
    const value = {
        address: str(data.address),
        city: str(data.city),
        zipcode: str(String(data.zipcode ?? '')),
    };
    const errors = [];
    requireFields(value, ['address', 'city'], errors);
    if (!isValidZip(value.zipcode)) errors.push('Zip code must be 5 digits');
    return result(errors, value);
}

function validatePassword(password) {
    const errors = [];
    if (typeof password !== 'string' || password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        errors.push('Password must contain at least one letter and one number');
    }
    return result(errors, password);
}

function validatePrecinct(data = {}) {
    const value = {
        zipCode: str(String(data.zipCode ?? '')),
        lastFourDigits: str(String(data.lastFourDigits ?? '')),
        votingLocation: str(data.votingLocation),
        pollingManager: str(data.pollingManager),
        stateElectionContact: str(data.stateElectionContact),
    };
    const errors = [];
    requireFields(value, ['votingLocation', 'pollingManager', 'stateElectionContact'], errors);
    if (!isValidZip(value.zipCode)) errors.push('Zip code must be 5 digits');
    if (!/^\d{4}$/.test(value.lastFourDigits)) errors.push('Last 4 digits must be 4 digits');
    return result(errors, value);
}

function validateRace(data = {}) {
    let candidates = data.candidates;
    if (typeof candidates === 'string') {
        try {
            candidates = JSON.parse(candidates);
        } catch (e) {
            candidates = null;
        }
    }
    const value = {
        raceTitle: str(data.raceTitle),
        precinctZipCode: str(String(data.precinctZipCode ?? '')),
        candidates: Array.isArray(candidates)
            ? candidates
                .map((c) => ({ name: str(c && c.name), party: str(c && c.party) }))
                .filter((c) => c.name)
            : [],
    };
    const errors = [];
    requireFields(value, ['raceTitle'], errors);
    if (!isValidZip(value.precinctZipCode)) errors.push('Precinct zip code must be 5 digits');
    if (value.candidates.length < 1) errors.push('At least one candidate is required');
    const names = value.candidates.map((c) => c.name.toLowerCase());
    if (new Set(names).size !== names.length) errors.push('Candidate names must be unique');
    return result(errors, value);
}

function toSqlDateTime(value) {
    const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2})?/.exec(value);
    return match ? `${match[1]} ${match[2]}${match[3] || ':00'}` : value;
}

function validateElection(data = {}) {
    const value = {
        electionTitle: str(data.electionTitle),
        races: str(data.races),
        startTime: str(data.startTime),
        endTime: str(data.endTime),
    };
    const errors = [];
    requireFields(value, ['electionTitle', 'races', 'startTime', 'endTime'], errors);
    const start = Date.parse(value.startTime);
    const end = Date.parse(value.endTime);
    if (value.startTime && Number.isNaN(start)) errors.push('Start time is not a valid date');
    if (value.endTime && Number.isNaN(end)) errors.push('End time is not a valid date');
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
        errors.push('End time must be after start time');
    }
    // Store as "YYYY-MM-DD HH:MM:SS", which every MySQL/MariaDB version accepts.
    value.startTime = toSqlDateTime(value.startTime);
    value.endTime = toSqlDateTime(value.endTime);
    return result(errors, value);
}

module.exports = {
    MIN_VOTING_AGE,
    isValidEmail,
    isValidZip,
    validateRegistration,
    validateDetailsChange,
    validatePassword,
    validatePrecinct,
    validateRace,
    validateElection,
    toSqlDateTime,
};
