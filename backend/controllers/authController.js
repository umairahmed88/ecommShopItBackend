const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const User = require("../models/user");
const { send } = require("process");

// Register a user  => /api/v1/register
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
	const { name, email, password } = req.body;

	const user = await User.create({
		name,
		email,
		password,
		avatar: {
			public_id: "products/61oXGZ60GfL_fixco9",
			url: "https://res.cloudinary.com/bookit/image/upload/v1614877995/products/61oXGZ60GfL_fixco9.jpg",
		},
	});

	sendToken(user, 200, res);
});

// Login User => /api/v1/login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
	const { email, password } = req.body;

	// Check if email and password are entered by the user
	if (!email || !password) {
		return next(new ErrorHandler("Please enter email and password"), 400);
	}

	// Find the user in db
	const user = await User.findOne({ email }).select("+password");

	if (!user) {
		return next(new ErrorHandler("Inavlid email or password", 401));
	}

	// Check if password is correct
	const isPasswordMatched = await user.comparePassword(password);

	if (!isPasswordMatched) {
		return next(new ErrorHandler("Password is incorrect", 401));
	}

	sendToken(user, 200, res);
});

// Forget Password => /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return next(new ErrorHandler("User not found with this email", 404));
	}

	// Get reset token
	const resetToken = user.getPasswordResetToken();

	await user.save({ validateBeforeSave: false });

	// Create reset password url
	const resetUrl = `${req.protocol}://${req.get(
		"host"
	)}/api/v1/password/reset/${resetToken}}`;

	const message = `Your password reset token has been sent to: \n\n${resetUrl} \n\n If you have not requested this email, then ignore it.`;

	try {
		await sendEmail({
			email: user.email,
			subject: "ShopIt Reset Password",
			message,
		});

		res.status(200).json({
			success: true,
			message: `Email sent to ${user.email}`,
		});
	} catch (error) {
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;

		await user.save({ validateBeforeSave: false });

		return next(new ErrorHandler(error.message, 500));
	}
});

// Reset Password => /api/v1/password/reset/:id
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
	// Hash URL token
	const resetPasswordToken = crypto
		.createHash("sha256")
		.update(req.params.token)
		.digest("hex");

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpires: { $gt: Date.now() },
	});

	if (!user) {
		return next(
			new ErrorHandler(
				"Password reset token is invalid or has been expired",
				400
			)
		);
	}

	if (req.body.password !== req.body.confirmPassword) {
		return next(new ErrorHandler("Password does not match", 400));
	}

	// setup new password
	user.password = req.body.password;

	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;

	await user.save();

	sendToken(user, 200, res);
});

// Get currently logged in user details => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.user.id);

	res.status(200).json({
		success: true,
		user,
	});
});

// Update / Change password => /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.user.id).select("+password"); // first get the currently logged in user and password

	// Check previous user password
	const isMatched = await user.comparePassword(req.body.oldPassword);

	if (!isMatched) {
		return next(new ErrorHandler("Old password is incorrect", 400));
	}

	user.password = req.body.password;
	await user.save();

	sendToken(user, 200, res);
});

// Update user profile => /api/v1/me/update
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
	const newUserDate = {
		name: req.body.name,
		email: req.body.email,
	};

	// Update avatar: TODO

	const user = await User.findByIdAndUpdate(req.user.id, newUserDate, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});

	res.status(200).json({
		success: true,
	});
});

// Logout User => /api/v1/logout
exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
	res.cookie("token", null, {
		expires: new Date(Date.now()),
		httpOnly: true,
	});

	res.status(200).json({
		success: true,
		message: "Logged out successfully",
	});
});

// Get All Users  => /api/v1/admin/users
exports.allUsers = catchAsyncErrors(async (req, res, next) => {
	const users = await User.find();

	res.status(200).json({
		success: true,
		users,
	});
});

// Get user details  => /api/v1/admin/users/:id
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		return next(
			new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
		);
	}

	res.status(200).json({
		success: true,
		user,
	});
});

// Update user profile by admin => /api/v1/admin/user/:id
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
	const newUserDate = {
		name: req.body.name,
		email: req.body.email,
		role: req.body.role,
	};

	const user = await User.findByIdAndUpdate(req.params.id, newUserDate, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});

	res.status(200).json({
		success: true,
	});
});

// Get delete user  => /api/v1/admin/users/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		return next(
			new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
		);
	}

	// Remove avatar from cloudinary - TODO

	await user.remove();

	res.status(200).json({
		success: true,
	});
});
