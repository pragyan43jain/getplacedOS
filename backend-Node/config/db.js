import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    if (!connectionPromise) {
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/getplaced";
        connectionPromise = mongoose
            .connect(uri, {
                family: 4,
                maxPoolSize: 5,
                serverSelectionTimeoutMS: 10000,
            })
            .then((conn) => {
                console.log(`MongoDB Connected: ${conn.connection.host}`);
                return conn.connection;
            })
            .catch((error) => {
                connectionPromise = undefined;
                console.error(`MongoDB connection error: ${error.message}`);
                throw error;
            });
    }

    return connectionPromise;
};

export default connectDB;
