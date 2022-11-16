const express = require("express");
const router = express.Router();

const {
	registerUser,
	loginUser,
	logoutUser,
	forgotPassword,
	resetPassword,
	getUserProfile,
	updatePassword,
	updateProfile,
	allUsers,
	getUserDetails,
	updateUser,
	deleteUser,
} = require("../controllers/authController");

const {
	isAuthenticatedUser,
	authorizedRole,
} = require("../middlewares/auth.middleware");

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);

router.route("/logout").get(logoutUser);

//it is protected route, only user can access it, so we are keeping isAuthenticatedUser
router.route("/me").get(isAuthenticatedUser, getUserProfile);

router.route("/password/update").put(isAuthenticatedUser, updatePassword);

router.route("/me/update").put(isAuthenticatedUser, updateProfile);

router
	.route("/admin/users")
	.get(isAuthenticatedUser, authorizedRole("admin"), allUsers);

router
	.route("/admin/user/:id")
	.get(isAuthenticatedUser, authorizedRole("admin"), getUserDetails)
	.put(isAuthenticatedUser, authorizedRole("admin"), updateUser)
	.delete(isAuthenticatedUser, authorizedRole("admin"), deleteUser);

module.exports = router;
