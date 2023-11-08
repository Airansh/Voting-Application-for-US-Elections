const socket = io();

document.getElementById('createPasswordForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const voterId = document.getElementById('voterId').value;
    const password = document.getElementById('password').value;
    socket.emit('createPassword', { voterId, password });
});

socket.on('passwordUpdated', function() {
    alert('Password updated successfully');
});

socket.on('passwordUpdateFailed', function() {
    alert('Failed to update password. Please check your voter ID or if your password is already set.');
});