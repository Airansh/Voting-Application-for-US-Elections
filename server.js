const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const socketIo = require('socket.io');

const config = require('./src/config');
const db = require('./src/db');
const { sendMail } = require('./src/mailer');
const security = require('./src/security');
const validation = require('./src/validation');
const elections = require('./src/elections');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const ADMIN_ROLES = ['admin', 'manager'];
const VOTER_ROLES = ['voter'];

const sessionMiddleware = session({
    secret: config.sessionSecret,
    resave: false,
    // The session cookie has to be issued with the page so that the socket
    // connection opened by that page shares it when the user logs in.
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.secureCookies,
    },
});

app.use(sessionMiddleware);
app.use('/public', express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

function sendView(res, name) {
    res.sendFile(path.join(__dirname, 'views', `${name}.html`));
}

function page(name, roles) {
    return (req, res) => {
        if (roles && !roles.includes(req.session.role)) {
            return res.redirect('/Login');
        }
        sendView(res, name);
    };
}

app.get('/', page('index'));
app.get('/Login', page('login'));
app.get('/RequestAccount', page('request'));
app.get('/ForgotPassword', page('forgotpassword'));
app.get('/CreatePassword', page('createPassword'));
app.get('/Voter', page('voter', VOTER_ROLES));
app.get('/ChangeDetails', page('changeDetails', VOTER_ROLES));
app.get('/Admin', page('admin', ADMIN_ROLES));
app.get('/Logout', (req, res) => {
    req.session.destroy(() => res.redirect('/Login'));
});

// ---------------------------------------------------------------------------
// Data access helpers
// ---------------------------------------------------------------------------

function landingPageFor(role) {
    return ADMIN_ROLES.includes(role) ? '/Admin' : '/Voter';
}

async function getVoterByUserId(voterId) {
    const rows = await db.query(
        `SELECT v.* FROM users u JOIN voters v ON v.email_id = u.email_id WHERE u.voter_id = ?`,
        [voterId],
    );
    return rows[0] || null;
}

async function getVotingHistory(voterId) {
    const rows = await db.query('SELECT CandidatesVoted FROM voter_history WHERE voter_id = ?', [voterId]);
    return rows.length ? elections.parseJsonArray(rows[0].CandidatesVoted) : [];
}

async function getRace(raceTitle) {
    const rows = await db.query('SELECT * FROM races WHERE race_title = ?', [raceTitle]);
    if (!rows.length) return null;
    return { ...rows[0], candidates: elections.parseJsonArray(rows[0].candidates) };
}

async function getElectionsWithStatus() {
    const rows = await db.query('SELECT * FROM elections ORDER BY Start_Time');
    const now = new Date();
    return rows.map((e) => ({ ...e, status: elections.getElectionStatus(e, now) }));
}

// Decides whether a voter may vote in a race right now.
async function checkEligibility(voterId, raceTitle) {
    const voter = await getVoterByUserId(voterId);
    if (!voter) return { eligible: false, reason: 'Voter record not found.' };

    const race = await getRace(raceTitle);
    if (!race) return { eligible: false, reason: 'This race does not exist.' };

    const activeElection = (await getElectionsWithStatus())
        .find((e) => e.Race === raceTitle && e.status === 'active');
    if (!activeElection) {
        return { eligible: false, reason: 'Voting for this race is not open.' };
    }
    if (String(race.zipcode) !== String(voter.zipcode)) {
        return { eligible: false, reason: 'You are not registered in the precinct for this race.' };
    }
    const history = await getVotingHistory(voterId);
    if (elections.hasVotedInRace(history, raceTitle)) {
        return { eligible: false, reason: 'You have already voted in this race.' };
    }
    return { eligible: true, race };
}

async function createUniqueVoterId(voter) {
    for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = security.generateVoterId(voter.first_name, voter.last_name);
        const rows = await db.query('SELECT 1 FROM users WHERE voter_id = ?', [candidate]);
        if (!rows.length) return candidate;
    }
    throw new Error('Could not generate a unique voter ID');
}

// Stores a fresh one-time password token for the user and returns the link.
async function issuePasswordLink(voterId) {
    const token = security.generateToken();
    await db.query(
        `UPDATE users SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL ? HOUR)
         WHERE voter_id = ?`,
        [security.hashToken(token), config.passwordTokenTtlHours, voterId],
    );
    return `${config.baseUrl}/CreatePassword?token=${token}`;
}

async function computeResults() {
    const [races, histories] = await Promise.all([
        db.query('SELECT * FROM races ORDER BY race_title'),
        db.query('SELECT CandidatesVoted FROM voter_history'),
    ]);
    const tally = new Map();
    histories.forEach((row) => {
        elections.parseJsonArray(row.CandidatesVoted).forEach((vote) => {
            if (!vote || !vote.race) return;
            const key = `${vote.race}\u0000${vote.name}`;
            tally.set(key, (tally.get(key) || 0) + 1);
        });
    });
    return races.map((race) => {
        const candidates = elections.parseJsonArray(race.candidates).map((c) => ({
            name: c.name,
            party: c.party,
            votes: tally.get(`${race.race_title}\u0000${c.name}`) || 0,
        }));
        candidates.sort((a, b) => b.votes - a.votes);
        return {
            race: race.race_title,
            zipcode: race.zipcode,
            totalVotes: candidates.reduce((sum, c) => sum + c.votes, 0),
            candidates,
        };
    });
}

// ---------------------------------------------------------------------------
// Socket events
// ---------------------------------------------------------------------------

io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

function getSession(socket) {
    return socket.request.session || {};
}

// Registers a socket handler that is only run for the given roles and whose
// errors are logged and reported instead of crashing the server.
function handle(socket, event, roles, handler) {
    socket.on(event, async (...args) => {
        if (roles && !roles.includes(getSession(socket).role)) {
            socket.emit('unauthorized', { event });
            return;
        }
        try {
            await handler(...args);
        } catch (err) {
            console.error(`Error handling "${event}":`, err);
            socket.emit('serverError', { event, message: 'Something went wrong. Please try again.' });
        }
    });
}

function adminResult(socket, action, ok, message) {
    socket.emit('adminActionResult', { action, ok, message });
}

io.on('connection', (socket) => {
    const role = getSession(socket).role;

    // ----- Public events ---------------------------------------------------

    handle(socket, 'login', null, async (data = {}) => {
        const voterId = String(data.voterId || '').trim();
        const rows = await db.query('SELECT * FROM users WHERE voter_id = ?', [voterId]);
        const user = rows[0];
        if (!user || !security.verifyPassword(String(data.password || ''), user.password)) {
            socket.emit('loginFailed');
            return;
        }
        if (!security.isHashed(user.password)) {
            // Upgrade legacy plain-text passwords on successful login.
            await db.query('UPDATE users SET password = ? WHERE voter_id = ?',
                [security.hashPassword(data.password), voterId]);
        }
        const sess = socket.request.session;
        sess.userId = user.voter_id;
        sess.role = user.role;
        sess.email_id = user.email_id;
        sess.save((err) => {
            if (err) {
                console.error('Error saving session:', err);
                socket.emit('loginFailed');
                return;
            }
            socket.emit('loginSuccess', {
                user: user.voter_id,
                role: user.role,
                redirect: landingPageFor(user.role),
            });
        });
    });

    handle(socket, 'request', null, async (data) => {
        const check = validation.validateRegistration(data);
        if (!check.valid) {
            socket.emit('validation', { valid: '0', errors: check.errors });
            return;
        }
        const v = check.value;
        const existing = await db.query('SELECT 1 FROM voters WHERE email_id = ?', [v.email]);
        if (existing.length) {
            socket.emit('validation', { valid: '0', errors: ['A request with this email already exists'] });
            return;
        }
        await db.query(
            `INSERT INTO voters (email_id, first_name, last_name, address, city, zipcode, age, driving_license)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [v.email, v.first, v.last, v.address, v.city, v.zipCode, v.age, v.id],
        );
        socket.emit('validation', { valid: '1' });
    });

    handle(socket, 'ForgotPassword', null, async (data = {}) => {
        const email = String(data.email || '').trim().toLowerCase();
        const voterId = String(data.voterID || '').trim();
        if (!email || !voterId) {
            socket.emit('validationForgotPassword', { valid: '0', message: 'Please enter your voter ID and email.' });
            return;
        }
        const rows = await db.query(
            'SELECT voter_id FROM users WHERE email_id = ? AND voter_id = ?', [email, voterId]);
        if (rows.length) {
            const link = await issuePasswordLink(voterId);
            await sendMail(email, 'Reset your voting account password',
                `A password reset was requested for voter ID ${voterId}.\n`
                + `Use the following link to choose a new password: ${link}\n`
                + `The link expires in ${config.passwordTokenTtlHours} hours.`);
        }
        // Same answer either way so the form cannot be used to discover accounts.
        socket.emit('validationForgotPassword', {
            valid: '1',
            message: 'If the details match our records, a reset link has been emailed to you.',
        });
    });

    handle(socket, 'createPassword', null, async (data = {}) => {
        const fail = (message) => socket.emit('passwordUpdateFailed', { message });
        const check = validation.validatePassword(data.password);
        if (!check.valid) return fail(check.errors[0]);
        if (!data.token) return fail('This link is invalid. Please use the link from your email.');

        const rows = await db.query(
            'SELECT voter_id FROM users WHERE reset_token = ? AND reset_expires > NOW()',
            [security.hashToken(data.token)],
        );
        if (!rows.length) return fail('This link is invalid or has expired. Please request a new one.');

        await db.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE voter_id = ?',
            [security.hashPassword(data.password), rows[0].voter_id],
        );
        socket.emit('passwordUpdated', { voterId: rows[0].voter_id });
    });

    // ----- Voter events ----------------------------------------------------

    async function sendVoterDashboard() {
        const voterId = getSession(socket).userId;
        const [voter, list, history] = await Promise.all([
            getVoterByUserId(voterId),
            getElectionsWithStatus(),
            getVotingHistory(voterId),
        ]);
        const races = await db.query('SELECT race_title, zipcode FROM races');
        const raceZip = new Map(races.map((r) => [r.race_title, String(r.zipcode)]));
        socket.emit('electionsData', list.map((e) => ({
            ...e,
            hasVoted: elections.hasVotedInRace(history, e.Race),
            inPrecinct: !!voter && raceZip.get(e.Race) === String(voter.zipcode),
        })));
        socket.emit('votingHistoryResponse', { data: history });
        if (voter) {
            socket.emit('voterProfile', {
                voterId,
                firstName: voter.first_name,
                lastName: voter.last_name,
                address: voter.address,
                city: voter.city,
                zipcode: voter.zipcode,
            });
        }
    }

    handle(socket, 'requestVoterDashboard', VOTER_ROLES, sendVoterDashboard);

    handle(socket, 'validateVoterWithRace', VOTER_ROLES, async (raceTitle) => {
        const check = await checkEligibility(getSession(socket).userId, String(raceTitle || ''));
        socket.emit('eligibility', {
            eligible: check.eligible,
            reason: check.reason,
            race_title: raceTitle,
            candidates: check.eligible ? check.race.candidates : [],
        });
    });

    handle(socket, 'castVote', VOTER_ROLES, async (data = {}) => {
        const voterId = getSession(socket).userId;
        const raceTitle = String(data.race || '');
        const check = await checkEligibility(voterId, raceTitle);
        if (!check.eligible) {
            socket.emit('voteFailed', { message: check.reason });
            return;
        }
        const candidate = check.race.candidates[parseInt(data.candidateIndex, 10)];
        if (!candidate) {
            socket.emit('voteFailed', { message: 'Please select a valid candidate.' });
            return;
        }

        // Lock the voter's history row so two simultaneous votes cannot both pass.
        const recorded = await db.transaction(async (conn) => {
            const [rows] = await conn.query(
                'SELECT CandidatesVoted FROM voter_history WHERE voter_id = ? FOR UPDATE', [voterId]);
            const history = rows.length ? elections.parseJsonArray(rows[0].CandidatesVoted) : [];
            if (elections.hasVotedInRace(history, raceTitle)) return false;
            history.push({
                race: raceTitle,
                name: candidate.name,
                party: candidate.party,
                votedAt: new Date().toISOString(),
            });
            await conn.query(
                `INSERT INTO voter_history (voter_id, CandidatesVoted) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE CandidatesVoted = VALUES(CandidatesVoted)`,
                [voterId, JSON.stringify(history)],
            );
            return true;
        });
        if (!recorded) {
            socket.emit('voteFailed', { message: 'You have already voted in this race.' });
            return;
        }
        socket.emit('voteRecorded', { race: raceTitle, candidate: candidate.name });
        await sendVoterDashboard();
    });

    handle(socket, 'changeDetails', VOTER_ROLES, async (data) => {
        const check = validation.validateDetailsChange(data);
        if (!check.valid) {
            socket.emit('detailsChangeFailed', { errors: check.errors });
            return;
        }
        const { address, city, zipcode } = check.value;
        await db.query('UPDATE voters SET address = ?, city = ?, zipcode = ? WHERE email_id = ?',
            [address, city, zipcode, getSession(socket).email_id]);
        socket.emit('detailsChanged');
    });

    // ----- Admin events ----------------------------------------------------

    async function sendPendingVoters() {
        const rows = await db.query(
            `SELECT email_id, first_name, last_name, address, city, zipcode, age, driving_license
             FROM voters WHERE status = 'pending' ORDER BY last_name, first_name`);
        socket.emit('voterData', rows);
    }

    async function sendAdminElections() {
        socket.emit('electionsData', await getElectionsWithStatus());
        socket.emit('racesData', await db.query('SELECT race_title, zipcode FROM races ORDER BY race_title'));
    }

    handle(socket, 'requestAdminDashboard', ADMIN_ROLES, async () => {
        await Promise.all([sendPendingVoters(), sendAdminElections()]);
    });

    handle(socket, 'approveVoter', ADMIN_ROLES, async (email) => {
        const voters = await db.query(
            `SELECT * FROM voters WHERE email_id = ? AND status = 'pending'`, [email]);
        const voter = voters[0];
        if (!voter) {
            adminResult(socket, 'approveVoter', false, 'Voter is not pending approval.');
            return sendPendingVoters();
        }
        const voterId = await createUniqueVoterId(voter);
        await db.transaction(async (conn) => {
            await conn.query(`UPDATE voters SET status = 'approved' WHERE email_id = ?`, [email]);
            await conn.query('INSERT INTO users (voter_id, role, email_id) VALUES (?, ?, ?)',
                [voterId, 'voter', email]);
        });
        const link = await issuePasswordLink(voterId);
        await sendMail(email, 'Your voter registration has been approved',
            `Dear ${voter.first_name},\n\nYour voter ID is ${voterId}. Use it to log in and vote.\n`
            + `Please create your password using the following link: ${link}\n`
            + `The link expires in ${config.passwordTokenTtlHours} hours.`);
        adminResult(socket, 'approveVoter', true, `Approved ${email} as voter ${voterId}.`);
        await sendPendingVoters();
    });

    handle(socket, 'denyVoter', ADMIN_ROLES, async (email) => {
        const result = await db.query(
            `UPDATE voters SET status = 'denied' WHERE email_id = ? AND status = 'pending'`, [email]);
        adminResult(socket, 'denyVoter', result.affectedRows > 0,
            result.affectedRows ? `Denied ${email}.` : 'Voter is not pending approval.');
        await sendPendingVoters();
    });

    handle(socket, 'searchVoter', ADMIN_ROLES, async (data = {}) => {
        const value = String(data.value || '').trim();
        const columns = 'email_id, first_name, last_name, address, city, zipcode, age, driving_license, status';
        let rows = [];
        if (data.criteria === 'name' && value) {
            const like = `%${value}%`;
            rows = await db.query(
                `SELECT ${columns} FROM voters
                 WHERE first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name, ' ', last_name) LIKE ?
                 ORDER BY last_name, first_name LIMIT 100`,
                [like, like, like]);
        } else if (data.criteria === 'zipcode' && value) {
            rows = await db.query(
                `SELECT ${columns} FROM voters WHERE zipcode = ? ORDER BY last_name, first_name LIMIT 100`,
                [value]);
        } else if (data.criteria === 'email' && value) {
            rows = await db.query(`SELECT ${columns} FROM voters WHERE email_id LIKE ? LIMIT 100`,
                [`%${value}%`]);
        }
        socket.emit('searchResults', rows);
    });

    handle(socket, 'NewElection', ADMIN_ROLES, async (data) => {
        const check = validation.validateElection(data);
        if (!check.valid) return adminResult(socket, 'NewElection', false, check.errors.join('. '));
        const e = check.value;
        if (!(await getRace(e.races))) {
            return adminResult(socket, 'NewElection', false, `Race "${e.races}" does not exist. Create it first.`);
        }
        try {
            await db.query('INSERT INTO elections (title, Race, Start_Time, End_Time) VALUES (?, ?, ?, ?)',
                [e.electionTitle, e.races, e.startTime, e.endTime]);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return adminResult(socket, 'NewElection', false, 'An election with this title already exists.');
            }
            throw err;
        }
        adminResult(socket, 'NewElection', true, `Election "${e.electionTitle}" created.`);
        await sendAdminElections();
    });

    handle(socket, 'closeElection', ADMIN_ROLES, async (title) => {
        const result = await db.query(`UPDATE elections SET status = 'closed' WHERE title = ?`, [title]);
        adminResult(socket, 'closeElection', result.affectedRows > 0,
            result.affectedRows ? `Election "${title}" closed.` : 'Election not found.');
        await sendAdminElections();
    });

    handle(socket, 'NewRace', ADMIN_ROLES, async (data) => {
        const check = validation.validateRace(data);
        if (!check.valid) return adminResult(socket, 'NewRace', false, check.errors.join('. '));
        const r = check.value;
        try {
            await db.query('INSERT INTO races (race_title, candidates, zipcode) VALUES (?, ?, ?)',
                [r.raceTitle, JSON.stringify(r.candidates), r.precinctZipCode]);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return adminResult(socket, 'NewRace', false, 'A race with this title already exists.');
            }
            throw err;
        }
        adminResult(socket, 'NewRace', true, `Race "${r.raceTitle}" created.`);
        await sendAdminElections();
    });

    handle(socket, 'NewPrecinct', ADMIN_ROLES, async (data) => {
        const check = validation.validatePrecinct(data);
        if (!check.valid) return adminResult(socket, 'NewPrecinct', false, check.errors.join('. '));
        const p = check.value;
        try {
            await db.query(
                `INSERT INTO precinct (zipcode, last_4_Digits, voting_location, polling_manager, state_election_contact)
                 VALUES (?, ?, ?, ?, ?)`,
                [p.zipCode, p.lastFourDigits, p.votingLocation, p.pollingManager, p.stateElectionContact]);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return adminResult(socket, 'NewPrecinct', false, 'A precinct with this zip code already exists.');
            }
            throw err;
        }
        adminResult(socket, 'NewPrecinct', true, `Precinct ${p.zipCode} created.`);
    });

    handle(socket, 'requestResults', ADMIN_ROLES, async () => {
        socket.emit('electionResults', await computeResults());
    });

    // Push the initial data for the page that opened this connection.
    if (VOTER_ROLES.includes(role)) {
        sendVoterDashboard().catch((err) => console.error('Error loading voter dashboard:', err));
    } else if (ADMIN_ROLES.includes(role)) {
        Promise.all([sendPendingVoters(), sendAdminElections()])
            .catch((err) => console.error('Error loading admin dashboard:', err));
    }
});

if (require.main === module) {
    db.pool.query('SELECT 1')
        .then(() => console.log('MySQL connected'))
        .catch((err) => console.error('Could not connect to MySQL:', err.message));
    server.listen(config.port, () => {
        console.log(`Server started on ${config.baseUrl}`);
    });
}

module.exports = { app, server, io };
