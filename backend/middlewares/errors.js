module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;

	if (process.env.NODE_ENV === "DEVELOPMENT") {
		res.status(err.statusCode).json({
			succes: false,
			error: err,
			errMessage: err.message,
			stack: err.stack,
		});
	}

	if (process.env.NODE_ENV === "PRODUCTION") {
		let error = { ...err };

		error.message = err.message;

		// Wrong mongoose object ID Error
		if (error.name == "CastError") {
			const message = `Resource not found. Invalid: ${err.path}`;
			error = new ErrorHandler(message, 400);
		}

		// Handling mongoose duplicate key Errors
		if (err.code === 11000) {
			const message = `Duplicate ${Object(err.keyValue)} entered`;
			error = new ErrorHandler(message, 400);
		}

		// Handling wrong JWT Error
		if (error.name == "JsonWebTokenError") {
			const message = "JSON Web Token is invalid. Try again";
			error = new ErrorHandler(message, 400);
		}

		// Handling expired JWT Error
		if (error.name == "JsonWebTokenError") {
			const message = "JSON Web Token is expires. Try again";
			error = new ErrorHandler(message, 400);
		}

		// Handling mongoose ValidationError
		if (error.name == "ValidationError") {
			const message = Object.values(err.errors).map((value) => value.message);
			error = new ErrorHandler(message, 400);
		}

		res.status(err.statusCode).json({
			succes: false,
			message: error.message || "Internal Server Error",
		});
	}
};
