const express = require('express');
const mysql = require('mysql2');
const socketIo = require("socket.io");
const http = require("http");
const nodemailer = require('nodemailer');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;
const session = require('express-session');

app.use('/public', express.static('public'));

// Create connection

const sessionMiddleware = session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if your website uses https
  });
app.use(sessionMiddleware);

const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'vedansh',
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
app.get('/ChangeDetails', (req, res) => {
    if (req.session.userId) {
        res.sendFile('./views/changeDetails.html', {root: __dirname});
    } else {
        res.status(403).send('Unauthorized');
    }
});
app.get('/CreatePassword',(req,res) =>{
    console.log("Create Password Page");
    res.sendFile('./views/createPassword.html',{root: __dirname});
});
app.get('/Voter', (req, res) => {
    if (req.session.role === 'voter') {
        res.sendFile('./views/voter.html', {root: __dirname});
    } else {
        res.status(403).send('Unauthorized');
    }
});
app.get('/Admin', (req, res, next) => {
    if (req.session.role === 'admin' || req.session.role === 'manager') {
        res.sendFile('./views/admin.html', {root: __dirname});
    } else {
        res.status(403).send('Unauthorized');
    }
});
app.get('/', (req, res) => {
    console.log('Connected to MySQL Database');
    res.sendFile('./views/index.html', {root: __dirname});
});
app.get('/Login',(req,res) =>{
    console.log("Login Page");
    res.sendFile('./views/login.html',{root: __dirname});
})
app.get('/Logout',(req,res) =>{
    console.log("Logged Out");
    res.sendFile('./views/login.html',{root: __dirname});
})
app.get('/RequestAccount',(req,res) =>{
    console.log("Request Account Page");
    res.sendFile('./views/request.html',{root: __dirname});
})
app.get('/ForgotPassword',(req,res) =>{
    console.log("ForgotPassword Page");
    res.sendFile('./views/forgotpassword.html',{root: __dirname});
})/*
app.get('/NewPrecinct',(req,res) =>{
    console.log("adding new Precinct");
    res.sendFile('./views/admin.html',{root: __dirname});
})
app.get('/NewRace',(req,res) =>{
    console.log("adding new Race");
    res.sendFile('./views/admin.html',{root: __dirname});
})
app.get('/NewElection',(req,res) =>{
    console.log("adding new Election");
    res.sendFile('./views/admin.html',{root: __dirname});
})
    */
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
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
    socket.on('NewElection', (data)=>{

        const insertSql = 'INSERT INTO  elections (title, Race, Start_Time, End_Time) VALUES (?, ?, ?, ?)';
        db.query(insertSql, [data.electionTitle, data.races, data.startTime,data.endTime], (err, result) => {
            if(err) {
                throw err;
            }
        })
    });
    socket.on('NewRace', (data)=>{

        const insertSql = 'INSERT INTO  races (race_title, Canidadates, zipcode) VALUES (?, ?, ?)';
        db.query(insertSql, [data.raceTitle, data.candidates, data.precinctZipCode], (err, result) => {
            if(err) {
                throw err;
            }
        })
    });
    socket.on('NewPrecinct', (data)=>{

        const insertSql = 'INSERT INTO precinct (zipcode, last_4_Digits, voting_location,polling_manager,state_election_contact) VALUES (?, ?, ?, ?, ?)';
        db.query(insertSql, [data.zipCode, data.lastFourDigits, data.votingLocation,data.pollingManager,data.stateElectionContact], (err, result) => {
            if(err) {
                throw err;
            }
        })
    });
    socket.on('ForgotPassword', (data)=>{
        const sql = 'SELECT 1 FROM users WHERE email_id = '+"'"+data.email+"' AND voter_id = '" +
            data.voterID+"' ORDER BY email_id LIMIT 1"
        db.query(sql, (err, results) => {
            if (err) {
                throw err;
            }
            if (results.length > 0) {
                let data1 = {
                    valid: "1"
                }

                let transporter1 = nodemailer.createTransport({
                    host: 'smtp.zoho.com',
                    port: 465,
                    secure: true, //ssl
                    auth: {
                        user:'vedtest5@yahoo.com',
                        pass:'Testing@1'
                    }
                });
                let mailOptions1 = {
                    from: 'vedtest5@yahoo.com', // sender address
                    to: data.email, // list of receivers
                    subject: 'Dear Voter, Please Generate Password', // Subject line
                    text: `Please generate a new password using the following link: http://localhost:3000/CreatePassword` // plain text body
                };

                transporter1.sendMail(mailOptions1, (error, info) => {
                    if (error) {
                        console.log('Error sending email:', error);
                    } else {
                        console.log('Email sent:', info.response);
                    }
                });
                socket.emit('validationForgotPassword',data1)
            }else{
                let data2= {
                    valid : "0"
                }
                socket.emit('validationForgotPassword',data2)
            }
        })
    })
    socket.on('searchVoter',(data)=>{
        let sql = ""
        if(data.criteria === "name"){
            sql = "SELECT * FROM voters WHERE first_name = '"+data.value+"'";
        }else if(data.criteria ==="zipcode"){
            sql = "SELECT * FROM voters WHERE Zipcode = '"+data.value+"'";
        }
        if(sql !== ""){
            db.query(sql,(err, results) => {
                if(err){
                    throw err;
                }
                socket.emit('searchResults',results);
            })
        }
    })
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
                            text: `Your voter id is ${voter_id}, please use this Voter ID to login in, generate password and vote. \nPlease generate a password using the following link: http://localhost:3000/CreatePassword` // plain text body
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
    socket.on('Logout', () => {
        // Destroy the session
        socket.request.session.destroy(err => {
            if (err) {
                console.log('Error destroying session:', err);
            } else {
                console.log('Session destroyed');
                socket.emit('loggedOut');
            }
        });
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
                let data2 ={
                    valid : "0"
                }
                socket.emit('validation',data2)
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
                let data1 ={
                    valid : "1"
                }
                socket.emit('validation',data1)
            }
        });

    })
    socket.on('login',(data)=>{
        const { voterId, password } = data;
        const selectSql = 'SELECT * FROM users WHERE voter_id = ? AND password = ?';
        db.query(selectSql, [voterId,password], (err, results) => {
            if(err) {
                throw err;
            }
            if(results.length > 0) {
                let tempData = {
                    user : voterId,
                    role : results[0].role
                }
                console.log("successful login")
                socket.emit('loginSuccess',tempData);
    
                // Set the session id to the voter id
                socket.request.session.userId = voterId;
                // Store the user's role in the session
                socket.request.session.role = results[0].role;
                socket.request.session.email_id = results[0].email_id;
                // Save the session before emitting the event
                socket.request.session.save(err => {
                    if (err) {
                        console.log('Error saving session:', err);
                    } else {
                        console.log(socket.request.session);
                        socket.emit('sessionSaved');
                    }
                });

            } else {
                console.log("failed login")
                socket.emit('loginFailed');
            }
        });
    })
    socket.on('createPassword', (data) => {
        const { voterId, password } = data;
        const selectSql = 'SELECT * FROM users WHERE voter_id = ? AND password IS NULL';
        db.query(selectSql, [voterId], (err, results) => {
            if(err) {
                throw err;
            }
            if(results.length > 0) {
                const updateSql = 'UPDATE users SET password = ? WHERE voter_id = ?';
                db.query(updateSql, [password, voterId], (err, result) => {
                    if(err) {
                        throw err;
                    }
                    console.log('Password updated for voter');
                    socket.emit('passwordUpdated');
                });
            } else {
                console.log('Invalid voter ID or password already set');
                socket.emit('passwordUpdateFailed');
            }
        });
    })
    socket.on('changeDetails', (data) => {
        const { address, city, zipcode } = data;
        const email_id = socket.request.session.email_id;
        const updateSql = 'UPDATE voters SET address = ?, city = ?, zipcode = ? WHERE email_id = ?';
        db.query(updateSql, [address, city, zipcode, email_id], (err, result) => {
            if(err) {
                throw err;
            }
            console.log('Voter details updated');
            socket.emit('detailsChanged');
        });
    })


});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

