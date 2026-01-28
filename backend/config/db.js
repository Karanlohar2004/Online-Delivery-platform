import mongoose from "mongoose";

export const connectDB = async () =>{
    await mongoose.connect('mongodb+srv://karanlohar:Karanlohar@cluster0.vjauinb.mongodb.net/food-del').then(()=> console.log("DB connected"))
}

