import mongoose from "mongoose";


const connectDB = async () => {

    mongoose.connection.on('connected' , () => {
        console.log("DB RUNNing");
    })

    await mongoose.connect(`${process.env.MONGODB_URL}/mufazza`)

}

export default connectDB;