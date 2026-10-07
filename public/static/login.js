const socket = io();
const message = document.getElementById('message');
setupServerErrors(socket, message);

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    hideMessage(message);
    socket.emit('login', {
        voterId: document.getElementById('voterId').value.trim(),
        password: document.getElementById('password').value,
    });
});

socket.on('loginSuccess', function (data) {
    showMessage(message, 'Logged in as ' + data.user + '. Redirecting...', 'success');
    window.location.href = data.redirect;
});

socket.on('loginFailed', function () {
    showMessage(message, 'Invalid voter ID or password.', 'error');
});
