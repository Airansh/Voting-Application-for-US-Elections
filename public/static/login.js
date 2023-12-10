
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
    console.log(data.role)
    if(data.role == "admin"){
        console.log("help")
        location.href = 'http://localhost:3000/admin'
    }else if(data.role === "voter"){
        location.replace('https://localhost/voter');
    }
});

socket.on('loginFailed', function() {
    alert('Invalid Login');
});