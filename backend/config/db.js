// import mongoose from "mongoose";

// export const connectDB =async()=>{
//     try{
//     await mongoose.connect(process.env.MONGO_URL);
//     console.log("Mongodb connected sucessful!");
//     }catch(error)
//     {
//         console.log(error);
//     }
    
// }
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);

        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.log("MongoDB connection error:", error);
    }
};