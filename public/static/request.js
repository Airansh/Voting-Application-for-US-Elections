
let socket = io.connect('http://localhost:3000');
socket.emit('handshake','requestPage')
console.log("hello")


function request(){
    const requestForm = document.getElementById("request-form")
    const requestError = document.getElementById("request-error-msg")
    const requestSuccess = document.getElementById("request-success-msg")
    requestError.style.opacity = 0;
    requestSuccess.style.opacity = 0;
    let empty = false;
    const firstName = requestForm.firstName.value;
    const lastName = requestForm.lastName.value;
    const age = requestForm.age.value;
    const address = requestForm.address.value;
    const city = requestForm.city.value;
    const zipCode = requestForm.zipCode.value;
    const id = requestForm.idNo.value;
    const passport = requestForm.passport.value;
    const email = requestForm.email.value;
    if(email ==="" || passport ==="" ||id ==="" ||zipCode==="" ||city==="" ||
        address==="" ||age==="" ||lastName==="" ||firstName===""){
        empty = true
    }
    let valid_age = /^\d+$/.test(zipCode);
    let valid_zip = /^\d+$/.test(age);
    let valid_email = false;
    if(email.match( /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)){
       valid_email =true;
    }
    if(valid_zip && valid_age && valid_email &&  !empty){
        requestSuccess.style.opacity = 1;
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
    }else{
        requestError.style.opacity = 1;
    }

}




