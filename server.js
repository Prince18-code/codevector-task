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
            .limit(limit + 1)   
            .lean();
 
        const hasNextPage = products.length > limit;
        if (hasNextPage) products.pop(); 
 
        const newCursor = hasNextPage ? products[products.length - 1]._id.toString() : null;
 
        console.log(`Fetched ${products.length} products. hasNextPage: ${hasNextPage}`);
 
       
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
 

app.get('/', (req, res) => {
    res.render('index');
});
 
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});