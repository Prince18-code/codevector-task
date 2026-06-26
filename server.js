require('dotenv').config(); // .env file load karne ke liye
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());

// Express ko batao ki hum EJS template engine use kar rahe hain views ke liye
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB Connection via .env
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("⚡ MongoDB Connected Successfully!"))
    .catch(err => console.error("❌ Database Connection Error:", err));

// Product Model Setup
const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    category: String,
    price: Number
}, { timestamps: true }));

// 🏠 1. HOME ROUTE: Live URL par jaate hi seedha HTML/UI kholega
app.get('/', (req, res) => {
    res.render('index');
});

// 📡 2. MAIN API ROUTE: Browse, Filter, aur Cursor Pagination Logic
app.get('/api/products', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20; // Ek page me 20 products
        const { category, next_cursor } = req.query;

        let query = {};

        // Category Filter logic
        if (category) {
            query.category = category;
        }

        // CURSOR LOGIC: Agar frontend se next_cursor aaya hai, 
        // toh database se us timestamp se sirf PURANA data mangwao ($lt = Less Than)
        if (next_cursor) {
            query.createdAt = { $lt: new Date(next_cursor) };
        }

        // DB Query execution: sort Newest First (-1) aur limit lagao
        const products = await Product.find(query)
            .sort({ createdAt: -1 }) 
            .limit(limit);

        // Agla cursor ready karo (Is current list ke sabse aakhri item ka createdAt timestamp)
        let nextCursor = null;
        if (products.length === limit) {
            nextCursor = products[products.length - 1].createdAt;
        }

        // Response send karo
        res.json({
            success: true,
            count: products.length,
            products,
            next_cursor: nextCursor
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Complete Product live on http://localhost:${PORT}`));