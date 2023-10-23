
let socket = io.connect('http://localhost:3000');
socket.emit('handshake','frontend')
console.log("hello")
function forgotPassword(){
    let first = document.getElementById("First").value;
    let last = document.getElementById("Last").value;
    let email = document.getElementById("Email").value;
    let phone = document.getElementById("Phone").value;
    let data = {
        "first":first,
        "last":last,
        "email":email,
        "phone":phone,
    }
    socket.emit('forgot',data)


}


socket.on('ForgotResults', (data) => {
    console.log('FrontEnd Received: ', data)
    //if the response is okay
    //move the user to the updat password page or whatever
})

