const { JsonWebTokenError } = require("jsonwebtoken");
const UserSchema = require("../models/user");
const returnCodes = require("./returnCodes");
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
module.exports= {
    sendSuccess:   async ( res,responseCode, data)=>{
        res.status(responseCode).json({
            "message":"Success",
            "code": returnCodes.success,
            "data": data
        });
    },
    sendError:   async (res, responseCode, err)=>{
        res.status(responseCode).json({
            "message":"Failure",
            "code": returnCodes.failue,
            "error": err
        });
    },
    isEmpty: (data)=>{
        return typeof data === "undefined" || data ===null || data === "" || data.length === 0;
    },

    checkPassword:async (password, hashedPassword) =>{
      let matched=  await bcrypt.compare(password,hashedPassword)
      if(!matched){
        return false;
      }
      return true;
    },

    findUserByEmailOrPhone : async (email,phone)=>{
        const account = await  UserSchema.findOne({$or: [{'email': email}, {'phone': phone}]})
        return account ?? undefined; 
    },

    decodeSession : (req,res)=>{
        const session = req.cookies.Session;
       return jwt.verify(session.token,process.env.SECRET_KEY);
    }
}