const express = require('express');
const mysql = require('mysql');
const socketIo = require("socket.io");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;
app.use('/public', express.static('public'));
// Create connection
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'votinginfo'
});

// Connect
db.connect((err) => {
    if(err) {
        throw err;
    }
    console.log('MySQL Connected...');
});

app.get('/', (req, res) => {
    console.log('Connected to MySQL Database');
    res.sendFile('./views/index.html', {root: __dirname});
});
app.get('/Login',(req,res) =>{
    console.log("Login Page");
    res.sendFile('./views/login.html',{root: __dirname});
})
app.get('/SignUp',(req,res) =>{
    console.log("SignUp Page");
    res.sendFile('./views/signup.html',{root: __dirname});
})
app.get('/ForgotPassword',(req,res) =>{
    console.log("ForgotPassword Page");
    res.sendFile('./views/forgotpassword.html',{root: __dirname});
})
app.get('/voters', (req, res) => {

    let voter_id = 103 //take as an input from frontend
    //example: http://localhost:3000/voters?voter_id=101

    let voter_details = {
        first_name: '',
        last_name: '',
        city: '',
        zipcode: 0
    } //we're fetching it from DB and sending it as result
    

    const sql = 'SELECT * FROM voters where voter_id = '+voter_id;
    db.query(sql, (err, results) => {
        if(err) {
            throw err;
        }

        results.forEach(row => {
            console.log(row.first_name);
            voter_details.first_name = row.first_name;
            voter_details.last_name = row.last_name;
            voter_details.city = row.city;
            voter_details.zipcode = row.zipcode;
        
        });
        console.log(voter_details);
        res.send(voter_details);
        //take inputs into the frontend from voter_details for displaying
    });
});
io.on('connection', function(socket) {
    console.log("New Client has connected")

    socket.on('handshake', function (type) {
        if (type == 'frontend') {
            console.log('frontend has connected')
            socket.join('frontend')
        }
    });
    socket.on('forgot', (data) => {
        console.log(data)
        let sql1 = "SELECT EXISTS(SELECT * FROM voters WHERE first_name = " + "'"+data.first+"' AND last_name = " +"'"
            + data.last + "' AND contact_no = '" + data.phone + "')"
        let exists;
        db.query(sql1, (err, results) => {
            if (err) {
                throw err;
            }
            results.forEach(row=>{
                console.log(results)
                console.log(row)
            });

        });
        console.log(exists)
    });
});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

