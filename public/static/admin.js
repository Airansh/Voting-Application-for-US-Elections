const socket = io();
const message = document.getElementById('message');
setupServerErrors(socket, message);
setupLogout();

socket.on('adminActionResult', function (result) {
    showMessage(message, result.message, result.ok ? 'success' : 'error');
    if (result.ok && result.action === 'NewRace') {
        document.getElementById('raceForm').reset();
        resetCandidates();
    } else if (result.ok && result.action === 'NewElection') {
        document.getElementById('electionForm').reset();
    } else if (result.ok && result.action === 'NewPrecinct') {
        document.getElementById('precinctForm').reset();
    }
});

// ----- Pending voters -------------------------------------------------------

socket.on('voterData', function (voters) {
    const tbody = document.querySelector('#votersTable tbody');
    tbody.innerHTML = '';
    if (!voters.length) {
        showEmptyRow(tbody, 9, 'No pending requests.');
        return;
    }
    voters.forEach(function (voter) {
        const actions = document.createElement('div');
        actions.className = 'row';
        actions.appendChild(makeButton('Approve', function () {
            socket.emit('approveVoter', voter.email_id);
        }, 'small'));
        actions.appendChild(makeButton('Deny', function () {
            if (confirm('Deny the request from ' + voter.email_id + '?')) {
                socket.emit('denyVoter', voter.email_id);
            }
        }, 'small danger'));
        appendRow(tbody, [voter.email_id, voter.first_name, voter.last_name, voter.address,
            voter.city, voter.zipcode, voter.age, voter.driving_license, actions]);
    });
});

// ----- Search ---------------------------------------------------------------

document.getElementById('searchForm').addEventListener('submit', function (event) {
    event.preventDefault();
    socket.emit('searchVoter', {
        criteria: document.getElementById('searchCriteria').value,
        value: document.getElementById('searchValue').value.trim(),
    });
});

socket.on('searchResults', function (voters) {
    const tbody = document.querySelector('#searchTable tbody');
    tbody.innerHTML = '';
    if (!voters.length) {
        showEmptyRow(tbody, 9, 'No voters found.');
        return;
    }
    voters.forEach(function (voter) {
        appendRow(tbody, [voter.email_id, voter.first_name, voter.last_name, voter.address,
            voter.city, voter.zipcode, voter.age, voter.driving_license, voter.status]);
    });
});

// ----- Elections and races --------------------------------------------------

socket.on('electionsData', function (elections) {
    const tbody = document.querySelector('#electionsTable tbody');
    tbody.innerHTML = '';
    if (!elections.length) {
        showEmptyRow(tbody, 6, 'No elections yet.');
        return;
    }
    elections.forEach(function (election) {
        const canClose = election.status === 'active' || election.status === 'upcoming';
        const action = canClose ? makeButton('Close', function () {
            if (confirm('Close "' + election.title + '"? Voters will no longer be able to vote in it.')) {
                socket.emit('closeElection', election.title);
            }
        }, 'small danger') : '';
        appendRow(tbody, [election.title, election.Race, formatDateTime(election.Start_Time),
            formatDateTime(election.End_Time), statusBadge(election.status), action]);
    });
});

socket.on('racesData', function (races) {
    const select = document.getElementById('races');
    select.innerHTML = '';
    races.forEach(function (race) {
        const option = document.createElement('option');
        option.value = race.race_title;
        option.textContent = race.race_title + ' (' + race.zipcode + ')';
        select.appendChild(option);
    });
});

socket.on('electionResults', function (results) {
    const container = document.getElementById('results');
    container.innerHTML = '';
    if (!results.length) {
        container.textContent = 'No races yet.';
        return;
    }
    results.forEach(function (race) {
        const heading = document.createElement('h3');
        heading.textContent = race.race + ' (' + race.totalVotes + (race.totalVotes === 1 ? ' vote)' : ' votes)');
        container.appendChild(heading);
        const table = document.createElement('table');
        const tbody = table.createTBody();
        race.candidates.forEach(function (candidate) {
            const share = race.totalVotes ? Math.round(candidate.votes * 100 / race.totalVotes) : 0;
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.width = share + '%';
            appendRow(tbody, [candidate.name, candidate.party, candidate.votes, share + '%', bar]);
        });
        container.appendChild(table);
    });
});

document.getElementById('refreshResults').addEventListener('click', function () {
    socket.emit('requestResults');
});

// ----- Creation forms -------------------------------------------------------

function addCandidate() {
    const entry = document.createElement('div');
    entry.className = 'candidateEntry row';
    entry.innerHTML = '<input type="text" name="candidateName" placeholder="Candidate name" required>'
        + '<input type="text" name="candidateParty" placeholder="Party" required>';
    document.getElementById('candidatesContainer').appendChild(entry);
}

function resetCandidates() {
    document.getElementById('candidatesContainer').innerHTML = '';
    addCandidate();
}

document.getElementById('addCandidate').addEventListener('click', addCandidate);
resetCandidates();

document.getElementById('precinctForm').addEventListener('submit', function (event) {
    event.preventDefault();
    socket.emit('NewPrecinct', {
        zipCode: document.getElementById('zipCode').value.trim(),
        lastFourDigits: document.getElementById('lastFourDigits').value.trim(),
        votingLocation: document.getElementById('votingLocation').value.trim(),
        pollingManager: document.getElementById('pollingManager').value.trim(),
        stateElectionContact: document.getElementById('stateElectionContact').value.trim(),
    });
});

document.getElementById('raceForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const candidates = Array.from(document.querySelectorAll('.candidateEntry')).map(function (entry) {
        return {
            name: entry.querySelector('input[name="candidateName"]').value.trim(),
            party: entry.querySelector('input[name="candidateParty"]').value.trim(),
        };
    });
    socket.emit('NewRace', {
        raceTitle: document.getElementById('raceTitle').value.trim(),
        precinctZipCode: document.getElementById('precinctZipCode').value.trim(),
        candidates: candidates,
    });
});

document.getElementById('electionForm').addEventListener('submit', function (event) {
    event.preventDefault();
    socket.emit('NewElection', {
        electionTitle: document.getElementById('electionTitle').value.trim(),
        races: document.getElementById('races').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
    });
});

socket.emit('requestResults');
