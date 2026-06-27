require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Product = require('./models/Product');
 
const app = express();
const PORT = process.env.PORT || 3000;
 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connection established successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));
 
// ✅ FIX: Yeh JSON API route add karo — yahi fetch kar raha tha index.ejs ka JS
app.get('/api/products', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const { category, next_cursor } = req.query;
 
        let query = {};
 
        if (category) {
            query.category = category;
        }
 
        if (next_cursor) {
            query._id = { $lt: mongoose.Types.ObjectId.createFromHexString(next_cursor) };
        }
 
        console.log("Executing DB Query:", JSON.stringify(query));
 
        const products = await Product
            .find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)   // ✅ 1 extra fetch karo — hasNextPage detect karne ke liye
            .lean();
 
        const hasNextPage = products.length > limit;
        if (hasNextPage) products.pop(); // extra item hata do
 
        const newCursor = hasNextPage ? products[products.length - 1]._id.toString() : null;
 
        console.log(`Fetched ${products.length} products. hasNextPage: ${hasNextPage}`);
 
        // ✅ JSON response bhejo (HTML nahi)
        res.json({
            products,
            next_cursor: newCursor,
            hasNextPage
        });
 
    } catch (error) {
        console.error("Error in /api/products:", error);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});
 
// HTML page serve karne ke liye root route
app.get('/', (req, res) => {
    res.render('index');
});
 
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});