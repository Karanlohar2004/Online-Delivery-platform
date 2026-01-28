import express from "express";
import { placeOrder, userOrders, verifyOrder,listOrders, updateStatus } from "../controllers/orderController.js";
import authMiddleware from "../middleware/auth.js"; // Assuming you have auth


const orderRouter = express.Router();

// Route to create the order
orderRouter.post("/place", authMiddleware, placeOrder);

// Route to verify payment (Called after frontend payment success)
orderRouter.post("/verify", authMiddleware, verifyOrder);

orderRouter.post("/userorders", authMiddleware,userOrders);
orderRouter.get("/list",listOrders);
orderRouter.post("/status",updateStatus)
export default orderRouter;