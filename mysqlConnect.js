const express = require('express');
const mysql = require('mysql2');
const socketIo = require("socket.io");
const http = require("http");
const nodemailer = require('nodemailer');
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
app.get('/Admin', (req, res) => {
    res.sendFile('./views/admin.html', {root: __dirname});
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
    const sql1 = `SELECT * FROM voters WHERE status='pending'`;
    db.query(sql1, (err, results) => {
        if(err) {
            throw err;
        }
        socket.emit('voterData', results);
    });
    socket.on('approveVoter', (email_id) => {
        const updateSql = 'UPDATE voters SET status = ? WHERE email_id = ?';
        db.query(updateSql, ['approved', email_id], (err, result) => {
            if(err) {
                throw err;
            }
            console.log('Voter status updated to approved');

            // Fetch the approved voter's details
            const selectSql = 'SELECT * FROM voters WHERE email_id = ?';
            db.query(selectSql, [email_id], (err, results) => {
                if(err) {
                    throw err;
                }

                const voter = results[0];
                let voter_id = voter.first_name[0] + voter.last_name[0] + Math.floor(1000 + Math.random() * 9000);
                const role = 'voter';

                // Check if the generated voter_id already exists in the 'users' table
                const checkSql = 'SELECT * FROM users WHERE voter_id = ?';
                db.query(checkSql, [voter_id], (err, result) => {
                    if(err) {
                        throw err;
                    }
                    // If the voter_id already exists, generate a new one
                    while(result.length > 0) {
                        voter_id = voter.first_name[0] + voter.last_name[0] + Math.floor(1000 + Math.random() * 9000);
                        db.query(checkSql, [voter_id], (err, result) => {
                            if(err) {
                                throw err;
                            }
                        });
                    }

                    // Insert the new user into the 'users' table
                    const insertSql = 'INSERT INTO users (voter_id, role, email_id) VALUES (?, ?, ?)';
                    db.query(insertSql, [voter_id, role, email_id], (err, result) => {
                        if(err) {
                            throw err;
                        }
                        console.log('User added to users table');
                        console.log('Sending email to '+email_id)

                        // Send an email to the voter
                        let transporter = nodemailer.createTransport({
                            host: 'smtp.zoho.com',
                            port: 465,
                            secure: true, //ssl
                            auth: {
                                user:'vedtest5@yahoo.com',
                                pass:'Testing@1'
                            }
                        });



                        let mailOptions = {
                            from: 'vedtest5@yahoo.com', // sender address
                            to: email_id, // list of receivers
                            subject: 'Dear Voter, Please Generate Password', // Subject line
                            text: `Your voter id is ${voter_id}, please use this Voter ID to login in, generate password and vote. \nPlease generate a password using the following link: http://yourwebsite.com` // plain text body
                            // update the link in text above to be the link for Password Generation page
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log('Error sending email:', error);
                            } else {
                                console.log('Email sent:', info.response);
                            }
                        });
                    });
                });
            });

            socket.emit('voterStatusUpdated');
        });
    });
    socket.on('denyVoter', (email_id) => {
        const updateSql = 'UPDATE voters SET status = ? WHERE email_id = ?';
        db.query(updateSql, ['denied', email_id], (err, result) => {
            if(err) {
                throw err;
            }
            console.log('Voter status updated to denied');
            socket.emit('voterStatusUpdated');
        });
    });

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

