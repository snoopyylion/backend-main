import { v2 as cloudinary } from "cloudinary"


const connectCloudinary = async () => {

    
cloudinary.config({
    cloud_name: 'dhtzhpbwf',
    api_key: '751537321261127',
    api_secret: 'B0qXdigo8RlL0BBk4AwsrjrrYj4',
  });

}

export default connectCloudinary;