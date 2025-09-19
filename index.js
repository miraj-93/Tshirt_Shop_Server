
const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@miraj.j8khqqj.mongodb.net/?retryWrites=true&w=majority&appName=Miraj`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


// React Build Serve
// =======================
// app.use(express.static(path.join(__dirname, "public_html")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "public_html", "index.html"));
// });



async function run() {
  try {
    await client.connect();

    // Database + Collection
    const db = client.db("tshirtShopDB");
    const userCollection = db.collection("users");
    const productCollection = db.collection("products");
    const blogCollection = db.collection("blogs");
  


    // ✅ Save or update user profile (register / login)
    app.post("/users", async (req, res) => {
      const user = req.body;

      if (!user.role) {
        user.role = "customer"; // default role
      }

      try {
        const result = await userCollection.updateOne(
          { email: user.email },  // search by email
          { $set: user },         // update data
          { upsert: true }        // insert if not found
        );
        res.json({ success: true, result });
      } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).json({ success: false, error: "Database error" });
      }
    });

    // ✅ Update user by Firebase UID
  app.put("/api/users/uid/:uid", async (req, res) => {
  const uid = req.params.uid;
  try {
    const result = await userCollection.updateOne(
      { uid },
      { $set: req.body }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "User not found" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});


    // ✅ Get user details
    app.get("/users/details/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const user = await userCollection.findOne({ email });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
      } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Database error" });
      }
    });

    // ✅ Promote user to admin
    app.patch("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const result = await userCollection.updateOne(
          { email },
          { $set: { role: "admin" } }
        );
        res.json(result);
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Database error" });
      }
    });

    // ✅ CRUD for users
    app.get("/api/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.json(users);
    });

    app.get("/api/users/:id", async (req, res) => {
      try {
        const user = await userCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
      } catch (err) {
        res.status(400).json({ error: "Invalid user ID" });
      }
    });

    app.post("/api/users", async (req, res) => {
      try {
        const result = await userCollection.insertOne(req.body);
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: "Failed to create user" });
      }
    });

    app.put("/api/users/:id", async (req, res) => {
      try {
        const result = await userCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: req.body }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });
        res.json(result);
      } catch (err) {
        res.status(400).json({ error: "Invalid user ID" });
      }
    });

    app.delete("/api/users/:id", async (req, res) => {
      try {
        const result = await userCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: "User not found" });
        res.json(result);
      } catch (err) {
        res.status(400).json({ error: "Invalid user ID" });
      }
    });

    // ✅ CRUD for products
    app.post("/api/products", async (req, res) => {
      const product = req.body;
      try {
        const result = await productCollection.insertOne(product);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to create product" });
      }
    });

    app.get("/api/products", async (req, res) => {
      const products = await productCollection.find().toArray();
      res.json(products);
    });

    app.get("/api/products/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const product = await productCollection.findOne({ _id: new ObjectId(id) });
        res.json(product);
      } catch {
        res.status(400).json({ error: "Invalid product ID" });
      }
    });

    app.put("/api/products/:id", async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      try {
        const result = await productCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updated }
        );
        res.json(result);
      } catch {
        res.status(400).json({ error: "Invalid product ID" });
      }
    });

    app.delete("/api/products/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await productCollection.deleteOne({ _id: new ObjectId(id) });
        res.json(result);
      } catch {
        res.status(400).json({ error: "Invalid product ID" });
      }
    });


// Product search
app.get("/api/products/search", async (req, res) => {
  const q = req.query.q || "";
  try {
    const products = await productCollection
      .find({ name: { $regex: q, $options: "i" } })
      .toArray();
    res.json(products);
  } catch (err) {
    console.error("Product search error:", err);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// Blog search
app.get("/api/blogs/search", async (req, res) => {
  const q = req.query.q || "";
  try {
    const blogs = await blogCollection
      .find({ title: { $regex: q, $options: "i" } })
      .toArray();
    res.json(blogs);
  } catch (err) {
    console.error("Blog search error:", err);
    res.status(500).json({ error: "Failed to search blogs" });
  }
});







    // ✅ CRUD for blogs (without image upload)
    app.post("/api/blogs", async (req, res) => {
      try {
        const { title, content } = req.body;

        const result = await blogCollection.insertOne({
          title,
          content,
          createdAt: new Date(),
        });

        res.json(result);
      } catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).json({ error: "Failed to create blog" });
      }
    });

    app.get("/api/blogs", async (req, res) => {
      try {
        const blogs = await blogCollection.find().sort({ createdAt: -1 }).toArray();
        res.json(blogs);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch blogs" });
      }
    });

    app.get("/api/blogs/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const blog = await blogCollection.findOne({ _id: new ObjectId(id) });
        res.json(blog);
      } catch {
        res.status(400).json({ error: "Invalid blog ID" });
      }
    });

    app.put("/api/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      try {
        const result = await blogCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updated }
        );
        res.json(result);
      } catch {
        res.status(400).json({ error: "Invalid blog ID" });
      }
    });

    app.delete("/api/blogs/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await blogCollection.deleteOne({ _id: new ObjectId(id) });
        res.json(result);
      } catch {
        res.status(400).json({ error: "Invalid blog ID" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. Connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to T-Shirt Shop");
});

app.listen(port, () => {
  console.log(`This Backend Server is Running on Port ${port}`);
});
