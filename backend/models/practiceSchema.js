const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// defines the structure of the model
const practiceSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    bars: {
        type: Number,
    },
    reps: {
        type: Number,
    },
    bpm: {
        type: Number,
    },
    
}, { timestamps: true });

// model
module.export = mongoose.model('Practice', practiceSchema);