require("dotenv").config()
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const UtilsController = require("../Utils/UtilsController");


const userSchema = mongoose.Schema({
    Name:{
        type :String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique:true,
    },
    password:{
        type: String,
        required: true,
    },
    createdAt:{
        type: Number,
        default: Math.floor(Date.now()/1000)
    }
    ,
    phone:{
        type: Number,
        minLength: 10,
        required: true,
    },
    isDeleted:{
        type: Boolean,
        default: false
    },
    profilePhoto:{
        type: String,
        default: "",

    }, 
    accessTokens:[{
        token:{
            type: String,
            required: true,
        }
        ,createdAt:{
            type: String,
            default : Math.floor(Date.now()/1000)
        },
        isExpired:{
            type: Boolean,
            default:false
        }
    }]
},{collection: "Users"});


userSchema.methods.generateToken = async function(){
    const token  = jwt.sign({_id:this._id,email:this.email},process.env.SECRET_KEY,{expiresIn: "14 days" })
    this.accessTokens.push({token:token,createdAt:(Math.floor(Date.now()/1000))});

}

userSchema.pre("save",async function (){
   if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,10);
   }

   await this.generateToken();
});
const UserSchema = new mongoose.model("Users",userSchema);
module.exports = UserSchema;