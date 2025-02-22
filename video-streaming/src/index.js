const express = require("express");
const fs = require("fs");
const amqp = require('amqplib');

if (!process.env.RABBIT) {
    throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT");
}

const RABBIT = process.env.RABBIT;

function connectRabbit() {
    console.log(`Connecting to RabbitMQ server at ${RABBIT}.`);

    return amqp.connect(RABBIT)
        .then(connection => {
            console.log("Connected to RabbitMQ.");

            return connection.createChannel()
                .then(messageChannel => {
                    return messageChannel.assertExchange("viewed", "fanout")
                        .then(() => {
                            return messageChannel;
                        });
                });
        });
}

function sendViewedMessage(messageChannel, videoPath) {
    console.log(`Publishing message on "viewed" exchange.`);

    const msg = { videoPath: videoPath };
    const jsonMsg = JSON.stringify(msg);
    messageChannel.publish("viewed", "", Buffer.from(jsonMsg));
}

function setupHandlers(app, messageChannel) {
    app.get("/video", (req, res) => {

        const videoPath = "./videos/SampleVideo_1280x720_1mb.mp4";
        fs.stat(videoPath, (err, stats) => {
            if (err) {
                console.error("An error occurred ");
                res.sendStatus(500);
                return;
            }

            res.writeHead(200, {
                "Content-Length": stats.size,
                "Content-Type": "video/mp4",
            });

            fs.createReadStream(videoPath).pipe(res);

            sendViewedMessage(messageChannel, videoPath);
        });
    });
}

function startHttpServer(messageChannel) {
    return new Promise(resolve => {
        const app = express();
        setupHandlers(app, messageChannel);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve();
        });
    });
}

function main() {
    return connectRabbit()                          
        .then(messageChannel => {                   
            return startHttpServer(messageChannel); 
        });
}

main()
    .then(() => console.log("Microservice online."))
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });