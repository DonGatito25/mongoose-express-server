const mongoose = require("mongoose");
const grocerySchema = new mongoose.Schema({
    item: {
        type: String
    },
    food_group: {
        type: String,
        required: [true, 'The property `food_group` is required.'],
        enum: ['Fruits', 'Dairy', 'Protains', 'Vegetables', 'Grains', 'Nuts']
    },
    price_in_usd: {
        type: Number,
        required: [true, 'The property `price_in_usd` is required.'],
        min: [0, 'Price must be a positive number.']
    },
    
});
//
module.exports = mongoose.model("GroceryItem", grocerySchema);