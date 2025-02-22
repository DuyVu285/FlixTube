const express = require("express");
const mongodb = require("mongodb");
const bodyParser = require('body-parser');
const amqp = require("amqplib");

if (!process.env.DB_HOST) {
    throw new Error("Please specify the databse host using environment variable DBHOST.");
}

if (!process.env.DB_NAME) {
    throw new Error("Please specify the name of the database using environment variable DBNAME");
}

if (!process.env.RABBIT) {
    throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT");
}

const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const RABBIT = process.env.RABBIT;

function connectDb() {
    return mongodb.MongoClient.connect(DB_HOST)
        .then(client => {
            return client.db(DB_NAME);
        });
}

function connectRabbit() {

    console.log(`Connecting to RabbitMQ server at ${RABBIT}.`);

    return amqp.connect(RABBIT)
        .then(messagingConnection => {
            console.log("Connected to RabbitMQ.");

            return messagingConnection.createChannel();
        });
}

function setUpHandlers(app, db, messageChannel) {

    const videosCollection = db.collection("videos");
    console.log("Connected to database.");
    app.post("/viewed", (req, res) => {
        const videoPath = req.body.videoPath;
        videosCollection.insertOne({ videoPath: videoPath })
            .then(() => {
                console.log(`Added video ${videoPath} to history.`);
                res.sendStatus(200);
            })
            .catch(err => {
                console.error(`Error adding video ${videoPath} to history.`);
                console.error(err && err.stack || err);
                res.sendStatus(500);
            });
    });

    app.get("/history", (req, res) => {
        const skip = parseInt(req.query.skip);
        const limit = parseInt(req.query.limit);
        videosCollection.find()
            .skip(skip)
            .limit(limit)
            .toArray()
            .then(documents => {
                res.json({ history: documents });
            })
            .catch(err => {
                console.error(`Error retrieving history from database.`);
                console.error(err && err.stack || err);
                res.sendStatus(500);
            });
    });
}

function startHttpServer(db, messageChannel) {
    return new Promise((resolve) => {
        const app = express();
        app.use(bodyParser.json());
        setUpHandlers(app, db, messageChannel);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve();
        });
    });
};

function main() {
    return connectDb()
        .then(db => {
            return connectRabbit()
                .then(messageChannel => {
                    return startHttpServer(db, messageChannel);
                });
        });
}

main()
    .then(() => { console.log("Microservice starts."); })
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });