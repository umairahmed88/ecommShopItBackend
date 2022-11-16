const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please enter your name"],
		maxlength: [30, "Your name cannot be longer than 30 characters"],
	},
	email: {
		type: String,
		required: [true, "Please enter your email address"],
		unique: true,
		validate: [validator.isEmail, "Please enter a valid email address"],
	},
	password: {
		type: String,
		required: [true, "Please enter your password"],
		minlength: [6, "Your password cannot be longer than 6 characters"],
		select: false,
	},
	avatar: {
		public_id: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
	},
	role: {
		type: String,
		default: "user",
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	resetPasswordToken: String,
	resetPasswordExpires: Date,
});

// Encrypt the password before saving user
userSchema.pre("save", async function (next) {
	const user = this;
	if (!this.isModified("password")) {
		return next();
	}

	this.password = await bcrypt.hash(this.password, 10);
});

// compare the password
userSchema.methods.comparePassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

// Return JWT
userSchema.methods.getJwtToken = function () {
	return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_TIME,
	});
};

// Generate password reset token
userSchema.methods.getPasswordResetToken = function () {
	// Generate a random token
	const resetToken = crypto.randomBytes(20).toString("hex");

	// Hash and set to reset password token
	this.resetPasswordToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex");

	// Set the token expires time
	this.resetPasswordExpires = Date.now() + 1000 * 60 * 30;

	return resetToken;
};

module.exports = mongoose.model("User", userSchema);
