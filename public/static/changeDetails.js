var socket = io.connect('http://localhost:3000');

socket.on('connect', function() {
    console.log('Connected to server');

    document.getElementById('changeDetailsForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevents the default form submission

        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const zipcode = document.getElementById('zipcode').value;

        // Emit the 'changeDetails' event to the server
        socket.emit('changeDetails', { address, city, zipcode });
    });

    socket.on('detailsChanged', function() {
        alert('Details changed successfully');
        window.location.href = '/voter';
    });
});