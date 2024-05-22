const router = require("express").Router();
const PropertyController = require("./PropertyController");

router.get("/getGroceries", PropertyController.getProperty);
router.get("/search/:title", PropertyController.searchProperty);
router.delete("/deleteProduct/:id", PropertyController.deleteProperty);
router.get("/getCart/:loginId", PropertyController.getCart);
router.post("/cart", PropertyController.createCart1);
router.delete("/deleteCart/:id", PropertyController.deleteCart);
router.post("/createGroceries", PropertyController.createProperty);
router.put("/updateGroceries/:id", PropertyController.updateProperty);
router.delete("/deleteGroceries/:id", PropertyController.deleteProperty);
router.post("/createOrder", PropertyController.createOrder);
router.delete("/deleteOrder/:id", PropertyController.deleteOrder);
router.put("/orderUpdate", PropertyController.orderStatusController);
router.post("/newOrder", PropertyController.orderNewFeature);
router.get("/getOrderDetail", PropertyController.getOrderDeatil);
router.get("/getOrder/:id", PropertyController.getOneOrder);
router.get("/getOrderDetail/:id", PropertyController.getOneOrderDetail);
router.post("/verifysend", PropertyController.sendOtpVerifyUser);
router.get("/totalearning", PropertyController.calculateTotalEarnings);
router.post("/refundpayment/:orderId", PropertyController.refundOrder);
router.put("/paymentupdate/:id", PropertyController.updatePayment);
router.get("/totalsalesproduct", PropertyController.getProductSales);
router.post("/favorites", PropertyController.createFavourite);
router.get("/allfavorites/:userId", PropertyController.getAllFav);
router.get("/check-favorite/:userId/:productId", PropertyController.checkFav);

module.exports = router;
