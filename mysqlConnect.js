const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Create connection
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

app.get('/', (req, res) => {
    res.send('Connected to MySQL Database');
});

app.get('/voters', (req, res) => {

    let voter_id = req.query.voter_id; //take as an input from frontend
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
        res.send(voter_details);
        //take inputs into the frontend from voter_details for displaying
    });
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
