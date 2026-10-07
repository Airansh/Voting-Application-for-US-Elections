// Pure helpers for election and ballot logic.

// MySQL returns DATETIME values as "YYYY-MM-DD HH:MM:SS" (dateStrings: true) and
// the admin form sends "YYYY-MM-DDTHH:MM"; both are parsed as local time.
function parseDate(value) {
    if (value instanceof Date) return value;
    if (typeof value !== 'string' || !value) return null;
    const date = new Date(value.replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
}

// The stored status is only used to record that an admin closed an election
// early; otherwise the status is derived from the start and end times.
function getElectionStatus(election, now = new Date()) {
    if (election.status === 'closed') return 'closed';
    const start = parseDate(election.Start_Time);
    const end = parseDate(election.End_Time);
    if (start && now < start) return 'upcoming';
    if (end && now > end) return 'ended';
    return 'active';
}

// Candidates are stored as a JSON array, but the driver may hand it back as a
// string (MariaDB) or as an already-parsed value (MySQL).
function parseJsonArray(value) {
    if (value == null) return [];
    let parsed = value;
    if (typeof value === 'string') {
        try {
            parsed = JSON.parse(value);
        } catch (e) {
            return [];
        }
    }
    if (Array.isArray(parsed)) return parsed;
    return parsed && typeof parsed === 'object' ? [parsed] : [];
}

function hasVotedInRace(history, raceTitle) {
    return parseJsonArray(history).some((vote) => vote && vote.race === raceTitle);
}

module.exports = {
    parseDate,
    getElectionStatus,
    parseJsonArray,
    hasVotedInRace,
};
