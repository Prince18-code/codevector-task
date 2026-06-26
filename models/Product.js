const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

productSchema.index({ category: 1, createdAt: -1 });

// Third argument me explicitly collection ka naam 'products' enforce kar do
module.exports = mongoose.model('Product', productSchema, 'products');