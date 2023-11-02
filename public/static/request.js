
let socket = io.connect('http://localhost:3000');
socket.emit('handshake','requestPage')
console.log("hello")



function request(){
    const requestForm = document.getElementById("request-form")
    const requestError = document.getElementById("request-error-msg")
    const firstName = requestForm.firstName.value;
    const lastName = requestForm.lastName.value;
    const age = requestForm.age.value;
    const address = requestForm.address.value;
    const city = requestForm.city.value;
    const zipCode = requestForm.zipCode.value;
    const id = requestForm.idNo.value;
    const passport = requestForm.passport.value;
    const email = requestForm.email.value;
    let request = {
        first : firstName,
        last : lastName,
        age : age,
        address : address,
        city : city,
        zipCode : zipCode,
        id : id,
        passport : passport,
        email : email
    }
    socket.emit('request',request);
}

socket.on('validation', (data) => {

})


