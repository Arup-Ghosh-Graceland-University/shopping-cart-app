// backend/server.js

const path = require("path");
// 1) Imports

// Import the Express framework to build the HTTP server.
const express = require("express");
// Import Mongoose to connect and work with MongoDB.
const mongoose = require("mongoose");
// Import CORS middleware to allow requests from other origins (like the frontend).
const cors = require("cors");
// Import bcryptjs to hash and compare passwords securely.
const bcrypt = require("bcryptjs");
// Import jsonwebtoken to create and verify JWT tokens.
const jwt = require("jsonwebtoken");
// Import cookie-parser to read cookies from incoming HTTP requests.
const cookieParser = require("cookie-parser");
// Load environment variables from a .env file into process.env.
require("dotenv").config(); // load .env

// 2) Create Express app

// Create an Express application instance.
const app = express();

// 3) Global middleware

// Set up CORS so that the frontend running on http://localhost:5173
// is allowed to call this backend API and send cookies along with requests.
app.use(
  cors({
    // Only allow requests coming from this specific frontend origin.
    origin: "http://localhost:5173",
    // Allow cookies and other credentials to be sent with requests.
    credentials: true,
  })
);

// Tell Express to automatically parse JSON request bodies into JavaScript objects.
app.use(express.json());

// Tell Express to use cookie-parser so that req.cookies contains any cookies sent by the client.
app.use(cookieParser());

// 4) Mongoose Schemas and Models

// Define a schema for products that will be stored in the "products" collection.
const productSchema = new mongoose.Schema(
  {
    // "name" is the name of the product and is required.
    name: { type: String, required: true },
    // "category" is a string like "Electronics", "Books", etc.
    category: String, // e.g. "Electronics"
    // "price" is the cost of the product and is required.
    price: { type: Number, required: true },
    // "description" is a short text describing the product.
    description: String,
    // "image" is the URL or path to a product image.
    image: String, // e.g. "/images/laptop.jpg"
    // "stock" holds how many units of this product are available.
    stock: { type: Number, default: 0 }, // number in stock
  },
  {
    // Disable the "__v" version field that Mongoose normally adds.
    versionKey: false, // remove "__v" to avoid VersionError noise in class
  }
);

// Define a schema for users who register in the system.
const userSchema = new mongoose.Schema(
  {
    // "name" is the display name of the user.
    name: String,
    // "email" is unique and required so that no two users share the same email.
    email: { type: String, unique: true, required: true },
    // "password" will store the hashed password, not the plain text one.
    password: String, // hashed
    // "cart" is an array of items that the user wants to buy.
    cart: [
      {
        // "productId" references a Product document by its ObjectId.
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        // "quantity" is how many units of that product the user wants.
        quantity: Number,
      },
    ],
  },
  {
    // Again, disable the "__v" field for cleaner documents.
    versionKey: false,
  }
);

// Define a schema for orders created when a user checks out their cart.
const orderSchema = new mongoose.Schema(
  {
    // "user" references the user who placed the order.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // "items" holds all the products in this order.
    items: [
      {
        // "productId" references the product that was purchased.
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        // "quantity" is how many units of that product were ordered.
        quantity: Number,
        // "priceAtPurchase" keeps the price of the product at the time of the order.
        priceAtPurchase: Number, // price at the time of order
      },
    ],
    // "subtotal" is the sum of all line totals before tax.
    subtotal: Number,
    // "tax" is the tax amount charged on the order.
    tax: Number,
    // "total" is the final amount (subtotal + tax).
    total: Number,
    // "createdAt" records the date and time when the order was created.
    createdAt: { type: Date, default: Date.now },
  },
  {
    // Disable "__v" version key for orders as well.
    versionKey: false,
  }
);

// Create a model named "Product" using the productSchema.
// This model will be used to interact with the "products" collection.
const Product = mongoose.model("Product", productSchema);
// Create a model named "User" using the userSchema.
// This model will be used to interact with the "users" collection.
const User = mongoose.model("User", userSchema);
// Create a model named "Order" using the orderSchema.
// This model will be used to interact with the "orders" collection.
const Order = mongoose.model("Order", orderSchema);

// 5) Seed sample products (run only when DB is empty)

// Define an async function that adds some sample products if none are present.
async function seedProducts() {
  // Count how many products currently exist in the database.
  const count = await Product.countDocuments();
  // If there is already at least one product, do not seed again.
  if (count > 0) {
    console.log("Products already seeded.");
    return;
  }

  // Insert multiple sample products into the database at once.
  await Product.insertMany([
    {
      // Sample product: laptop.
      name: "Laptop Pro 14",
      category: "Electronics",
      price: 1299,
      description: "Lightweight 14-inch laptop for work and study.",
      // Image is assumed to be served from the frontend's public/images folder.
      image: "/images/laptop.jpg", // served from frontend public/images
      stock: 3,
    },
    {
      // Sample product: wireless headphones.
      name: "Wireless Headphones",
      category: "Accessories",
      price: 199,
      description: "Noise-cancelling headphones with long battery life.",
      image: "/images/headphones.jpg",
      stock: 9,
    },
    {
      // Sample product: JavaScript book.
      name: "Programming Book: JavaScript Basics",
      category: "Books",
      price: 39,
      description: "Beginner-friendly introduction to JavaScript.",
      image: "/images/js-book.jpg",
      stock: 6,
    },
  ]);

  // Log that sample products have been inserted.
  console.log("Sample products seeded.");
}

// 6) Connect to MongoDB Atlas and then seed products

// Call mongoose.connect to connect to MongoDB using the connection string in MONGODB_URI.
mongoose
  .connect(process.env.MONGODB_URI)
  // If the connection succeeds, this "then" block runs.
  .then(async () => {
    // Log that the MongoDB connection is successful.
    console.log("Connected to MongoDB Atlas");
    // After connecting, call seedProducts to ensure sample data exists.
    await seedProducts();
  })
  // If there is an error connecting, this "catch" block runs.
  .catch((err) => {
    // Log the connection error for debugging.
    console.error("MongoDB connection error:", err);
  });

// 7) Authentication middleware (using httpOnly cookie with JWT)

/*
  authMiddleware:
  - Reads JWT from an httpOnly cookie named "token".
  - If valid, attaches userId to req.userId.
  - If invalid or missing, returns 401 (unauthorized).
*/

// Define a middleware function to protect routes that require a logged-in user.
function authMiddleware(req, res, next) {
  // Read the "token" cookie from the incoming request.
  const token = req.cookies.token; // cookie name: token

  // If no token exists, the user is not authenticated.
  if (!token) {
    // Send back a 401 status code with a message.
    return res.status(401).json({ message: "Not authenticated (no token)" });
  }

  try {
    // Verify the token using the secret stored in JWT_SECRET.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Store the decoded userId on the request object so later handlers can use it.
    req.userId = decoded.userId; // attach user id
    // Call next() to pass control to the next middleware or route.
    next();
  } catch (err) {
    // If token verification fails, respond with 401 and an error message.
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// 8) Auth routes: register, login, logout, current user

// POST /api/auth/register
// This route creates a new user with a hashed password.
app.post("/api/auth/register", async (req, res) => {
  try {
    // Destructure name, email, and password from the JSON body sent by the client.
    const { name, email, password } = req.body;

    // Look for an existing user with the same email address.
    const existing = await User.findOne({ email });
    // If a user already exists, return a 400 error.
    if (existing) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Hash the plain text password with a salt (10 rounds).
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user document in the database.
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      cart: [],
    });

    // Respond with a 201 status and basic user info (without the password).
    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    // If something goes wrong, log the error.
    console.error("Register error:", err);
    // Respond with a 500 status code indicating a server error.
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
// This route verifies email and password and sets a JWT in an httpOnly cookie.
app.post("/api/auth/login", async (req, res) => {
  try {
    // Extract email and password from the request body.
    const { email, password } = req.body;

    // 1) Try to find a user with the given email.
    const user = await User.findOne({ email });
    // If the user is not found, return a 400 error.
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid email or password (user not found)" });
    }

    // 2) Compare the entered password with the stored hashed password.
    const isMatch = await bcrypt.compare(password, user.password);
    // If the passwords do not match, also return a 400 error.
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email or password (wrong password)" });
    }

    // 3) Create a JWT token that stores the user's id in the payload.
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      // Set an expiration time of 1 hour for this token.
      expiresIn: "1h",
    });

    // 4) Send the token back to the client in an httpOnly cookie.
    res.cookie("token", token, {
      // httpOnly means JavaScript in the browser cannot read this cookie.
      httpOnly: true, // JS cannot read this
      // secure:false for local development; should be true when using HTTPS in production.
      secure: process.env.NODE_ENV === "production",
      // So when we say sameSite for a cookie, we’re telling the browser when to send this cookie 
      // based on whether the request is coming from the same site or from another site.
      // tells the browser to only send this cookie in safer situations, which helps block some 
      // cross-site attack tricks (Cross-Site Request Forgery) but still works when the user 
      // just clicks normal links to your site
      sameSite: "lax",
      // maxAge sets how long the cookie stays valid in the browser (in milliseconds).
      maxAge: 60 * 60 * 1000, // 1 hour in ms
    });

    // 5) Respond with a success message and user info (without password or token).
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    // Log any unexpected errors that happen during login.
    console.error("Login error:", err);
    // Return a generic 500 server error to the client.
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/logout
// This route clears the httpOnly cookie to log the user out.
app.post("/api/auth/logout", (req, res) => {
  // Remove the "token" cookie from the browser.
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  // Respond with a message indicating logout was successful.
  res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
// This route returns the currently logged-in user's data based on the cookie.
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    // Find the user by the id that was stored in req.userId by authMiddleware.
    const user = await User.findById(req.userId).select("name email");
    // If the user does not exist, return a 404 error.
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Return the user's basic information.
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    // Log any errors while fetching the current user.
    console.error("Auth me error:", err);
    // Respond with a 500 server error.
    res.status(500).json({ message: "Server error" });
  }
});

// 9) Products route

// GET /api/products
// This route returns all products in the database.
app.get("/api/products", async (req, res) => {
  try {
    // Retrieve all Product documents.
    const products = await Product.find({});
    // Send the array of products as JSON.
    res.json(products);
  } catch (err) {
    // Log any errors that happen while fetching products.
    console.error("Get products error:", err);
    // Respond with a generic server error.
    res.status(500).json({ message: "Server error" });
  }
});

// 10) Cart routes (protected)

// GET /api/cart
// This route returns the current user's cart with product details populated.
app.get("/api/cart", authMiddleware, async (req, res) => {
  try {
    // Find the user and populate the productId in the cart with full product documents.
    // Then populate cart.productId, i.e. replace each productId in the cart with the 
    // full Product document (name, price, etc.) instead of just the ID.
    const user = await User.findById(req.userId).populate("cart.productId");
    // If user is not found, return a 404 error.
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Map over the user's cart to build a simplified items array.
    const items = user.cart
      .map((item) => {
        // If the product was deleted but still in the cart, skip it.
        if (!item.productId) return null; // product might be deleted
        // Return a simpler object with the fields needed by the frontend.
        return {
          productId: item.productId._id,
          name: item.productId.name,
          category: item.productId.category,
          price: item.productId.price,
          quantity: item.quantity,
        };
      })
      // Filter out any null entries from deleted products.
      .filter(Boolean);

    // Send back the items as the cart content.
    res.json({ items });
  } catch (err) {
    // Log errors related to fetching the cart.
    console.error("Get cart error:", err);
    // Respond with a server error status.
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/cart
// This route adds one unit of a product to the current user's cart, respecting stock.
app.post("/api/cart", authMiddleware, async (req, res) => {
  try {
    // Read the productId from the request body.
    const { productId } = req.body;

    // Find the user who is logged in.
    const user = await User.findById(req.userId);
    // Find the product that is being added to the cart.
    const product = await Product.findById(productId);

    // If user does not exist, inform the client.
    if (!user) return res.status(404).json({ message: "User not found" });
    // If product does not exist, inform the client.
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the product is already in the user's cart.
    const existingItem = user.cart.find(
      (item) => item.productId.toString() === productId
    );

    // Calculate the new quantity based on whether an item already exists.
    const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

    // If the new quantity exceeds available stock, do not allow the addition.
    if (newQuantity > product.stock) {
      return res
        .status(400)
        .json({ message: "Not enough stock for this product." });
    }

    // If an item already exists in the cart, update its quantity.
    if (existingItem) {
      existingItem.quantity = newQuantity;
    } else {
      // If not, push a new cart item into the cart array.
      user.cart.push({ productId, quantity: 1 });
    }

    // Save the updated user document with the changed cart.
    await user.save();
    // Respond with a success message.
    res.json({ message: "Item added to cart" });
  } catch (err) {
    // Log any issues that occur while adding to the cart.
    console.error("Add to cart error:", err);
    // Respond with a server error.
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/cart/:productId
// This route updates the quantity of a cart item or removes it if quantity <= 0.
// PUT – “Replace/update this data.” Used to update an existing thing (often the whole thing).
app.put("/api/cart/:productId", authMiddleware, async (req, res) => {
  try {
    // Read the new quantity from the request body.
    const { quantity } = req.body;
    // Read the productId from the URL path parameters.
    const { productId } = req.params;

    // Find the logged-in user.
    const user = await User.findById(req.userId);
    // Find the product being updated in the cart.
    const product = await Product.findById(productId);

    // If user is missing, return 404.
    if (!user) return res.status(404).json({ message: "User not found" });
    // If product is missing, return 404.
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the cart item that matches the given productId.
    const item = user.cart.find(
      (it) => it.productId.toString() === productId
    );
    // If no such item is found in the cart, return 404.
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // If the new quantity is 0 or negative, remove the item from the cart.
    if (quantity <= 0) {
      // Filter the cart to keep only items that are not this product.
      user.cart = user.cart.filter(
        (it) => it.productId.toString() !== productId
      );
    } else {
      // If the new quantity is more than stock, do not allow it.
      if (quantity > product.stock) {
        return res
          .status(400)
          .json({ message: "Not enough stock for this product." });
      }
      // Otherwise, set the item's quantity to the new value.
      item.quantity = quantity;
    }

    // Save the updated user document to persist cart changes.
    await user.save();
    // Respond that the cart was updated successfully.
    res.json({ message: "Cart updated" });
  } catch (err) {
    // Log any errors during cart update.
    console.error("Update cart error:", err);
    // Respond with a server error status.
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/cart/:productId
// This route removes a product from the user's cart completely.
app.delete("/api/cart/:productId", authMiddleware, async (req, res) => {
  try {
    // Get the productId from the route parameters.
    const { productId } = req.params;
    // Find the logged-in user.
    const user = await User.findById(req.userId);

    // If user is not found, return a 404.
    if (!user) return res.status(404).json({ message: "User not found" });

    // Filter the cart array to remove the specified productId.
    user.cart = user.cart.filter(
      (it) => it.productId.toString() !== productId
    );

    // Save the updated user document.
    await user.save();
    // Respond with a success message.
    res.json({ message: "Item removed from cart" });
  } catch (err) {
    // Log errors related to removing items from the cart.
    console.error("Remove from cart error:", err);
    // Respond with a server error.
    res.status(500).json({ message: "Server error" });
  }
});

// 11) Checkout route (protected)

// POST /api/checkout
// This route processes the cart into an order and clears the cart.
app.post("/api/checkout", authMiddleware, async (req, res) => {
  try {
    // Find the user and populate each cart item's product details.
    const user = await User.findById(req.userId).populate("cart.productId");
    // If user is missing, return 404.
    if (!user) return res.status(404).json({ message: "User not found" });

    // If the cart is empty or not set, return a 400 status.
    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Initialize subtotal to 0 before calculating.
    let subtotal = 0;
    // Prepare an array to hold order item information.
    const orderItems = [];

    // Loop through each item in the user's cart.
    // This loop checks stock and calculates line totals.
    for (const cartItem of user.cart) {
      // "product" is the full product document for this cart item.
      const product = cartItem.productId;
      // If the product no longer exists, return an error.
      if (!product) {
        return res
          .status(400)
          .json({ message: "One of the products no longer exists." });
      }

      // If the cart quantity is more than current stock, return an error.
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          message: `Not enough stock for "${product.name}".`,
        });
      }

      // Calculate the total price for this cart line.
      const lineTotal = product.price * cartItem.quantity;
      // Add this line's total to the subtotal.
      subtotal += lineTotal;

      // Push an item into the orderItems array with quantity and price.
      orderItems.push({
        productId: product._id,
        quantity: cartItem.quantity,
        priceAtPurchase: product.price,
      });
    }

    // Define a fixed tax rate of 7%.
    const taxRate = 0.07; // 7% tax
    // Calculate tax based on subtotal and round to 2 decimal places.
    const tax = +(subtotal * taxRate).toFixed(2);
    // Calculate total as subtotal + tax, also rounded to 2 decimal places.
    const total = +(subtotal + tax).toFixed(2);

    // Decrease stock for each product according to what was ordered.
    for (const cartItem of user.cart) {
      // Find the product again by id.
      const product = await Product.findById(cartItem.productId._id);
      // If the product does not exist anymore, skip it.
      if (!product) continue;
      // Subtract the ordered quantity from the stock.
      product.stock -= cartItem.quantity;
      // Prevent stock from going negative.
      if (product.stock < 0) product.stock = 0;
      // Save the updated product stock.
      await product.save();
    }

    // Create a new order document in the database with all the details.
    const order = await Order.create({
      user: user._id,
      items: orderItems,
      subtotal,
      tax,
      total,
    });

    // Clear the user's cart since the order is placed.
    user.cart = [];
    // Save the updated user document.
    await user.save();

    // Send back a summary of the order to the client.
    res.json({
      message: "Checkout successful",
      order: {
        id: order._id,
        subtotal,
        tax,
        total,
      },
    });
  } catch (err) {
    // Log any errors that occur during checkout.
    console.error("Checkout error:", err);
    // Respond with a server error.
    res.status(500).json({ message: "Server error" });
  }
});

// 12) Order history route (protected)

// GET /api/orders/my
// This route returns all orders for the current user, newest first.
app.get("/api/orders/my", authMiddleware, async (req, res) => {
  try {
    // Find all orders that belong to the logged-in user and sort them by date descending.
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate("items.productId");

    // Map raw order documents to a simpler structure for the frontend.
    const formatted = orders.map((order) => ({
      // Order id
      id: order._id,
      // Creation date of the order
      createdAt: order.createdAt,
      // Subtotal amount
      subtotal: order.subtotal,
      // Tax amount
      tax: order.tax,
      // Total amount charged
      total: order.total,
      // Map items to show product name, category, quantity, and price.
      items: order.items.map((item) => ({
        // If the product has been removed from the database, show a fallback name.
        name: item.productId ? item.productId.name : "Product removed",
        // If product still exists, show its category; otherwise show an empty string.
        category: item.productId ? item.productId.category : "",
        // Quantity ordered for this item.
        quantity: item.quantity,
        // Price per item at purchase time.
        price: item.priceAtPurchase,
      })),
    }));

    // Respond with the array of formatted orders.
    res.json({ orders: formatted });
  } catch (err) {
    // Log any errors that occur while fetching orders.
    console.error("Get orders error:", err);
    // Respond with a generic server error message.
    res.status(500).json({ message: "Server error" });
  }
});


// Serve React frontend (production build)
const frontendPath = path.join(__dirname, "dist");

// Serve static files from the dist folder
app.use(express.static(frontendPath));

// For any non-API route, send back index.html (for React Router)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});



// 13) Start server

// Read the PORT value from environment variables or default to 5000 if not set.
const PORT = process.env.PORT || 5000;

// Start the Express server and listen for HTTP requests on the chosen port.
app.listen(PORT, () => {
  // Log a message so it is clear that the server is running and on which URL.
    console.log(`Server listening on port ${PORT}`);
});
