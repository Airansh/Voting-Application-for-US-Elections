var socket = io.connect('http://localhost:3000');

socket.on('voterData', function (data) {
    var table = document.getElementById('votersTable');
    data.forEach(function(voter) {
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5);
        var cell7 = row.insertCell(6);
        var cell8 = row.insertCell(7);
        var cell9 = row.insertCell(8);
        var cell10 = row.insertCell(9);

        cell1.innerHTML = voter.email_id;
        cell2.innerHTML = voter.first_name;
        cell3.innerHTML = voter.last_name;
        cell4.innerHTML = voter.address;
        cell5.innerHTML = voter.city;
        cell6.innerHTML = voter.zipcode;
        cell7.innerHTML = voter.age;
        cell8.innerHTML = voter.driving_license;
        cell9.innerHTML = "<button onclick='approveVoter("+voter.voter_id+")'>Approve</button>";
        cell10.innerHTML = "<button onclick='denyVoter("+voter.voter_id+")'>Deny</button>";
    });
});

function approveVoter(voter_id) {
    socket.emit('approveVoter', voter_id);
}

function denyVoter(voter_id) {
    socket.emit('denyVoter', voter_id);
}

socket.on('connect', function() {
    console.log('Connected to server');
});