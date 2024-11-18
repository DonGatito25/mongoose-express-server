const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
//
dotenv.config()
//
const app = express();
const port = process.env.PORT || 3000;
//
app.use(express.json());
//
const GroceryItem = require("./models/GroceryItem");
const Employee = require("./models/Employee");

const modelMapping = {
    GroceryInventory: GroceryItem,
    Employees: Employee,
};
//
const connections = {}
const models = {}
//
const bankUserSchema = new mongoose.Schema({});
//
const getConnection = async (dbName) => {
    if (connections != dbName) {
        connections[dbName] = await mongoose.createConnection(process.env.MONGO_URI, { dbName: dbName, autoIndex: false });
        //
        await new Promise((resolve, reject) => {
            connections[dbName].once("open", resolve);
            connections[dbName].once("error", reject);
        });
        //
        console.log(dbName);
    } else {
        console.log("Reusing existing connection DBName.")
    };
    //
    return connections[dbName];
}
//
const getModel = async (dbName, collectionName) => {
    console.log("getModel called with:", { dbName, collectionName });
    const modelKey = `${dbName}-${collectionName}`;
    //
    if (!models[modelKey]) {
        const connection = await getConnection(dbName);
        //
        const Model = modelMapping[collectionName];
        if (!Model) {
            const dynamicSchema = new mongoose.Schema(
                {},
                { strict: false, autoIndex: false }
            );
            //
            models[modelKey] = connection.model(
                collectionName,
                dynamicSchema,
                collectionName
            );
            //
            console.log(`Created dynamic model for collection: ${collectionName}`);
        } else {
            models[modelKey] = connection.model(
                Model.modelName,
                Model.schema,
                collectionName
            );
            //
            console.log("Created new model for collection:", collectionName);
        }
    }
    //
    return models[modelKey];
};
//
app.get('/find/:database/:collection', async (req, res) => {
    try {
        // Extract the database and collection from request parameters
        const { database, collection } = req.params;
        // Get the appropriate Mongoose model
        const Model = await getModel(database, collection);
        // Retrieve all documents from the colllection
        const documents = await Model.find({});
        // Log the number of documents retrieved
        console.log(`Query executed, document count is: ${documents.length}`);
        // Send back the documents with a 200 status code
        res.status(200).json(documents);
    } catch (err) {
        // Log error to the console
        console.error("Error in GET route ", err)
        // Send back a 500 status code with the error message
        res.status(500)
    }
})
//
app.post('/insert/:database/:collection', async (req, res) => {
    try {
        const { database, collection } = req.params;
        const data = req.body
        const Model = await getModel(database, collection);
        const newDocument = new Model(data);
        //
        await newDocument.save();
        //
        console.log(`Query executed, document posted to collection ${collection}.`)
        //
        res.status(201).json({ message: "Document posted successfully.", document: newDocument })
    } catch (err) {
        console.error("Error in POST route ", err)
        //
        res.status(400).json({ error: err.message })
    }
})
//
app.put('/update/:database/:collection/:id', async (req, res) => {
    try {
        const { database, collection, id } = req.params;
        const data = req.body;
        const Model = await getModel(database, collection);
        //
        const updatedDocument = await Model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        //
        if (!updatedDocument) {
            return res.status(404).json({ message: "Document not found." });
        };
        //
        console.log("Updated document successfully.");
        //
        res.status(200).json({ message: "Document updated successfully." })
    } catch (err) {
        console.error("Error in PUT route ", err);
        //
        res.status(400).json({ error: err.message })
    }
})
//
app.delete("/delete/:database/:collection/:id", async (req, res) => {
    try {
        const { database, collection, id } = req.params;
        const data = req.body;
        const Model = await getModel(database, collection);
        //
        const deletedDocument = await Model.findByIdAndDelete(id)
        if (!deletedDocument) {
            return res.status(404).json({ message: "Document not found."})
        }
        console.log("Document deleted successfully.")
    } catch (err) {

    }
});
//
app.delete('/delete-collection/:database/:collection', async (req, res) => {
    try {
        const { database, collection } = req.params;
        const connection = await getConnection(database); // Establish or retrieve the connection
        // Check if the collection exists
        const collections = await connection.db.listCollections({ name: collection }).toArray();
        const collectionExists = collections.length > 0;

        if (!collectionExists) {
            return res.status(404).json({ error: `Collection '${collection}' does not exist in database '${database}'.` });
        }
        // Drop the collection
        await connection.db.dropCollection(collection);
        console.log(`Collection '${collection}' deleted from database '${database}'.`);
        // Remove all models associated with this collection
        const modelKey = `${database}-${collection}`;
        delete models[modelKey];
        res.status(200).json({ message: `Collection '${collection}' has been successfully deleted from database '${database}'.` });
    } catch (err) {
        console.error('Error deleting collection:', err);
        res.status(500).json({ error: 'An error occurred while deleting the collection.' });
    }
});
//
const startServer = async () => {
    try {
        app.listen(port, () => {
            console.log(`The server is running on port ${port}`);
        })
    } catch (err) {
        console.error("Error starting server", err);
        process.exit();
    }
}

startServer()