import mongoose from "mongoose";

const connectDB = async () => {
    try{
        const uri= process.env.DB_CONNECTION;

        await mongoose.connect(uri as string);
        console.log('MongoDB Connected...');
    }catch(err){
        console.error("Error connecting to MongoDB");
        process.exit(1);
    }
}

export default connectDB;