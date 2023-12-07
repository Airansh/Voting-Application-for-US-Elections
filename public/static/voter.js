var socket = io.connect('http://localhost:3000');

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