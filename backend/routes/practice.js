// -------- API ENDPOINTS --------
// get /practice --> gets all practice records
// get /practice/:id --> get a single practice record
// post /practice --> creates a new practice record for the week
// delete /practice/:id --> deletes a practice record
// patch /practice/:id --> updates a practice record

const express = require('express');
const router = express.Router();

// GET all practice records
router.get('/', (req, res) => {
    res.json({messg: 'GET all practice records'})
})

// GET a single practice record
router.get('/:id', (req, res) => {
    res.json({messg: 'GET a single practice record'})
})

// POST a single practice record
router.post('/', (req, res) => {
    res.json({messg: 'POST a single practice record'})
})

// DELETE a single practice record
router.delete('/:id', (req, res) => {
    res.json({messg: 'DELETE a single practice record'})
})

// PATCH a single practice record
router.patch('/:id', (req, res) => {
    res.json({messg: 'UPDATE a single practice record'})
})



module.exports = router