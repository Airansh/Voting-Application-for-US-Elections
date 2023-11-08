///



///ignore this page i think it makes more sense to make a script for each html page


///
let socket = io.connect('http://localhost:3000');
socket.emit('handshake','frontend')
console.log("hello")




socket.on('ForgotResults', (data) => {
    console.log('FrontEnd Received: ', data)
    //if the response is okay
    //move the user to the updat password page or whatever
})

