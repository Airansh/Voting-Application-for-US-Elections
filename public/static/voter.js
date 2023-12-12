var socket = io.connect('http://localhost:3000');
var candidatesArray = [];
socket.emit('requestVotingHistory');
socket.on('connect', function() {
    console.log('Connected to server');

    document.getElementById('logoutButton').addEventListener('click', function() {
        if(confirm('Are you sure you want to logout?')) {
            // Emit the 'Logout' event to the server
            socket.emit('Logout');

            // Redirect to the login page after the session is destroyed
            socket.on('loggedOut', function() {
                window.location.href = '/Login';
            });
        }
    });
});
socket.on('votingHistoryResponse', (response) => {
    if (response.error) {
        console.error(response.error);
        // Handle error (e.g., show a message to the user)
        return;
    }

    const votingHistoryDiv = document.getElementById('votingHistory');
    votingHistoryDiv.innerHTML = ''; // Clear previous content

    // Display each voted candidate
    response.data.forEach(candidate => {
        const candidateDiv = document.createElement('div');
        candidateDiv.textContent = `Voted for: ${candidate.name} from ${candidate.party}`;
        votingHistoryDiv.appendChild(candidateDiv);
    });
});
socket.on('electionsData',function (data){
    console.log('electionData received');
    var table = document.getElementById("electionsTable");
    data.forEach(function(election) {
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5);

        cell1.innerHTML = election.title;
        cell2.innerHTML = election.Race;
        cell3.innerHTML = election.Start_Time;
        cell4.innerHTML = election.End_Time;
        cell5.innerHTML = election.status;
        cell6.innerHTML = "<button onclick='vote(\"" + election.Race + "\")'>Vote</button>";

    });
})
socket.on('eligibilty',function (data){
    if(data.eligible== false){
        alert("NOT ELIGIBLE");
    }else{
        console.log(data.eligible, data.race_title, data.candidates)
        candidatesArray = data.candidates;

        var select = document.getElementById('candidateSelect');
        select.innerHTML = ''; // Clear existing options

        // Populate dropdown with candidates
        candidatesArray.forEach(function(candidate,index) {
            var option = document.createElement('option');
            option.value = index; // Use index as value to reference candidatesArray
            option.textContent = candidate.name + " - " + candidate.party;
            select.appendChild(option);
        document.getElementById('race').textContent = 'Race: ' + data.race_title;
        document.getElementById('voteForm').style.display = 'block'
    });
}})
function submitVote() {

    var selectedIndex = document.getElementById('candidateSelect').value
    console.log(candidatesArray);
    var selectedCandidate = candidatesArray[selectedIndex].name;
    alert('Vote submitted! ' + selectedCandidate);
    document.getElementById('voteForm').style.display = 'none';
    let data = {
        candidateInfo:candidatesArray[selectedIndex]
    }
    console.log(data);
    socket.emit('updateVoterHistory',data);
}
function vote(electionRace){
    console.log(electionRace)
    socket.emit('validateVoterWithRace',electionRace)

}