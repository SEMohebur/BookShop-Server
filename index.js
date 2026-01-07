require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 3000;

//middleeware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const db = client.db("bookShop");
    const bookCollection = db.collection("books");
    const userRoleCollection = db.collection("user");
    const addtoCartCollection = db.collection("addToCartBoks");

    // all books get api
    app.get("/books", async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get single 1 data
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.findOne(query);
      res.send(result);
    });

    //get recent 6 data
    app.get("/recentBooks", async (req, res) => {
      const cursor = bookCollection.find().sort({ createdAt: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // post api
    app.post("/books", async (req, res) => {
      const newBook = req.body;
      const result = await bookCollection.insertOne(newBook);
      res.send(result);
    });

    // update api
    app.patch("/books/:id", async (req, res) => {
      const id = req.params.id;
      const updateBook = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updateBook,
      };
      const result = await bookCollection.updateOne(query, update);
      res.send(result);
    });

    //delete api
    app.delete("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);
      res.send(result);
    });

    // user create
    app.post("/user", async (req, res) => {
      const newUser = req.body;
      newUser.role = "user";
      newUser.createdAt = new Date();
      const email = newUser.email;
      const userExist = await userRoleCollection.findOne({ email });
      if (userExist) {
        return res.send({ message: "user Exists" });
      }
      const result = await userRoleCollection.insertOne(newUser);
      res.send(result);
    });

    // get single user
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const result = await userRoleCollection.findOne({ email });
      res.send(result);
    });

    //  add to cart
    app.post("/addToCart", async (req, res) => {
      const newAddToCart = req.body;
      const result = await addtoCartCollection.insertOne(newAddToCart);
      res.send(result);
    });

    // my carts/product
    app.get("/getAllCartItem", async (req, res) => {
      const email = req.query.email;
      const cartItems = await addtoCartCollection
        .find({ userEmail: email })
        .toArray();
      res.send(cartItems);
    });

    // delete book
    app.delete("/myBook/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;

      const query = {
        _id: new ObjectId(id),
        userEmail: email,
      };
      const result = await addtoCartCollection.deleteOne(query);
      res.send(result);
    });

    // get all request book i mean add to cart all data
    app.get("/requestAllBook", async (req, res) => {
      const cursor = addtoCartCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //admin approve book api
    app.patch("/approveBook/:id", async (req, res) => {
      const id = req.params.id;
      const result = await addtoCartCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "approved",
            approvedAt: new Date(),
          },
        }
      );
      res.send({
        success: true,
        message: "Book request approved",
      });
    });

    //admin reject book api
    app.patch("/rejectBook/:id", async (req, res) => {
      const id = req.params.id;
      const result = await addtoCartCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "reject",
            rejectAt: new Date(),
          },
        }
      );
      res.send({
        success: true,
        message: "Book request reject",
      });
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
