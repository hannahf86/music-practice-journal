require('dotenv').config();
const express = require('express');
const practiceRoutes = require('./routes/practice')

// 1. START THE APP
const app = express();

// 2. LISTEN FOR REQUESTS
app.listen(process.env.PORT, () => {
    console.log('listening on port', process.env.PORT);
});

// 3. GLOBAL MIDDLEWARE - checks every request
app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// 4. ROUTE HANDLER - grabs the routes from practice.js
app.use('/api/practice', practiceRoutes)