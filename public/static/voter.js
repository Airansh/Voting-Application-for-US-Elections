const socket = io();
const message = document.getElementById('message');
const voteForm = document.getElementById('voteForm');
let currentRace = null;
setupServerErrors(socket, message);
setupLogout();

socket.on('voterProfile', function (profile) {
    document.getElementById('welcome').textContent = 'Welcome, ' + profile.firstName + ' ' + profile.lastName;
    document.getElementById('profile').textContent = 'Voter ID ' + profile.voterId + ' · '
        + profile.address + ', ' + profile.city + ' ' + profile.zipcode;
});

socket.on('electionsData', function (elections) {
    const tbody = document.querySelector('#electionsTable tbody');
    tbody.innerHTML = '';
    if (!elections.length) {
        showEmptyRow(tbody, 6, 'There are no elections yet.');
        return;
    }
    elections.forEach(function (election) {
        let action;
        if (election.hasVoted) {
            action = 'Voted';
        } else if (election.status !== 'active') {
            action = '';
        } else if (!election.inPrecinct) {
            action = 'Not in your precinct';
        } else {
            action = makeButton('Vote', function () { vote(election.Race); }, 'small');
        }
        appendRow(tbody, [
            election.title,
            election.Race,
            formatDateTime(election.Start_Time),
            formatDateTime(election.End_Time),
            statusBadge(election.status),
            action,
        ]);
    });
});

socket.on('votingHistoryResponse', function (response) {
    const tbody = document.querySelector('#votingHistory tbody');
    tbody.innerHTML = '';
    if (!response.data.length) {
        showEmptyRow(tbody, 4, 'You have not voted yet.');
        return;
    }
    response.data.forEach(function (vote) {
        appendRow(tbody, [vote.race || '', vote.name, vote.party, formatDateTime(vote.votedAt)]);
    });
});

function vote(raceTitle) {
    hideMessage(message);
    socket.emit('validateVoterWithRace', raceTitle);
}

socket.on('eligibility', function (data) {
    if (!data.eligible) {
        voteForm.hidden = true;
        showMessage(message, data.reason, 'error');
        return;
    }
    currentRace = data.race_title;
    const select = document.getElementById('candidateSelect');
    select.innerHTML = '';
    data.candidates.forEach(function (candidate, index) {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = candidate.name + ' - ' + candidate.party;
        select.appendChild(option);
    });
    document.getElementById('race').textContent = 'Race: ' + data.race_title;
    voteForm.hidden = false;
    voteForm.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('ballot').addEventListener('submit', function (event) {
    event.preventDefault();
    const select = document.getElementById('candidateSelect');
    const choice = select.options[select.selectedIndex];
    if (!choice || !confirm('Cast your vote for ' + choice.textContent + '? This cannot be changed.')) {
        return;
    }
    socket.emit('castVote', { race: currentRace, candidateIndex: select.value });
});

document.getElementById('cancelVote').addEventListener('click', function () {
    voteForm.hidden = true;
});

socket.on('voteRecorded', function (data) {
    voteForm.hidden = true;
    showMessage(message, 'Your vote for ' + data.candidate + ' in "' + data.race + '" was recorded.', 'success');
});

socket.on('voteFailed', function (data) {
    showMessage(message, data.message, 'error');
});
