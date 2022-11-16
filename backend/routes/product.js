const express = require("express");
const router = express.Router();

const {
	getProducts,
	newProduct,
	getOneProduct,
	updateProduct,
	deleteProduct,
	createProductReview,
	getProductReviews,
	deleteProductReview,
} = require("../controllers/productController");

const {
	isAuthenticatedUser,
	authorizedRole,
} = require("../middlewares/auth.middleware");

router.route("/products").get(isAuthenticatedUser, getProducts);

router.route("/product/:id").get(getOneProduct);

router
	.route("/admin/product/:id")
	.put(isAuthenticatedUser, authorizedRole("admin"), updateProduct)
	.delete(isAuthenticatedUser, authorizedRole("admin"), deleteProduct);

router
	.route("/admin/product/new")
	.post(isAuthenticatedUser, authorizedRole("admin"), newProduct);

router.route("/review").put(isAuthenticatedUser, createProductReview);

router.route("/reviews").get(isAuthenticatedUser, getProductReviews);

router.route("/reviews").delete(isAuthenticatedUser, deleteProductReview);

module.exports = router;
