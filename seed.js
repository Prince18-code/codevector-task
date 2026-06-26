require('dotenv').config(); // to load .env file
const mongoose = require('mongoose');

// Mongoose Schema Setup
const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    price: Number
}, { 
    timestamps: true //  createdAt and updatedAt automatically
});

// Compound Indexing
productSchema.index({ category: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

const categories = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports'];

async function seedDatabase() {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ Error: MONGO_URI environment variable is not set. Please check your .env file.");
            process.exit(1);
        }

        console.log("connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("cleaning previous data...");
        await Product.deleteMany({}); 

        const totalRecords = 200000;
        const batchSize = 5000; // 5000 databulk insert at once
        console.log("Generating 2 lakh sample data...");

        for (let i = 0; i < totalRecords; i += batchSize) {
            const batch = [];
            for (let j = 0; j < batchSize; j++) {
                batch.push({
                    name: `Premium Product #${i + j + 1}`,
                    category: categories[Math.floor(Math.random() * categories.length)],
                    price: Math.floor(Math.random() * 1000) + 15
                });
            }
            await Product.insertMany(batch); // Bulk insert command
            console.log(`Progress: ${i + batchSize} / ${totalRecords} products inserted.`);
        }
        
        console.log("Database seeding complete! 2 Lakh products successfully insert ho gaye hain.");
        process.exit(0);
    } catch (err) {
        console.error("Error while seeding database:", err);
        process.exit(1);
    }
}

seedDatabase();