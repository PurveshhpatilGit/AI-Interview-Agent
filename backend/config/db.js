import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.set("autoIndex", false);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
