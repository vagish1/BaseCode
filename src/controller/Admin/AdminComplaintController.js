const { default: mongoose } = require("mongoose");
const UtilsController = require("../../Utils/UtilsController");
const returnCodes = require("../../Utils/returnCodes");
const ComplaintTypes = require("../../models/ComplaintType")
const ComplaintRequest = require("../../models/Complaints");
const ComplaintInteraction = require("../../models/MessageSchema");

module.exports = {
    createComplaintTypes: async (req,res,next)=>{
      try{
        const{complaintName} =  req.body;
        if(UtilsController.isEmpty(complaintName)){
            UtilsController.sendError(res,400, {
                responseCode : returnCodes.bodyIncomplete,
                message: "Please provide complaint name in body"
            })
            return;
        }
        const alreadyExist =  await ComplaintTypes.findOne({complaintName: complaintName});

        if(!UtilsController.isEmpty(alreadyExist)){
            if(alreadyExist.isDeleted){
                alreadyExist.isDeleted  = false;
                await alreadyExist.save();
                UtilsController.sendSuccess(res,201, {
                    responseCode : returnCodes.requestFullfilled,
                    message: "Complaint type added successfully"
                })
                return;
            }
            UtilsController.sendError(res,400, {
                responseCode : returnCodes.failue,
                message: "The complaint you want to create already exisits",
            })
            return;
        }
        const complaintTypeSchema = new ComplaintTypes({complaintName : complaintName});
        await complaintTypeSchema.save();
        UtilsController.sendSuccess(res,201, {
            responseCode : returnCodes.requestFullfilled,
            message: "Complaint type added successfully"
        })
      } catch(err){
            UtilsController.sendError(res,400, {
                responseCode : returnCodes.failue,
                message: err.message,
                details: err.details
            })
      }
    },
    deleteComplaintType: async(req,res,next)=>{
        try{
            const {recordId} = req.body;
            if(UtilsController.isEmpty(recordId)) {
                UtilsController.sendError(res,400, {
                    responseCode : returnCodes.bodyIncomplete,
                    message: "Please provide record id you want to delete"
                });
                return;
            }

            const complaint =  await ComplaintTypes.findOne({_id: new mongoose.Types.ObjectId(recordId)});
            if(UtilsController.isEmpty(complaint)){
                UtilsController.sendError(res,400, {
                    responseCode : returnCodes.userNotExists,
                    message: "Complaint you want to delete not exists"
                });
                return;
            }

            complaint.isDeleted = true;
            await complaint.save();

            UtilsController.sendSuccess(res,201, {
                responseCode : returnCodes.requestFullfilled,
                message: "Complaint type deleted successfully"
            })
        }catch(err){
            UtilsController.sendError(res,400, {
                responseCode : returnCodes.failue,
                message: err.message,
                details: err.details
            })
        }
    },
    createNewInteractionMsg: async(req,res,next)=>{
        try{
            const userId =  (await UtilsController.decodeSession(req,res))._id;
           
            const {message,attachment,sendingTo} = req.body;

            if(UtilsController.isEmpty(message)){
                UtilsController.sendError(res,500,{
                    responseCode : returnCodes.bodyIncomplete,
                    message: "Please provide message",
                    
                })
                return;
            }

            if(UtilsController.isEmpty(sendingTo)){
                UtilsController.sendError(res,500,{
                    responseCode : returnCodes.bodyIncomplete,
                    message: "Please provide the user id whom you want to send",
                    
                })
                return;
            }

            const interaction = await ComplaintInteraction.aggregate(
                [
                    {
                      '$group': {
                        '_id': '$requestedBy', 
                        'msgs': {
                          '$push': {
                            'complaintId': '$complaintId', 
                            'complaintTypeId': '$complaintTypeId', 
                            'createdAt': '$createdAt'
                          }
                        }
                      }
                    }, {
                      '$match': {
                        '_id': new mongoose.Types.ObjectId(sendingTo)
                      }
                    }, {
                      '$unwind': {
                        'path': '$msgs'
                      }
                    }, {
                      '$sort': {
                        'msgs.createdAt': -1
                      }
                    }, {
                      '$limit': 1
                    }
                ]
            )
            if(UtilsController.isEmpty(interaction)){
                UtilsController.sendError(res,500,{
                    responseCode : returnCodes.bodyIncomplete,
                    message: "There is no complaint has been made by this user",
                })
                return;
            }
            const complaintId = interaction[0].msgs.complaintId;
            const complaintTypeId = interaction[0].msgs.complaintTypeId; 

            const newInteraction = new ComplaintInteraction({
                message: message,
                attachment:attachment,
                complaintTypeId : complaintTypeId,
                complaintId :complaintId,
                requestedBy: sendingTo,
                sentBy: userId
            });

            const complaintReq =  await ComplaintRequest.findById(complaintId);
            if(UtilsController.isEmpty(complaintReq.assingedTo)){
                complaintReq.assignedTo = new mongoose.Types.ObjectId(userId);
                await complaintReq.save();
                
            }
            await newInteraction.save();

            UtilsController.sendSuccess(res,200,{
                responseCode: returnCodes.requestFullfilled,
                result: message
            });

        }catch(err){
            UtilsController.sendError(res,500,{
                responseCode : returnCodes.failue,
                message: err.message,
                details: err.details
            })
        }

    },

    listAllComplaints: async(req,res,next)=>{
        try{

            const {page} = req.query;
            const pageSize = 10;
            let skipFrom = (Number(page))*pageSize || 0 ;
            const allComplaints = await ComplaintRequest.find({}).populate("assignedTo requestedBy","Name email phone").skip(skipFrom).limit(pageSize);
            
            UtilsController.sendSuccess(res,200,{
                responseCode : returnCodes.requestFullfilled,
                data : allComplaints
            })
        }catch(err){
            UtilsController.sendError(res,500,{
                responseCode : returnCodes.failue,
                message: err.message,
                details: err.details
            })
        }

        
    },
    getAllInteractionWithUser: async(req,res,next)=>{
        const {receiverId} = req.body;

        if(UtilsController.isEmpty(receiverId)){
            UtilsController.sendError(res,500,{
                responseCode : returnCodes.bodyIncomplete,
                message: "Please provide receiverID",
                
            })
            return;
        }


        const {page} = req.body;
        const pageSize= 2;
        try{
            const interactionMade = await ComplaintInteraction.aggregate([
                {
                    $match: {
                        "requestedBy": new mongoose.Types.ObjectId(receiverId),
                    },
                },
                {
                    $group: {
                    _id: "requestedBy",
                        msgs: {
                            $push: {
                            complaintId: "$complaintId",
                            complaintTypeId: "$complaintTypeId",
                            message: "$message",
                            createdAt: "$createdAt",
                            attachment: "$attachment",
                            userId:"$requestedBy",
                            sentBy:"$sentBy"
                            },
                        },
                    },
                },
                {
                    $unwind: {
                        path: "$msgs",
                    },
                },
    
                {
                    $group: {
                        _id: "$msgs.complaintId",
                        complaintWiseMsgs: {
                            $push:{
                                complaintTypeId : "$msgs.complaintTypeId",
                                message:"$msgs.message",
                                createdAt:"$msgs.createdAt",
                                attachment:"$msgs.attachment",
                                sentBy:"$msgs.sentBy"
                                
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "ComplaintRequest",
                        localField: "_id",
                        foreignField: "_id",
                        as: "complaintFormData"
                    }
                },
                {
                    $unwind: {
                        path: "$complaintFormData",
                    }
                },
                {
                    $sort:{
                        "complaintFormData.createdAt":-1
                    }
                },
                {
                    $skip: page* pageSize ||0
                },
                {
                    $limit: pageSize
                
                }
    
            ]);
          

            UtilsController.sendSuccess(res,200,{
                responseCode:returnCodes.requestFullfilled,
                data:interactionMade
            });
        }catch(err){
            UtilsController.sendError(res,500,{
                responseCode : returnCodes.failue,
                message: err.message,
                details: err.details
            })
        }
                
    }
}