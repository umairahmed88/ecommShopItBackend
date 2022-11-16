const express = require("express");

const router = express.Router();

const {
	newOrder,
	myOrders,
	getOneOrder,
	allOrders,
	updateOrder,
	deleteOrder,
} = require("../controllers/orderController");

const {
	isAuthenticatedUser,
	authorizedRole,
} = require("../middlewares/auth.middleware");

router.route("/order/new").post(isAuthenticatedUser, newOrder);

router.route("/order/:id").get(isAuthenticatedUser, getOneOrder);

router.route("/orders/me").get(isAuthenticatedUser, myOrders);

router
	.route("/admin/orders")
	.get(isAuthenticatedUser, authorizedRole("admin"), allOrders);

router
	.route("/admin/order/:id")
	.put(isAuthenticatedUser, authorizedRole("admin"), updateOrder)
	.delete(isAuthenticatedUser, authorizedRole("admin"), deleteOrder);

module.exports = router;
