require("dotenv").config()
const jwt = require("jsonwebtoken");
const UtilsController = require("../Utils/UtilsController");
const UserSchema = require("../models/user");
const mongoose = require('mongoose');
const returnCodes = require("../Utils/returnCodes");
module.exports = {
    authMiddleWare : async(req,res,next)=>{
       try{
        const session =  req.cookies.Session;
        
        if(UtilsController.isEmpty(session)) {
           UtilsController.sendError(res,401,{
               "message" : "You are currently not logged in.",
              "responseCode": returnCodes.invalidSession,
           })
           return;
        }

        const decodedToken =  jwt.verify(session.token,process.env.SECRET_KEY);
       
        if(!decodedToken){
            UtilsController.sendError(res,401,{
                "message" : "Invalid token present in header, try to re-login",
               "responseCode": returnCodes.invalidSession,
            })
           return;
        }

        const {_id,email,isExpired} = decodedToken;
        if(isExpired){
            UtilsController.sendError(res,401,{
                "message" : "Session has been expired",
               "responseCode": returnCodes.invalidSession,
            })
            return;
        }

        const user  =  await UserSchema.findOne({'_id':new mongoose.Types.ObjectId(_id)})
    
        if(UtilsController.isEmpty(user) || UtilsController.isEmpty(user.accessTokens)){
            UtilsController.sendError(res,401,{
                "message" : "User not found or Session doesn't belong to the user",
               "responseCode": returnCodes.invalidSession,
            })
            return;
        }
        const providedToken =user.accessTokens.find(tokenObj => tokenObj.token === session.token);
      
        if(UtilsController.isEmpty(providedToken)){
            UtilsController.sendError(res,401,{
                "message" : "Session provided doesn't exists in user account",
               "responseCode": returnCodes.invalidSession,
            })
            return;
        }
        if(providedToken.isExpired == true){
            UtilsController.sendError(res,401,{
                "message" : "Session used is already expired, it may happen that you are using old token, and someone may have generated new token",
               "responseCode": returnCodes.invalidSession,
            })
            return;
        }
        
        next();
       } catch(err){
        UtilsController.sendError(res,500, {
            message: err.message,
            details:err.details
        })
       }
    }
}