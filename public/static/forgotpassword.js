let socket = io.connect('http://localhost:3000');
socket.emit('handshake','requestPage')
console.log("hello")

function forgotPassword(){
    let voterID = document.getElementById("ID").value
    let emailID = document.getElementById("Email").value
    let data = {
        email : emailID,
        voterID : voterID
    }
    socket.emit('ForgotPassword',data);
}
socket.on('validationForgotPassword',(data)=>{
    if(data.valid === "0"){
        window.alert("Invalid Entry!")
    }else if(data.valid ==="1"){
        window.alert("Success!")
    }else{
        console.log("issue!")
    }
})