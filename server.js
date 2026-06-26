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
        const category = req.query.category || 'All';
        const nextCursor = req.query.nextCursor;

        let query = {};
        if (category !== 'All') {
            query.category = category;
        }

        if (nextCursor) {
            query.createdAt = { $lt: new Date(nextCursor) };
        }

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        let hasNextPage = false;
        let lastTimestamp = null;

        if (products.length > 0) {
            lastTimestamp = products[products.length - 1].createdAt;
            
            let nextPageQuery = { ...query };
            nextPageQuery.createdAt = { $lt: lastTimestamp };
            
            const nextProduct = await Product.findOne(nextPageQuery).sort({ createdAt: -1 });
            if (nextProduct) {
                hasNextPage = true;
            }
        }

        res.render('index', {
            products,
            category,
            limit,
            nextCursor: hasNextPage ? lastTimestamp.toISOString() : null
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});