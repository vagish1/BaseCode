const { default: mongoose } = require("mongoose");
const UtilsController = require("../../Utils/UtilsController");
const returnCodes = require("../../Utils/returnCodes");
const ComplaintTypes = require("../../models/ComplaintType");
const ComplaintRequest = require("../../models/Complaints");
const ComplaintInteraction = require("../../models/MessageSchema");

module.exports = {
    listComplaintType: async (req,res,next)=>{
        try{
            const complaintTypes = await ComplaintTypes.find({isDeleted : false}).select("-isDeleted -createdAt");
            UtilsController.sendSuccess(res,200,{
                responseCode: returnCodes.requestFullfilled,
                result: complaintTypes
            });
        }catch(err){
            UtilsController.sendError(res,500,{
                responseCode : returnCodes.failue,
                message: err.message,
                details: err.details
            })
        }
    },
    createNewComplaintRequest: async(req,res,next)=>{
        try{
            let {recordId, reason ,from = "Mobile"} = req.body;

            if(UtilsController.isEmpty(recordId)){
                UtilsController.sendError(res,500,{
                    responseCode : returnCodes.bodyIncomplete,
                    message: "Please provide complaint type",
                    
                })
                return;
            }

            const complaintType =  await  ComplaintTypes.findById(recordId);
            if(UtilsController.isEmpty(complaintType)){
                UtilsController.sendError(res,500,{
                    responseCode : returnCodes.bodyIncomplete,
                    message: "The complaint type is invalid, we don't provide service for this complaint",
                    
                })
                return;
            }

            if(UtilsController.isEmpty(reason)){
                UtilsController.sendError(res,500,{
                    responseCode : returnCodes.bodyIncomplete,
                    message: "Please provide reason for complaint ",
                    
                })
                return;
            }
            const {_id} =  await UtilsController.decodeSession(req,res);

            const complaint = new ComplaintRequest({
                reason: reason,
                complaintTypeId: recordId,
                requestedBy : _id,
                platform: from
                
            });
            await complaint.save();
            // const registeredComplaint =  await ComplaintRequest.findById(complaint._id);

            const message =  new ComplaintInteraction({
                "message": reason,
                attachment: req.body.attachment,
                complaintTypeId: recordId,
                complaintId: complaint._id,
                requestedBy: _id,
                sentBy:_id
                
            });
            await message.save();
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
    interaction:async(req,res,next)=>{
        try{
            const userId =  (await UtilsController.decodeSession(req,res))._id;
            const {message,attachment} = req.body;

            if(UtilsController.isEmpty(message)){
                UtilsController.sendError(res,500,{
                    responseCode : returnCodes.bodyIncomplete,
                    message: "Please provide message",
                    
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
                        '_id': new mongoose.Types.ObjectId(userId)
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
                    message: "Please create a complaint request before interacting with customer care",
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
                requestedBy: userId,
                sentBy: userId
            });
            await  newInteraction.save();
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
   getAllInteraction: async (req,res,next)=>{
    const {page} = req.body;
    const pageSize= 2;
        try{
            const userId =  (await UtilsController.decodeSession(req,res))._id;
            const interactionMade = await ComplaintInteraction.aggregate([
                {
                    $match: {
                        "requestedBy": new mongoose.Types.ObjectId(userId),
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
                    $skip: page* pageSize
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




//full pipeline for 
// [
//     {
//         $match: {
//           "requestedBy": ObjectId("658d0e19eabd8d92787f140c"),
//         },
//       },
        
//       {
//         $group: {
//           _id: "requestedBy",
//           msgs: {
//             $push: {
//               complaintId: "$complaintId",
//               complaintTypeId: "$complaintTypeId",
//               message: "$message",
//               createdAt: "$createdAt",
//               attachment: "$attachment",
//               userId:"$requestedBy"
//             },
//           },
//         },
//       },
     
//       {
//         $unwind: {
//           path: "$msgs",
//         },
//       },
  
//     {
//       $group: {
//         _id: "$msgs.complaintId",
//         complaintWiseMsgs: {
//           $push:{
//             complaintTypeId : "$msgs.complaintTypeId",
//             message:"$msgs.message",
//             createdAt:"$msgs.createdAt",
//             attachment:"$msgs.attachment",
            
//           }
//         }
//       }
//     },
    
//     {
//       $lookup: {
//         from: "ComplaintRequest",
//         localField: "_id",
//         foreignField: "_id",
//         as: "ComplaintResult"
//       }
//     },
//     {
//       $unwind: {
//         path: "$ComplaintResult",
        
//       }
//     },
//     {
//       $addFields: {
//         status: "$ComplaintResult.status"
//       }
//     },
//     {
//       $project: {
//         "ComplaintResult":0
//       }
//     }
//   ]