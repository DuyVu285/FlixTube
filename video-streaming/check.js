const { MongoClient, ObjectId } = require("mongodb");

// 🔧 Update these values if needed
const DB_URI = "mongodb://localhost:27017"; // Change if your database is hosted elsewhere
const DB_NAME = "video-streaming"; // Replace with your actual database name
const COLLECTION_NAME = "videos";
const VIDEO_ID = "5d9e690ad76fe06a3d7ae416"; // Replace with the ID you want to check

async function checkVideoExists() {
    const client = new MongoClient(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        console.log("🔄 Connecting to MongoDB...");
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        console.log(`🔍 Searching for _id: ObjectId('${VIDEO_ID}')`);
        const video = await collection.findOne({ _id: new ObjectId(VIDEO_ID) });

        if (video) {
            console.log("✅ Video found:", video);
        } else {
            console.log("❌ Video not found.");
        }
    } catch (error) {
        console.error("❗ Error:", error);
    } finally {
        await client.close();
        console.log("🔴 Disconnected from MongoDB.");
    }
}

checkVideoExists();
