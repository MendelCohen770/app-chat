import mongoose from "mongoose";
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();
const connectDB = async () => {
    try {
        const uri = process.env.DB_CONNECTION;
        if (!uri) {
            logger.fatal('DB_CONNECTION is not defined');
            process.exit(1);
        }
        await mongoose.connect(uri);
        logger.info('MongoDB Connected');
    } catch (err) {
        logger.fatal({ err }, 'Error connecting to MongoDB');
        process.exit(1);
    }
};

export default connectDB;
