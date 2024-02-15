require('dotenv').config();
const express = require('express');

// start the app
const app = express();


// route handler
app.get('/', (req, res) => {
    res.json({mssg: 'Welcome to the app'})
});


// listen for requests
app.listen(process.env.PORT, () => {
    console.log('listening on port', process.env.PORT);
});