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

app.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const { category, next_cursor } = req.query;

        let query = {};
        
        // 1. Category Filter Check
        if (category) {
            query.category = category;
        }

        // 2. Strict Cursor Check
        if (next_cursor) {
            query._id = { $lt: next_cursor }; 
        }

        console.log("Executing DB Query with payload:", JSON.stringify(query));

        // 3. Force lean execution to directly pass plain JSON array to EJS
        const products = await mongoose.model('Product')
            .find(query)
            .sort({ _id: -1 }) // Cursor-based fallback sequence
            .limit(limit)
            .lean();

        console.log(`Successfully fetched ${products.length} products from Atlas.`);

        const hasNextPage = products.length === limit;
        const newCursor = hasNextPage ? products[products.length - 1]._id.toString() : null;

        // 4. Ensure variables match exact EJS expected placeholders
        res.render('index', {
            products: products || [],
            currentCategory: category || '',
            nextCursor: newCursor,
            limit: limit
        });

    } catch (error) {
        console.error("Error executing product query wrapper:", error);
        res.status(500).send("Internal Server Error: Query Mismatch");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});