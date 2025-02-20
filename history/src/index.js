const express = require("express");

function setUpHandlers(app) {

}

function startHttpServer(app) {
    return new Promise((resolve) => {
        const app = express();
        setUpHandlers(app);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            console.log(`Listening on port ${port}.`);
            resolve();
        });
    });
};

function main() {
    console.log("Starting history service...");
    return startHttpServer();
}

main()
    .then(() => { console.log("Microservice online."); })
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });