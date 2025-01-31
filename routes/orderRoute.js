import express from 'express';
import { placeOrder, placeOrderStripe, placeOrderPaystack, allOrders, userOrders, updateStatus, placeOrderFlutterwave, verifyFlutterwavePayment } from '../controllers/orderController.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';


const orderRouter = express.Router();

//admin features
orderRouter.post('/list',adminAuth, allOrders)
orderRouter.post('/status',adminAuth, updateStatus)

//payment features
orderRouter.post('/place', authUser, placeOrder)
orderRouter.post('/stripe', authUser, placeOrderStripe)
orderRouter.post('/paystack', authUser, placeOrderPaystack)
orderRouter.post('/flutterwave', authUser, placeOrderFlutterwave)

//user features

orderRouter.post('/userorders', authUser, userOrders)

// verify payment
orderRouter.post('/verify', authUser, verifyFlutterwavePayment);

export default orderRouter;
