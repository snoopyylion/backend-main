import Flutterwave from "flutterwave-node-v3";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import axios from "axios";

const frontendUrl = process.env.FRONTEND_URL;
// Placing orders with COD method

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Placing orders with stripe method
const placeOrderStripe = async (req, res) => {};
// Placing orders with Flutterwave
// Place Order (Flutterwave)
const placeOrderFlutterwave = async (req, res) => {
  try {
    const { userId, amount, customerEmail, orderId, items, address, customerName, customerPhone } = req.body;

    // Generate a unique transaction reference (can be the order ID or a custom value)
    const tx_ref = `hooli-tx-${Date.now()}`;

    // Make the request to the Flutterwave API
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref, // Unique transaction reference
        amount,
        currency: "NGN",
        redirect_url: `${frontendUrl}/payment/success`, // Your redirect URL
        customer: {
          email: customerEmail,
          phonenumber: customerPhone, // Replace with actual phone number
          name: customerName, // Replace with actual customer name
        },
        customizations: {
          title: "Payment for products",
          description: "Payment for products in cart",
          logo: "https://assets.piedpiper.com/logo.png", // Replace with your logo URL
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "success") {
      // Save the order in your database with tx_ref
      const orderData = {
        userId,
        items,
        address,
        amount,
        tx_ref, // Save transaction reference
        paymentMethod: "Flutterwave",
        payment: false, // Set to true after payment is verified
        date: Date.now(),
      };

      const newOrder = new orderModel(orderData);
      await newOrder.save();

      // Clear the user's cart
      await userModel.findByIdAndUpdate(userId, { cartData: {} });

      // Send success response along with the payment link
      res.json({
        success: true,
        payment_link: response.data.data.link,
        message: "Order placed, awaiting payment",
      });
    } else {
      res.json({ success: false, message: "Payment initiation failed" });
    }
  } catch (error) {
    console.error(error.response ? error.response.data : error.message); // Log detailed error response
    res.json({ success: false, message: error.message });
  }
};

// Function to verify the Flutterwave payment
const verifyFlutterwavePayment = async (req, res) => {
    try {
      const { orderId, transaction_id } = req.body; // Ensure transaction_id is being passed
  
      // Step 1: Check for the secret hash (signature verification)
      const payload = req.body;
      const secretHash = process.env.FLW_SECRET_HASH;
      const signature = req.headers["verif-hash"];
  
      if (!signature || signature !== secretHash) {
        // If the request is not from Flutterwave, discard it
        return res.status(401).json({ success: false, message: "Unauthorized request" });
      }
  
      // Step 2: Find the order by ID
      const order = await orderModel.findById(orderId);
      const event = payload.event;
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
  
      const expectedAmount = order.amount;
      const expectedCurrency = "NGN"; // Or dynamically determine currency if needed
  
      // // Step 3: Verify the payment using Flutterwave's API
      // const response = await flw.Transaction.verify({ id: transaction_id });
  
      // if (
      //   event === 'charge.completed' &&
      //   response.data.status === "successful" &&
      //   response.data.amount === expectedAmount &&
      //   response.data.currency === expectedCurrency
      // ) {
        // Payment was successful
        if (event === 'charge.completed' &&
          event.data.status === "successful" &&
          event.data.amount === expectedAmount &&
          event.data.currency === expectedCurrency
        ) {
        const transactionId = payload.data.id;

        // Verify the payment
        await verifyPayment(transactionId);

        res.status(200).send('Success');
  
        // Step 4: Mark the order as paid
        order.payment = true;
        await order.save();
  
        // Step 5: Optionally, clear the user's cart
        await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
  
        return res.json({
          success: true,
          message: "Payment verified and order updated",
        });
      } else {
        // If payment verification failed, delete the order
        await orderModel.findByIdAndDelete(order._id);
        return res.json({ success: false, message: "Payment verification failed, order deleted" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error.message);
      return res.json({ success: false, message: "Error verifying payment" });
    }
  };


  const verifyPayment = async (transactionId) => {
      const secretKey = process.env.FLW_SECRET_HASH; // Your secret key from Flutterwave dashboard
      const url = `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`;
  
      try {
          const response = await axios.get(url, {
              headers: {
                  'Authorization': `Bearer ${secretKey}`
              }
          });
  
          const { status, data } = response.data;
          if (status === 'success' && data.status === 'successful') {
              console.log('Payment verified:', data);
              // Update your database with payment success status
          } else {
              console.log('Payment verification failed:', data);
              // Handle failure
          }
      } catch (error) {
          console.error('Error verifying payment:', error);
          // Handle verification error
      }
  };
  

// Placing orders with Razorpay method
const placeOrderPaystack = async (req, res) => {

    try {
        const { email, amount } = req.body;

        const paymentData = {
            email, // customer's email
            amount: amount * 100, // Paystack accepts amount in kobo (NGN), so multiply by 100
        };

        const response = await axios.post('https://api.paystack.co/transaction/initialize', paymentData, {
            headers: {
                Authorization: `Bearer ${ process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        // Return the authorization URL to the frontend where the user can complete the payment
        const { authorization_url } = response.data.data;
        return res.status(200).json({ authorization_url });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Payment initialization failed', error: error.response.data });
    }

};

//All Orders data for Admin Panel

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
//userOrders  data for frontend

const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// order status update from admin panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Order status updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
export {
  placeOrder,
  placeOrderStripe,
  placeOrderPaystack,
  placeOrderFlutterwave,
  allOrders,
  userOrders,
  updateStatus,
  verifyFlutterwavePayment,
};
