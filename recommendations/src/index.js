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

function setupHandlers(app, db, messageChannel) {

    const historyCollection = db.collection("videos");

    function consumeViewedMessage(msg) { 
        const parsedMsg = JSON.parse(msg.content.toString()); 
        console.log("Received a 'viewed' message:");
        console.log(JSON.stringify(parsedMsg, null, 4));

        console.log("Acknowledging message was handled.");

        messageChannel.ack(msg);
    };

    return messageChannel.assertExchange("viewed", "fanout")
        .then(() => {
            return messageChannel.assertQueue("", { exclusive: true });
        })
        .then(response => {
            const queueName = response.queue;
            console.log(`Created queue ${queueName}, binding it to "viewed" exchange.`);
            return messageChannel.bindQueue(queueName, "viewed", "")
                .then(() => {
                    return messageChannel.consume(queueName, consumeViewedMessage);
                });
        });
}

function startHttpServer(db, messageChannel) {
    return new Promise(resolve => { 
        const app = express();
        app.use(bodyParser.json());
        setupHandlers(app, db, messageChannel);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve();
        });
    });
}

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
    .then(() => console.log("Microservice online."))
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });