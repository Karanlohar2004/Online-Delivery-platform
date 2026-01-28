// import orderModel from "../models/orderModel.js";
// import userModel from "../models/userModel.js";
// import Razorpay from "razorpay";

// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID, 
//     key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// //placing user order for frontend

// const placeOrder = async (req,res)=>{

//     const frontend_url = "http://localhost:5173"

//     try {
//         const newOrder = new orderModel({
//             userId:req.body.userId,
//             items:req.body.items,
//             amount:req.body.amount,
//             address:req.body.address
//         })

//         await newOrder.save()
//         await userModel.findByIdAndUpdate(req.body.userId,{cartData:{}})

//         const line_items = req.body.items.map((item)=>({
//             price_data:{
//                 currency:"inr",
//                 product_data:{
//                     name:item.name
//                 },
//                 unit_amount:item.price*100*80

//             },
//             quantity:item.quantity
//         }))

//         line_items.push({
//             price_data:{
//                 currency:"inr",
//                 product_data:{
//                     name: "Delivery Charges"
//                 },
//                 unit_amount : 2*100*80
//             },
//             quantity : 1
//         })

//         const session = await razorpay.checkout.sessions.create({
//             line_items:line_items,
//             mode:"payment",
//             success_url : `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
//             cancel_url : `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
//         })

//         res.json({success:true,session_url:session.url})

//     } catch (error) {
//         console.log(error)
//         res.json({success:false,message:"error"})
//     }

// }

// export {placeOrder}
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto"; // Required for verifying payment signature

// 1. Initialize Razorpay Instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET // Ensure variable name matches .env
});

// 2. Place Order (Create Order ID)
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;

        // A. Save initial order in DB (Payment Pending)
        const newOrder = new orderModel({
            userId,
            items,
            amount,
            address,
            payment: false,
            date: Date.now()
        });
        await newOrder.save();
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // B. Calculate Amount for Razorpay
        // Razorpay expects amount in 'paise' (Integer). 
        // Logic: Price * 100 (for paise) * 80 (Exchange rate if price is in USD)
        let totalAmount = 0;
        items.forEach((item) => {
            totalAmount += (item.price * item.quantity * 100);
        });
        // Add Delivery: 2 * 100 * 80
        totalAmount += (2 * 100 ); 

        // C. Create Razorpay Order
        const options = {
            amount: totalAmount, 
            currency: "INR",
            receipt: newOrder._id.toString(), // Pass DB Order ID as receipt
        };

        const order = await razorpay.orders.create(options);

        // D. Send Order details to Frontend
        res.json({ success: true, order });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error creating order" });
    }
}

// 3. Verify Order (Validate Signature & Update DB)
// const verifyOrder = async (req, res) => {
//     try {
//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//         // A. Create the expected signature using your Secret
//         // format: order_id + "|" + payment_id
//         const body = razorpay_order_id + "|" + razorpay_payment_id;

//         const expectedSignature = crypto
//             .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//             .update(body.toString())
//             .digest("hex");

//         // B. Compare signatures
//         const isAuthentic = expectedSignature === razorpay_signature;

//         if (isAuthentic) {
//             // C. If valid, update database payment status to TRUE
//             // We need to find the order that has this razorpay_order_id.
//             // Note: You might need to save razorpay_order_id in your DB during placeOrder 
//             // OR find the order by parsing the receipt if you need strict mapping.
//             // For now, assuming you send the internal DB orderId from frontend in this request:
            
//             // await orderModel.findByIdAndUpdate(req.body.orderId, { payment: true });
//             await orderModel.findByIdAndUpdate(orderId, { 
//                 payment: true,
//                 paymentId: razorpay_payment_id, // Save the transaction ID
//                 razorpayOrderId: razorpay_order_id 
//             });


//             res.json({ success: true, message: "Payment Verified" });
//         } else {
//             res.json({ success: false, message: "Payment Failed" });
//         }

//     } catch (error) {
//         console.log(error);
//         res.json({ success: false, message: "Internal Server Error" });
//     }
// }

const verifyOrder = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        // LOGGING FOR DEBUGGING
        

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        

        if (expectedSignature === razorpay_signature) {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Paid" });
        } else {
            await orderModel.findByIdAndDelete(orderId); // Comment this out while debugging
            res.json({ success: false, message: "Payment Failed" });
        }

    } catch (error) {
        console.log("VERIFY ERROR:", error); // Log the actual error
        res.json({ success: false, message: "Error" });
    }
}

// user orders for frontend
const userOrders = async(req,res)=>{
    try {
        const orders = await orderModel.find({userId:req.body.userId})
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:"error"})
    }

}

//listing all orders for admin

const listOrders = async(req,res)=>{
    try {
        const orders = await orderModel.find({})
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:"error"})
    }

}

//api for updating order status by admin

const updateStatus = async(req,res)=>{
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status})
        
        res.json({success:true,message:"status updated"})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:"error"})
    }
}

export { placeOrder, verifyOrder,userOrders, listOrders, updateStatus };
