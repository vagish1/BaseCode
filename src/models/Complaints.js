const mongoose = require("mongoose");
const complaintsSchema = mongoose.Schema({
    reason:{
        type: String,
        required :true,
    },
    platform:{
        type : String,
        required :true,
    },
    createdAt:{
        type: Number,
        default : Math.floor(Date.now()/1000)
    },
    assignedTo:{
        type: mongoose.Types.ObjectId,
        ref: "Users",
        default: null,
    },
    complaintTypeId:{
        type: mongoose.Types.ObjectId,
        ref: "ComplaintTypes"
    },
    status:{
        type:String,
        default: "pending"
    },
    requestedBy:{
        type: mongoose.Types.ObjectId,
        ref :"Users"
    }

},{collection: "ComplaintRequest"});


const ComplaintRequest = new mongoose.model("ComplaintRequest", complaintsSchema)
module.exports = ComplaintRequest