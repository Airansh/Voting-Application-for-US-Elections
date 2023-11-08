let socket = io.connect('http://localhost:3000');
socket.emit('handshake','signin')
console.log("hello")



function signin(email_id) {
    socket.emit('signin', email_id);
}



function validateForm() {
    

    socket.on('validate', function (data) {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        data.forEach(function(user) {
            if(username == user.user_id && password == user.password){
                if( user.role == 'admin'){
                    window.location.href = "/views/admin.html"; // Replace with the actual dashboard URL
                    return window.location.href; // Prevent form submission 
                }
                window.location.href = "/views/login.html"; // Replace with the actual dashboard URL
                return window.location.href; // Prevent form submission 
            }

        }  
    )
    document.getElementById('error-msg').textContent = "Invalid username or password. Please try again.";
        return false;
    });

}
