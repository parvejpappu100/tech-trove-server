const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorize access" });
  }

  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorize access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fdnsrak.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productsCollection = client.db("techDb").collection("products");
    const arrivalsCollection = client.db("techDb").collection("arrivals");
    const offersCollection = client.db("techDb").collection("offers");
    const slidersCollection = client.db("techDb").collection("sliders");
    const discountCollection = client.db("techDb").collection("discount");
    const sponsorsCollection = client.db("techDb").collection("sponsors");
    const usersCollection = client.db("techDb").collection("users");
    const cartsCollection = client.db("techDb").collection("carts");
    const savedProductCollection = client
      .db("techDb")
      .collection("savedProduct");
    const paymentsCollection = client.db("techDb").collection("payments");

    // * JWT:
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res.send({ token });
    });

    // * Verify admin:
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    // * To get all products data:
    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // * To get arrivals data:
    app.get("/arrivals", async (req, res) => {
      const result = await arrivalsCollection.find().toArray();
      res.send(result);
    });

    // * To get offers Data:
    app.get("/offers", async (req, res) => {
      const result = await offersCollection.find().toArray();
      res.send(result);
    });

    // * To get sliders data:
    app.get("/sliders", async (req, res) => {
      const result = await slidersCollection.find().toArray();
      res.send(result);
    });

    // * To add new slider:
    app.post("/addSlider", verifyJWT, verifyAdmin, async (req, res) => {
      const newSlider = req.body;
      const result = await slidersCollection.insertOne(newSlider);
      res.send(result);
    });

    // * To update slider:
    app.put("/updateSlider/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateSlider = req.body;
      const setNewSlider = {
        $set: {
          title: updateSlider.title,
          category: updateSlider.category,
          details: updateSlider.details,
          image: updateSlider.image,
        },
      };
      const result = await slidersCollection.updateOne(
        filter,
        setNewSlider,
        options
      );
      res.send(result);
    });

    // * To delete slider:
    app.delete(
      "/deleteSlider/:id",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await slidersCollection.deleteOne(query);
        res.send(result);
      }
    );

    // * To get Special Discount Data:
    app.get("/discount", async (req, res) => {
      const result = await discountCollection.find().toArray();
      res.send(result);
    });

    // * To get sponsors data:
    app.get("/sponsors", async (req, res) => {
      const result = await sponsorsCollection.find().toArray();
      res.send(result);
    });

    // * To add new sponsor:
    app.post("/addSponsor", verifyJWT, verifyAdmin, async (req, res) => {
      const newSponsor = req.body;
      const result = await sponsorsCollection.insertOne(newSponsor);
      res.send(result);
    });

    // * Carts Collections apis:

    // * To get carts data:
    app.get("/carts", verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
        return;
      }

      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }

      const query = { email: email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });

    //* add carts product on carts collection:
    app.post("/carts", verifyJWT, async (req, res) => {
      const item = req.body;
      const result = await cartsCollection.insertOne(item);
      res.send(result);
    });

    // * TO GET USER:

    // * To get all users api:
    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // * TO GET USER INFO:
    app.get("/user-info/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // * SAVED USER:
    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exist" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // * UPDATE USER ROLE:
    app.put("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedRole = req.body;
      const setNewRole = {
        $set: {
          role: updatedRole.role,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        setNewRole,
        options
      );
      res.send(result);
    });

    // * UPDATE USER ADDRESS INFO:
    app.put("/update-user-info/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updateUserInfo = req.body;
      const setNewInfo = {
        $set: {
          city: updateUserInfo.city,
          phone: updateUserInfo.phone,
          country: updateUserInfo.country,
          message: updateUserInfo.message,
          postCode: updateUserInfo.postCode,
          address: updateUserInfo.address,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        setNewInfo,
        options
      );
      res.send(result);
    });

    // * CHECK ADMIN OR  NOT:
    app.get("/users/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        return res.send({ admin: false });
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    // * DELETE USER:
    app.delete("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // * Update carts product quantity:
    app.put("/carts/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedQuantity = req.body;
      const product = {
        $set: {
          productQuantity: updatedQuantity.newQuantity,
        },
      };
      const result = await cartsCollection.updateOne(filter, product, options);
      res.send(result);
    });

    // * DELETE carts product:
    app.delete("/carts/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });

    // * Saved Product Collections apis:

    // * To get saved data:
    app.get("/saved", verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
        return;
      }

      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }

      const query = { email: email };
      const result = await savedProductCollection.find(query).toArray();
      res.send(result);
    });

    // add saved product on saved collection:
    app.post("/saved", verifyJWT, async (req, res) => {
      const item = req.body;
      const result = await savedProductCollection.insertOne(item);
      res.send(result);
    });

    // * ADD TO CART SAVED PRODUCT:
    app.post("/add-saved-product", verifyJWT, async (req, res) => {
      const item = req.body;
      const insertResult = await cartsCollection.insertOne(item);
      const query = { productId: item.productId };
      const deletedResult = await savedProductCollection.deleteOne(query);

      res.send({ insertResult, deletedResult });
    });

    // * TO DELETE SAVED CARD DATA:
    app.delete("/saved-delete/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await savedProductCollection.deleteOne(query);
      res.send(result);
    });

    // * CREATE PAYMENT INTENT:
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = parseFloat((price * 100).toFixed(2));
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // * GET ALL USER PAYMENT DATA:
    app.get("/users-payment-data", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await paymentsCollection
        .find()
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    // * CHANGE ORDER STATUS:
    app.put(
      "/user-payment-data/:id",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateStatus = req.body;
        const setNewStatus = {
          $set: {
            status: updateStatus.status,
          },
        };
        const result = await paymentsCollection.updateOne(
          filter,
          setNewStatus,
          options
        );
        res.send(result);
      }
    );

    // * GET CURRENT USER PAYMENT DATA:
    app.get("/payment-data/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (!email) {
        res.send([]);
        return;
      }

      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }

      const query = { email: email };
      const result = await paymentsCollection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    // * Delete cart Item after successfully payment and save payment information in db:
    app.post("/payments", verifyJWT, async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentsCollection.insertOne(payment);

      const query = { email: payment.email };
      const deletedResult = await cartsCollection.deleteMany(query);

      res.send({ insertResult, deletedResult });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Tech Trove is coming");
});

app.listen(port, () => {
  console.log(`Tech Trove is running on port: ${port}`);
});
