const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const razorpay = require('razorpay');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
require('dotenv').config();
//console.log(process.env.RAZORPAY_KEY_ID) ;
app.post("/orders", async (req, res) => {
    try {

        const instance = new razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_SECRET });

        const options = req.body;
        const order = await instance.orders.create(options);

        if (!order) return res.status(500).send("Some error occured");
        res.json(order);
    }
    catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
})

app.post("/order/validate", (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ msg: "Missing required fields" });
    }

    if (!process.env.RAZORPAY_SECRET) {
        return res.status(500).json({ msg: "Server configuration error" });
    }

    const sha = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET);
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = sha.digest('hex');
    console.log(generated_signature);

    if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ msg: "Transaction not verified" });
    }

    res.json({ msg: "Payment verified", orderId: razorpay_order_id, paymentId: razorpay_payment_id });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

