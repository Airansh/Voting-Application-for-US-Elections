const socket = io();
const message = document.getElementById('message');
setupServerErrors(socket, message);

document.getElementById('forgotPasswordForm').addEventListener('submit', function (event) {
    event.preventDefault();
    socket.emit('ForgotPassword', {
        voterID: document.getElementById('ID').value.trim(),
        email: document.getElementById('Email').value.trim(),
    });
});

socket.on('validationForgotPassword', function (data) {
    showMessage(message, data.message, data.valid === '1' ? 'success' : 'error');
});
