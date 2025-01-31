import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const createToken = (id) => {
    return jwt.sign({id},process.env.JWT_SECRET)
}


// Route for user login
const loginUser = async (req, res) => {

    try {
        
        const { email , password } = req.body;

        const user = await userModel.findOne({email});

        if (!user) {
            return res.json({success:false, message:"User Doesnt Exist"})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            
            const token = createToken(user._id)
            res.json({success:true, token})
        }
        else{
            return res.json({success:false, message:"Incorrect credentials"})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false, message:error.message})
    }
}

//Route for user register

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        //checking user already exist or not
        const exists = await userModel.findOne({email});
        if (exists) {
            return res.json({success:false, message:"User Already Exists"})
        }

        //validating email format & strong password

        if (!validator.isEmail(email)) {
            return res.json({success:false, message:"Please enter a valid email"})
        }
        if (password.length < 8) {
            return res.json({success:false, message:"Please enter a strong password"})
        }
        // hashing user password

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new userModel({
            name,
            email,
            password:hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user._id)
        res.json({success:true, token})


    } catch (error) {
        console.log(error);
        res.json({success:false, message:error.message})

    }
}

//Route for admin login
const adminLogin = async (req, res) => {
    try {
        
        const {email,password} = req.body

        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email+password, process.env.JWT_SECRET);
            res.json({success:true, token})
        } else{
            res.json({success:false, message:"Invalid credentials"})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false, message:error.message})
    }
}
const userProfile = async(req, res) => {
    
    {
        const user = await userModel.findById(req.userId);  // Assuming user ID is decoded from JWT
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, user });
      }
}

export { loginUser, registerUser, adminLogin, userProfile}