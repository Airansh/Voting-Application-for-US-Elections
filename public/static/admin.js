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

socket.on('voterStatusUpdated', function() {
    location.reload();
});
document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevents the default form submission

    const selectedCriteria = document.getElementById('searchCriteria').value;
    const searchInput = document.getElementById('searchValue').value;

    console.log('Selected Criteria:', selectedCriteria);
    console.log('Search Value:', searchInput);
    let data = {
      criteria:selectedCriteria,
      value:searchInput
    };
    let table = document.getElementById("searchTable");
    for (let i = table.rows.length -1; i >0; i--){
        table.deleteRow(i);
    }
    socket.emit('searchVoter',data)
});
socket.on('searchResults',function (data){

    console.log("recieved!")
    const table = document.getElementById('searchTable');
    data.forEach(function(voter) {
        let row = table.insertRow(-1);
        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);
        let cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5);
        var cell7 = row.insertCell(6);
        var cell8 = row.insertCell(7);

        cell1.innerHTML = voter.email_id;
        cell2.innerHTML = voter.first_name;
        cell3.innerHTML = voter.last_name;
        cell4.innerHTML = voter.address;
        cell5.innerHTML = voter.city;
        cell6.innerHTML = voter.zipcode;
        cell7.innerHTML = voter.age;
        cell8.innerHTML = voter.driving_license;
    });
});
socket.on('connect', function() {
    console.log('Connected to server');
});
