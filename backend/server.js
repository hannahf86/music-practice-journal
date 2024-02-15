require('dotenv').config();
const express = require('express');
const practiceRoutes = require('./routes/practice');
const mongoose = require('mongoose');

// 1. START THE APP
const app = express();

// ****** REMOVE ******
// 2. LISTEN FOR REQUESTS - 
// app.listen(process.env.PORT, () => {
//     console.log('listening on port', process.env.PORT);
// });

// 3. GLOBAL MIDDLEWARE - checks every request
app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// 4. ROUTE HANDLER - grabs the routes from practice.js
app.use('/api/practice', practiceRoutes)

// 5. CONNECT TO DB - asynchronous
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log('connected to db and listening on port', process.env.PORT);
        });
    })
    .catch((error) => {
        console.log('Oh no! There was an error!')
    })