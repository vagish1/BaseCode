const mongoose = require("mongoose");


const messageSchema =   new mongoose.Schema({
    message:{
        type:String,
    },
    createdAt:{
        type: Number,
        default: Math.floor(Date.now()/1000)
    },
    attachment:[
        {
            name : {
                type: String,
                default : "unknown.png"
            },
            url : {
                type: String,
                default : ""
            },
            type :{
                type: String,
                default : ""
            }
        }
    ],
    complaintTypeId: {
        type: mongoose.Types.ObjectId,
        ref: "ComplaintTypes",
    },
    complaintId:{
        type: mongoose.Types.ObjectId,
        ref: "ComplaintRequest",
        
    },
    requestedBy:{
        type: mongoose.Types.ObjectId,
        ref: "Users"
    },
    sentBy:{
        type: mongoose.Types.ObjectId,
        ref:"Users"
    }
    
},{collection: "ComplaintInteraction"});

const ComplaintInteraction = new mongoose.model("ComplaintInteraction", messageSchema);
module.exports  = ComplaintInteraction;