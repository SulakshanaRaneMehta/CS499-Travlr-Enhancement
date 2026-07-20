const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    code: { type: String, required: true, trim: true, maxlength: 20, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 100, index: true },
    length: { type: String, required: true, trim: true, maxlength: 50 },
    start: { type: Date, required: true },
    resort: { type: String, required: true, trim: true, maxlength: 100 },
    perPerson: { type: String, required: true, trim: true, match: /^\d+(\.\d{1,2})?$/ },
    image: { type: String, required: true, trim: true, maxlength: 255 },
    description: { type: String, required: true, trim: true, maxlength: 1000 }
});

const Trip = mongoose.model('trips', tripSchema);
module.exports = Trip;
