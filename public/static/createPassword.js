const socket = io();
const message = document.getElementById('message');
const form = document.getElementById('createPasswordForm');
const token = new URLSearchParams(window.location.search).get('token');
setupServerErrors(socket, message);

if (!token) {
    showMessage(message, 'This page must be opened from the link in your email.', 'error');
    form.querySelector('button').disabled = true;
}

form.addEventListener('submit', function (event) {
    event.preventDefault();
    const password = document.getElementById('password').value;
    if (password !== document.getElementById('confirmPassword').value) {
        showMessage(message, 'Passwords do not match.', 'error');
        return;
    }
    socket.emit('createPassword', { token: token, password: password });
});

socket.on('passwordUpdated', function (data) {
    form.reset();
    form.querySelector('button').disabled = true;
    showMessage(message, 'Password saved for voter ' + data.voterId + '. You can now log in.', 'success');
});

socket.on('passwordUpdateFailed', function (data) {
    showMessage(message, data.message, 'error');
});
