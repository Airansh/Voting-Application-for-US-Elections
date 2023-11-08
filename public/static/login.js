
socket.emit('handshake','frontend')
console.log("hello")
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const voterId = document.getElementById('voterId').value;
    const password = document.getElementById('password').value;
    console.log("sending data")
    socket.emit('login', { voterId, password });
});
socket.on('loginSuccess',(data)=> {
    alert('Successful login for user ' + data.user + ", role:" + data.role);
});

socket.on('loginFailed', function() {
    alert('Invalid Login');
});