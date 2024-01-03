require("dotenv").config()

const mongoose =require("mongoose");

const connectToDb =  mongoose.connect(process.env.MONGODB_URI);

module.exports ={connectToDb};