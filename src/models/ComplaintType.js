const mongoose = require("mongoose");

const complaintTypeSchema = mongoose.Schema({
    complaintName: {
        type: String,
        required: true,
        unique: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    createdAt:{
        type: Number,
        default : Math.floor(Date.now()/1000)
    }
},{collection: "ComplaintTypes" });

const ComplaintTypes = new mongoose.model("ComplaintTypes", complaintTypeSchema);
module.exports = ComplaintTypes;
