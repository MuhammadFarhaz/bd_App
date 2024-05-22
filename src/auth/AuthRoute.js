const router = require("express").Router();
const { verify } = require("jsonwebtoken");
const AuthController = require("./AuthController");

// public
router.post("/register", AuthController.userRegister);
router.get("/getAuth", AuthController.getAuth);
router.delete("/deleteAuth/:id", AuthController.deleteAuth);
router.post("/login", AuthController.userLogin);
router.get("/logout", AuthController.logout);
router.post("/forgotpassword", AuthController.forgetPassword);
router.post("/verify", AuthController.verify);
router.post("/resendOtp", AuthController.resendOtp);
router.put("/resetpassword", verify, AuthController.resetPassword);
router.get("/getProfile/:id", AuthController.getMyProfile);
router.put("/updateProfile/:id", AuthController.updateProfile);
router.put("/updateUser/:id", AuthController.updateUser);

// private

module.exports = router;
