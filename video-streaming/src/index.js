const express = require("express");
const http = require("http");
const mongodb = require("mongodb");

const app = express();

if (!process.env.PORT) {
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

if (!process.env.VIDEO_STORAGE_HOST) {
    throw new Error("Please specify the host name for the video storage microservice in variable VIDEO_STORAGE_HOST.");
}

if (!process.env.VIDEO_STORAGE_PORT) {
    throw new Error("Please specify the port number for the video storage microservice in variable VIDEO_STORAGE_PORT.");
}

const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
console.log(`Forwarding video requests to ${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}.`);
console.log("DBHOST:", process.env.DBHOST);
console.log("DBNAME:", process.env.DBNAME);


function main() {
    return mongodb.MongoClient.connect(DB_HOST)
        .then(client => {
            const db = client.db(DB_NAME);
            const videosCollection = db.collection("videos");
            videosCollection.findOne({ _id: videoId })
                .then(videoRecord => {
                    if (!videoRecord) {
                        res.sendStatus(404);
                        return;
                    }

                    const forwardRequest = http.request(
                        {
                            host: VIDEO_STORAGE_HOST,
                            port: VIDEO_STORAGE_PORT,
                            path: '/video?path=SampleVideo_1280x720_1mb.mp4',
                            method: 'GET',
                            headers: req.headers
                        },
                        forwardResponse => {
                            res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
                            forwardResponse.pipe(res);
                        }
                    );

                    req.pipe(forwardRequest);
                })
                .catch(err => {
                    console.error("Database query failed:", error);
                    console.error(err && err.stack || err);
                    res.sendStatus(500);
                });
            app.listen(PORT, () => {
                console.log(`Microservice online`);
            });
        });
}

main()
    .then(() => { console.log("Microservice online.") })
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });

