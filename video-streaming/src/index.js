const express = require("express");
const fs = require("fs");
const http = require("http");

function sendViewedMessage(videoPath) {
    const postOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    };

    const requestBody = {
        videoPath: videoPath 
    };

    const req = http.request(
        "http://history/viewed",
        postOptions
    );

    req.on("close", () => {
        console.log("Sent 'viewed' message to history microservice.");
    });

    req.on("error", (err) => {
        console.error("Failed to send 'viewed' message!");
        console.error(err && err.stack || err);
    });

    req.write(JSON.stringify(requestBody));
    req.end();
}

function setupHandlers(app) {
    app.get("/video", (req, res) => {
        console.log("Received request for video.");
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

            sendViewedMessage(videoPath);
        });
    });
}

function startHttpServer() {
    return new Promise(resolve => {
        const app = express();
        setupHandlers(app);
        
        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve();
        });
    });
}

function main() {
    return startHttpServer();
}

main()
    .then(() => console.log("Microservice online."))
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });