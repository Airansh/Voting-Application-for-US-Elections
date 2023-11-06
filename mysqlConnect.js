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
app.get('/RequestAccount',(req,res) =>{
    console.log("Request Account Page");
    res.sendFile('./views/request.html',{root: __dirname});
})
app.get('/ForgotPassword',(req,res) =>{
    console.log("ForgotPassword Page");
    res.sendFile('./views/forgotpassword.html',{root: __dirname});
})
app.get('/voters', (req, res) => {
    //old functionality
});
io.on('connection', function(socket) {
    //console.log("New Client has connected")

    socket.on('handshake', function (type) {
        if (type == 'frontend') {
            console.log('frontend has connected')
            socket.join('frontend')
        }else if(type == 'requestPage'){
            console.log('requestPage joined')
            socket.join('requestPage')
        }
    });
    socket.on('request',(data)=>{
        console.log('Request Recieved:');
        console.log(data);
        const sql = 'SELECT 1 FROM voters WHERE email_id = '+"'"+data.email+"' ORDER BY email_id LIMIT 1"
        db.query(sql, (err, results) => {
            if(err) {
                throw err;
            }
            if(results.length > 0){
                console.log('already exists')
            }else{
                console.log('success')
                const placeSql ='INSERT INTO voters(email_id,first_name,last_name,address,city,zipcode,age,driving_license) ' +
                                'VALUES ('+"'"+data.email+"' , "+"'"+data.first+"' , "+"'"+data.last+"' , "
                                +"'"+data.address+"' , "+"'"+data.city+"' , "+"'"+data.zipCode+"' , "+"'"+data.age+"' , "+"'"+data.id+"')"
                db.query(placeSql,(err,results)=>{
                    if(err){
                        throw err;
                    }
                    console.log(results)
                    console.log("added to database")
                })
            }
        });

    })
});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

