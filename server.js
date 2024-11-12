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
const connections = {}
const models = {}
//
const bankUserSchema = new mongoose.Schema({});
//
const getConnection = async (dbName) => {
    if (connections != dbName) { 
        connections[dbName] = await mongoose.createConnection(process.env.MONGO_URI, { dbName: dbName });
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
        const dynamicSchema = new mongoose.Schema({}, { strict: false });
        models[modelKey] = connection.model(
            collectionName,
            dynamicSchema,
            collectionName
        );
        //
        console.log("Created new model for collection:", collectionName);
    }
    //
    return models[modelKey];
};
//
app.get('/find/:database/:collection', async (req, res) => {
    try {
        const { database, collection } = req.params;
        const Model = await getModel(database, collection);
        const documents = await Model.find({});
        console.log(`Query executed, document count is: ${document.length}`);
        //
        res.status(200).json(documents);
    } catch (err) {
        console.error("Error in GET route, " err)
        //
        res.status(500)
    }
})
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