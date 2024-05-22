const PropertyMode = require("./PropertyModel");
const CartModel = require("./CartModel");
const OrderModel = require("./OrderModel");
const FavoriteModel = require("./FavouriteModel");
var bodyParser = require("body-parser");
var cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { Router } = require("express");
const { title } = require("process");
const cloudinary = require("cloudinary");
const stripe = require("stripe")(process.env.Stripe);
const { OrderItem } = require("./Order_item");
const nodemailer = require("nodemailer");
const { OrderShipping } = require("./OrderShippingModel");
const AuthModel = require("../auth/AuthModel");

cloudinary.config({
  cloud_name: "dl7kvh8y7",
  api_key: "399115714933138",
  api_secret: "51MmCXMh-FuJpnGIXmtJGjvNa3Y",
});

var transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "simpleboy1917@gmail.com",
    pass: "mkhrfvqxttnljjaw",
  },
});

const createCart1 = async (req, res) => {
  const { itemId, quantity, loginId } = req.body;

  try {
    let cartItem = await CartModel.findOne({
      loginId: req.body.loginId,
      itemId,
    });

    if (cartItem?.itemId === itemId && cartItem?.loginId === loginId) {
      cartItem.quantity += parseInt(quantity);
      await cartItem.save();
    } else {
      cartItem = await CartModel.create({
        quantity: parseInt(quantity),
        size: req.body.size,
        image: req.body.image,
        price: req.body.price,
        title: req.body.title,
        itemId,
        loginId,
      });
    }
    res.json({ message: "Item added to cart", cartItem });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//  get Cart

const getCart = async (req, res) => {
  await CartModel.find({ loginId: req.params.loginId })
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      log.warn(err);
    });
};

//  create Order
const getOrder = async (req, res) => {
  await OrderModel.find()
    .then((resultData) => {
      res.json(resultData);
    })
    .catch((err) => console.warn(err));
};

//

//
const deleteOrder = async (req, res) => {
  await OrderModel.deleteOne({ _id: req.params.id })
    .then((result5) => {
      res.json(result5);
    })
    .catch((err) => console.warn(err));
};
// delete Cart

const deleteCart = async (req, res) => {
  await CartModel.deleteOne({ _id: req.params.id })
    .then((result5) => {
      res.json(result5);
    })
    .catch((err) => console.warn(err));
};

const searchProperty = async (req, res) => {
  var regex = new RegExp(req.params.title, "i");
  await PropertyMode.find({ title: regex }).then((resu) =>
    res.status(200).json(resu)
  );
};

const getProperty = async (req, res) => {
  await PropertyMode.find()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      log.warn(err);
    });
};

const createProperty = async (req, res) => {
  const image = req.files.image.tempFilePath;
  console.log("file", image);
  const result = await cloudinary.v2.uploader.upload(image, (err, result) => {
    const add = PropertyMode({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      size: req.body.size,
      price: req.body.price,
      stock: req.body.stock,
      prevPrice: req.body.prevPrice,
      deal: req.body.deal,
      image: result.url,
    });
    console.log("result", result);
    if (!req.files) {
      res.send({ code: 500, msg: "err" });
      console.log(add);
    } else {
      res.send({ code: 200, msg: "upload successful" });
    }
    add
      .save()
      .then((result2) => {
        res.json(result2);
      })
      .catch((err) => console.log(err));
  });
};

const updateProperty = (req, res) => {
  PropertyMode.updateOne(
    { _id: req.params.id },
    {
      $set: {
        stock: req.body.stock,
      },
    }
  )
    .then((result3) => {
      res.json(result3);
    })
    .catch((err) => console.warn(err));
};

const deleteProperty = async (req, res) => {
  try {
    await PropertyMode.deleteOne({ _id: req.params.id });
    await CartModel.deleteMany({ itemId: req.params.id });
    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.log(error);
  }
};
const orderNewFeature = async (req, res) => {
  const { amount, otp } = req.body;
  try {
    const user = await AuthModel.findById(req.body._id);
    if (!user) {
      return res.status(404).send("User not found.");
    }
    if (user.blocked) {
      return res.status(403).send("You are blocked and cannot place an order.");
    }
    if (user.otp !== otp) {
      return res.status(400).send("Invalid OTP");
    }
    const currentTimestamp = Date.now();
    if (user.otp_expire && user.otp_expire < currentTimestamp) {
      return res.status(400).send("OTP has expired");
    }
    const orderItemsIds = await Promise.all(
      req?.body?.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
          quantity: orderItem.quantity,
          product: orderItem.product,
        });

        newOrderItem = await newOrderItem.save();
        const foundProduct = await PropertyMode.findById(orderItem.product);

        if (!foundProduct) {
          throw new Error(`Product not found: ${orderItem.product}`);
        }

        if (foundProduct?.stock < orderItem?.quantity) {
          return res
            .status(405)
            .send(`Insufficient stock for product: ${orderItem.product}`);
        }

        // Update stock for the ordered product
        await PropertyMode.findByIdAndUpdate(orderItem.product, {
          $inc: { stock: -orderItem.quantity },
        });

        return newOrderItem._id;
      })
    );

    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2022-08-01" }
    );

    const total = req.body.amount >= 20 ? req.body.amount : req.body.amount + 1; 

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100, // Amount in cents/pence
      currency: "pkr",
      payment_method_types: ["card"],
      metadata: {},
    });
    const paymentIntentId = paymentIntent.id;

    const orderS = new OrderShipping({
      orderItems: orderItemsIds,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      phone: req.body.phone,
      status: req.body.status,
      user: req.body.user,
      paymentStatus: true,
      total: total, // Use the updated 'total' which may include an extra $1
      amount: req.body.amount,
      paymentIntentId: paymentIntentId,
    });
    await orderS.save();

    const cart = await CartModel.findOne({ loginId: req?.body?.loginId });
    await CartModel.updateMany(
      { cart: cart },
      {
        $set: {
          loginId: " ",
        },
      }
    );

    res.status(200).json({
      paymentIntent: paymentIntent?.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const sendOtpVerifyUser = async (req, res) => {
  try {
    const user = await AuthModel.findById(req.body._id); // Assuming _id contains the user ID
    console.log("email", user.email);
    const otpExpiration = Date.now() + 60000; // 1 minute expiration time
    const otpData = Math.floor(100000 + Math.random() * 900000).toString();
    const mailOptions = {
      from: "simpleboy1917@gmail.com", // Replace with your email address
      to: user.email,
      subject: "OTP for Order",
      text: `Your OTP is ${otpData}`,
    };
    await transport.sendMail(mailOptions);
    user.otp = otpData;
    user.otp_expire = otpExpiration;
    await user.save();
    res.send("otp send please check ");
  } catch (error) {
    console.log(error);
  }
};
const createOrder = async (req, res) => {
  try {
    const orderItemsIds = await Promise.all(
      req?.body?.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
          quantity: orderItem.quantity,
          product: orderItem.product,
        });

        newOrderItem = await newOrderItem.save();
        const foundProduct = await PropertyMode.findById(orderItem.product);

        if (!foundProduct) {
          throw new Error(`Product not found: ${orderItem.product}`);
        }

        if (foundProduct?.stock < orderItem?.quantity) {
          return res
            .status(405)
            .send(`Insufficient stock for product: ${orderItem.product}`);
        }

        // Update stock for the ordered product
        await PropertyMode.findByIdAndUpdate(orderItem.product, {
          $inc: { stock: -orderItem.quantity },
        });

        return newOrderItem._id;
      })
    );

    const { otp } = req.body;
    const total = req.body.total >= 1000 ? req.body.total : req.body.total + 1;

    const user = await AuthModel.findById(req.body._id); // Assuming _id contains the user ID
    if (!user) {
      return res.status(404).send("User not found.");
    }
    if (user.blocked) {
      return res.status(403).send("You are blocked and cannot place an order.");
    }
    if (user.otp !== otp) {
      return res.status(400).send("Invalid OTP");
    }
    const currentTimestamp = Date.now();
    if (user.otp_expire && user.otp_expire < currentTimestamp) {
      return res.status(400).send("OTP has expired");
    }

    let orderS = new OrderShipping({
      orderItems: orderItemsIds,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      phone: req.body.phone,
      status: req.body.status,
      user: req.body.user,
      paymentStatus: false,
      total: total,
    });

    orderS = await orderS.save();

    if (!orderS) {
      // Rollback stock update by incrementing the stock back for each ordered product
      await Promise.all(
        req?.body?.orderItems.map(async (orderItem) => {
          await ProductModel.findByIdAndUpdate(orderItem.product, {
            $inc: { stock: orderItem.quantity },
          });
        })
      );

      return res.status(400).send("The order cannot be created!");
    }

    const cart = await CartModel.findOne({ loginId: req.body.loginId });
    await CartModel.updateMany(
      { cart: cart },
      {
        $set: {
          loginId: " ",
        },
      }
    );

    res.send(orderS);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
};
// Refund Payment
const refundOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Retrieve the order from the database
    const order = await OrderShipping.findById(orderId).populate("orderItems");

    // Check if the order exists
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the order has already been refunded
    if (order.status === "Refunded") {
      return res
        .status(400)
        .json({ message: "Order has already been refunded" });
    }

    // Retrieve the paymentIntentId associated with the order
    const paymentIntentId = order.paymentIntentId;

    // Initiate the refund using the Stripe API
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    // Update the order status and set refunded to true
    order.status = "Refunded";
    await order.save();

    // Revert the product stock changes made during the order creation
    for (const orderItem of order.orderItems) {
      // Retrieve the product from the database
      const product = await PropertyMode.findById(orderItem.product);

      if (product) {
        // Increment the product's stock quantity
        product.stock += orderItem.quantity;
        await product.save();
      } else {
        // If the product is not found, log an error and continue with the next order item
        console.error(`Product not found: ${orderItem.product}`);
      }
    }

    res.status(200).json({ message: "Refund successful" });
  } catch (error) {
    console.error("Error processing refund:", error);
    res
      .status(500)
      .json({ message: "Error processing refund", error: error.message });
  }
};

const getOrderDeatil = async (req, res) => {
  const orderList = await OrderShipping.find()
    .populate("user", ["name", "email"])
    .populate({ path: "orderItems", populate: "product" })
    .sort({ dateOrdered: -1 });

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
};

const orderStatusController = async (req, res) => {
  try {
    const _id = req.body._id;
    const status = req.body.status;
    const orders = await OrderShipping.findByIdAndUpdate(
      _id,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updateing Order",
      error,
    });
  }
};

const getOneOrder = async (req, res) => {
  const order = await OrderShipping.find({ user: req.params.id })
    .populate("user", ["email", "name"])
    .populate({ path: "orderItems", populate: "product" })
    .sort({ dateOrdered: -1 });
  if (!order) {
    res.status(500).json({ success: false });
  }
  res.send(order);
};

const getOneOrderDetail = async (req, res) => {
  const order = await OrderShipping.findOne({ _id: req.params.id })
    .populate("user", ["name", "email"])
    .populate({ path: "orderItems", populate: "product" })
    .sort({ dateOrdered: -1 });
  if (!order) {
    res.status(500).json({ success: false });
  }
  res.send(order);
};
const calculateTotalEarnings = async (req, res) => {
  try {
    const orders = await OrderShipping.find({ paymentStatus: true });
    let totalEarnings = 0;
    let totalRefunds = 0;

    orders.forEach((order) => {
      const orderTotal = parseFloat(order.total);
      if (!isNaN(orderTotal)) {
        totalEarnings += orderTotal;
      }

      if (order.status === "Refunded") {
        const refundAmount = parseFloat(order.total);
        if (!isNaN(refundAmount)) {
          totalRefunds += refundAmount;
        }
      }
    });

    const netEarnings = totalEarnings - totalRefunds;

    console.log("Total Earnings: $", totalEarnings.toFixed(2));
    console.log("Total Refunds: $", totalRefunds.toFixed(2));
    console.log("Net Earnings: $", netEarnings.toFixed(2));

    res.send({
      totalEarnings: totalEarnings.toFixed(2),
      totalRefunds: totalRefunds.toFixed(2),
      netEarnings: netEarnings.toFixed(2),
    });
  } catch (error) {
    console.error("Error calculating total earnings:", error);
    res.status(500).json({ error: "Error calculating total earnings" });
  }
};
const updatePayment = (req, res) => {
  OrderShipping.updateOne(
    { _id: req.params.id },
    {
      $set: {
        paymentStatus: req.body.paymentStatus,
      },
    }
  )
    .then((result3) => {
      res.json(result3);
    })
    .catch((err) => console.warn(err));
};

// getTotal Sales with product
// const getProductSales = async (req, res) => {
//   try {
//     const products = await PropertyMode.find();
//     const productSales = [];
//     const citySales = {};
//     let totalSales = 0;

//     for (const product of products) {
//       const orderItems = await OrderItem.find({ product: product._id });
//       let totalProductSales = 0;

//       for (const orderItem of orderItems) {
//         const quantity = orderItem.quantity;
//         const price = product.price;

//         const orderShipping = await OrderShipping.findOne({
//           orderItems: orderItem._id,
//         });

//         if (orderShipping && orderShipping.paymentStatus === true) {
//           const city = orderShipping.city;
//           var dateOrdered = orderShipping?.dateOrdered;
//           totalProductSales += quantity * price;
//           totalSales += quantity * price;

//           // Combine sales for the same product ID and city, otherwise create separate entries
//           const existingSale = productSales.find(
//             (sale) => sale.product === product._id && sale.city === city
//           );

//           if (existingSale) {
//             existingSale.sales += quantity * price;
//           } else {
//             const productSale = {
//               product: product.title, // Use the product name instead of product ID
//               sales: quantity * price,
//               price: product.price,
//               city: city,
//               dateOrdered: dateOrdered, // Include the date in the product sale object
//             };

//             productSales.push(productSale);
//           }

//           // Keep track of sales for each city
//           if (citySales[city]) {
//             citySales[city] += quantity * price;
//           } else {
//             citySales[city] = quantity * price;
//           }
//         }
//       }
//     }
//     const citySalesData = Object.keys(citySales).map((city) => ({
//       city,
//       totalSales: citySales[city],
//     }));

//     res
//       .status(200)
//       .json({ productSales, totalSales, citySales: citySalesData });
//   } catch (error) {
//     console.error("Error getting product sales:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// Example usage
const getProductSales = async (req, res) => {
  try {
    const products = await PropertyMode.find();
    const productSales = [];
    const citySales = {};
    const cityProfits = {};
    let totalSales = 0;
    let totalProfit = 0;
    let totalQuantitySold = 0;

    for (const product of products) {
      const orderItems = await OrderItem.find({ product: product._id });

      for (const orderItem of orderItems) {
        const quantity = orderItem.quantity;
        const price = product.price;
        const costPrice = product.costPrice;

        const orderShipping = await OrderShipping.findOne({
          orderItems: orderItem._id,
        });

        if (orderShipping) {
          if (
            orderShipping.status !== "Refunded" &&
            orderShipping.status !== "cancel" &&
            orderShipping.status === "deliverd" &&
            orderShipping.paymentStatus === true
          ) {
            const city = orderShipping.city;
            const dateOrdered = orderShipping.dateOrdered;
            const saleAmount = quantity * price;

            totalSales += saleAmount;
            totalQuantitySold += quantity;

            const existingSale = productSales.find(
              (sale) => sale.product === product._id && sale.city === city
            );

            if (existingSale) {
              existingSale.sales += saleAmount;
            } else {
              const productSale = {
                product: product.title,
                sales: saleAmount,
                costPrice: costPrice,
                price: price,
                city: city,
                dateOrdered: dateOrdered,
              };

              productSales.push(productSale);
            }

            if (citySales[city]) {
              citySales[city] += saleAmount;
            } else {
              citySales[city] = saleAmount;
            }

            const profit = saleAmount - costPrice * quantity;
            if (cityProfits[city]) {
              cityProfits[city] += profit;
            } else {
              cityProfits[city] = profit;
            }
          } else if (orderShipping.refunded) {
            // If the order is refunded, adjust the total sales and profits accordingly
            totalSales -= orderShipping.refundedAmount;
            totalProfit -= orderShipping.refundedAmount - costPrice * quantity;
          }
        }
      }
    }

    // Calculate profit for each product and update totalProfit
    for (const productSale of productSales) {
      productSale.profit =
        productSale.sales -
        (productSale.costPrice * productSale.sales) / productSale.price;
      totalProfit += productSale.profit;
    }

    const citySalesData = Object.keys(citySales).map((city) => ({
      city,
      totalSales: citySales[city],
      totalProfit: cityProfits[city] || 0,
    }));

    res.status(200).json({
      productSales,
      totalSales,
      totalProfit,
      totalQuantitySold,
      citySales: citySalesData,
    });
  } catch (error) {
    console.error("Error getting product sales:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Create a favorite for a specific user
const createFavourite = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const existingFavorite = await FavoriteModel.findOne({
      userId,
      product: productId,
    });

    if (existingFavorite) {
      // If favorite exists, remove it
      await FavoriteModel.findByIdAndRemove(existingFavorite._id);
      res.json({ message: "Item unliked successfully", isFavorite: false });
    } else {
      // If favorite doesn't exist, create it
      const favorite = new FavoriteModel({ userId, product: productId });
      await favorite.save();
      res.json({ message: "Item liked successfully", isFavorite: true });
    }
  } catch (error) {
    res.status(500).json({ error: "Error toggling favorite" });
  }
};
const getAllFav = async (req, res) => {
  const { userId } = req.params;

  try {
    const userFavorites = await FavoriteModel.find({ userId }).populate(
      "product",
      "title image price size"
    );
    res.json({ favorites: userFavorites });
  } catch (error) {
    res.status(500).json({ error: "Error retrieving favorites" });
  }
};
// check fav
const checkFav = async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const existingFavorite = await FavoriteModel.findOne({
      userId,
      product: productId,
    });

    if (existingFavorite) {
      res.json({ isFavorite: true });
    } else {
      res.json({ isFavorite: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Error checking favorite" });
  }
};
//  update payment and add earning
module.exports = {
  searchProperty,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  createCart1,
  getCart,
  deleteCart,
  createOrder,
  getOrder,
  deleteOrder,
  orderStatusController,
  orderNewFeature,
  getOrderDeatil,
  getOneOrder,
  getOneOrderDetail,
  sendOtpVerifyUser,
  calculateTotalEarnings,
  refundOrder,
  updatePayment,
  getProductSales,
  createFavourite,
  getAllFav,
  checkFav
};
