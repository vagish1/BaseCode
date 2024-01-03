
const express = require("express");
const AdminComplaintController = require("../controller/Admin/AdminComplaintController");
const adminRoute = express.Router();

adminRoute.route("/complaint/type/create").post(AdminComplaintController.createComplaintTypes)
adminRoute.route("/complaint/type/delete").post(AdminComplaintController.deleteComplaintType)
adminRoute.route("/complaint/interaction/new").post(AdminComplaintController.createNewInteractionMsg)
adminRoute.route("/complaint/request/getall").get(AdminComplaintController.listAllComplaints)
adminRoute.route("/complaint/interaction/getall").post(AdminComplaintController.getAllInteractionWithUser)




module.exports = adminRoute;