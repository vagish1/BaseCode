const UtilsController = require("../../Utils/UtilsController");
const returnCodes = require("../../Utils/returnCodes");
const UserSchema = require("../../models/user");

module.exports = {
    registerUser: async (req,res,next)=>{
        const {email,phone} = req.body;
        try{
            if(UtilsController.isEmpty(email) || UtilsController.isEmpty(phone)){
                UtilsController.sendError(res,400,{
                    "message":"Please provide email or phone to continue",
                    "responseCode": returnCodes.bodyIncomplete
                });
                return;
            }

            const account = await  UtilsController.findUserByEmailOrPhone(email,phone);
           
            if(!UtilsController.isEmpty(account)){
                if(account.isDeleted){
                    account.isDeleted = false;
                    await account.save();
                    const userWithoutTokens = await UserSchema.findById(account._id).select('-accessTokens');
                    UtilsController.sendSuccess(res,201,{
                        responseCode: returnCodes.requestFullfilled,
                        message: "Account Created Successfully",
                        result:[ userWithoutTokens]
                    });
                    return;
                }
                UtilsController.sendError(res,400,{
                    "message":"User Already exist with this email",
                    "responseCode": returnCodes.userAlreadyExists
                });
                return;
            }

            const user = new UserSchema(req.body);
            await user.save();
            const userWithoutTokens = await UserSchema.findById(user._id).select('-accessTokens');
            res.cookie('Session',user.accessTokens[0].token, { maxAge: 900000,});    
            UtilsController.sendSuccess(res,201,{
                responseCode: returnCodes.requestFullfilled,
                message: "Account Created Successfully",
                result:[ userWithoutTokens]
            });

        }catch(err){
            UtilsController.sendError(res, 500, {
                message:err.message,
                details: err.details
            })
        }
    },
    login: async (req,res,next)=>{
      try{
        const {email,password}  = req.body;
        if(UtilsController.isEmpty(email) || UtilsController.isEmpty(password)){
            UtilsController.sendError(res,400,{
                "message":"Please provide email and password, both must be provided",
                "responseCode": returnCodes.bodyIncomplete
            });
            return;
        }

        const account =await  UtilsController.findUserByEmailOrPhone(email);
        if(UtilsController.isEmpty(account)){
            UtilsController.sendError(res,400,{
                "message":"User not found with this email",
                "responseCode": returnCodes.userNotExists
            });
            return;
        }
       
        if(account.isDeleted){
            UtilsController.sendError(res,404,{
                "message":"Account not found",
                "responseCode": returnCodes.bodyIncomplete
            });
            return;
        }
        const isMatched =  await UtilsController.checkPassword(password,account.password)
        if(!isMatched){
            UtilsController.sendError(res,401,{
                "message":"Invalid password, your password is incorrect, try resetting the password",
                "responseCode": returnCodes.userNotExists
            });
            return;
        }
       for(const accessToken of account.accessTokens){
        accessToken.isExpired = true;
       }
        await account.save();
        const activeAccessToken = account.accessTokens.find(token => !token.isExpired)
        res.cookie('Session',activeAccessToken ,{ maxAge: 900000000,})
        UtilsController.sendSuccess(res,200,{
            message: "Login Successfull",
            responseCode: returnCodes.requestFullfilled,
        });
      }catch (err){
        UtilsController.sendError(res, 500, {
            message:err.message,
            details: err.details
        })
      }
    },
    delete: async (req,res,next)=>{
        try{
        
            const decodedToken = UtilsController.decodeSession(req,res);

            const user =  await UserSchema.findById(decodedToken._id);
            if(user.isDeleted == true){
                UtilsController.sendError(res,400,{
                    message:"Account doesn't exists with this email",
                    responseCode : returnCodes.userNotExists,
                })
                return;
            }
            user.isDeleted = true;
            await user.save();

            UtilsController.sendSuccess(res,200,{
                message:"Account has been deleted successfully",
                responseCode : returnCodes.requestFullfilled,
            })
         
        }catch(err){
            UtilsController.sendError(res, 500, {
                message:err.message,
                details: err.details
            })
        }
    }
    
}