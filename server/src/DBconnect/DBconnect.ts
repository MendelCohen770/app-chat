import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();
const connectDB = async () => {
    try{
        const uri= process.env.DB_CONNECTION;
        console.log(uri);
        
        await mongoose.connect(uri as string);
        console.log('MongoDB Connected...');
    }catch(err){
        console.error("Error connecting to MongoDB", err);
        process.exit(1);
    }
}

export default connectDB;