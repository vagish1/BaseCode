const express = require("express");
const UserController = require("../controller/User/UserController");
const { authMiddleWare } = require("../middleware/auth");
const UserComplaintController = require("../controller/User/UserComplaintController");
const router = express.Router();

router.route("/register").post(UserController.registerUser);
router.route("/login").post(UserController.login);
router.use(authMiddleWare).route("/delete").post(UserController.delete);
router.use(authMiddleWare).route("/complaint/types/listall").get(UserComplaintController.listComplaintType);
router.use(authMiddleWare).route("/complaint/request/create").post(UserComplaintController.createNewComplaintRequest);
router.use(authMiddleWare).route("/complaint/interaction").post(UserComplaintController.interaction);
router.use(authMiddleWare).route("/complaint/interaction/get").post(UserComplaintController.getAllInteraction);





module.exports = {router}

