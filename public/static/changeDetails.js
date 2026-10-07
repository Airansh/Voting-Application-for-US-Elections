const socket = io();
const message = document.getElementById('message');
setupServerErrors(socket, message);
setupLogout();

// Pre-fill the form with the voter's current details.
socket.on('voterProfile', function (profile) {
    document.getElementById('address').value = profile.address;
    document.getElementById('city').value = profile.city;
    document.getElementById('zipcode').value = profile.zipcode;
});

document.getElementById('changeDetailsForm').addEventListener('submit', function (event) {
    event.preventDefault();
    socket.emit('changeDetails', {
        address: document.getElementById('address').value.trim(),
        city: document.getElementById('city').value.trim(),
        zipcode: document.getElementById('zipcode').value.trim(),
    });
});

socket.on('detailsChanged', function () {
    showMessage(message, 'Your details were updated.', 'success');
});

socket.on('detailsChangeFailed', function (data) {
    showMessage(message, data.errors, 'error');
});
