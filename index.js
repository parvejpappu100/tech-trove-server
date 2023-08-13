const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;


// MIDDLEWARE
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fdnsrak.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
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
    const savedProductCollection = client.db("techDb").collection("savedProduct");

    // * To get all products data:
    app.get("/products" , async(req , res) => {
        const result = await productsCollection.find().toArray();
        res.send(result);
    });

    // * To get arrivals data: 
    app.get("/arrivals" , async(req , res) => {
        const result = await arrivalsCollection.find().toArray();
        res.send(result);
    });

    // * To get offers Data:
    app.get("/offers" , async(req , res) => {
        const result = await offersCollection.find().toArray();
        res.send(result);
    });

    // * To get sliders data:
    app.get("/sliders" , async (req , res) => {
        const result = await slidersCollection.find().toArray();
        res.send(result);
    });

    // * To get Special Discount Data:
    app.get("/discount" , async (req , res) => {
        const result = await discountCollection.find().toArray();
        res.send(result)
    });

    // * To get sponsors data:
    app.get("/sponsors" , async(req , res) => {
        const result = await sponsorsCollection.find().toArray();
        res.send(result);
    })


    // * Carts Collections apis:

    // * To get carts data:
    app.get("/carts" , async(req , res) => {
      const email = req.query.email;
      if(!email){
        res.send([])
        return
      }
      const query = {email: email};
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    })

    // add carts product on carts collection:
    app.post("/carts" , async(req , res) => {
      const item = req.body;
      console.log(item)
      const result = await cartsCollection.insertOne(item);
      res.send(result);
    });

    // * Update carts product quantity:
    app.put("/carts/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = { _id: new ObjectId(id) };
      console.log(filter)
      const options = { upsert: true };
      const updatedQuantity = req.body;
      const product = {
        $set: {
          productQuantity: updatedQuantity.newQuantity
        },
      };
      const result = await cartsCollection.updateOne(filter, product, options);
      res.send(result);
    });


    // * Saved Product Collections apis:

    // * To get saved data:
    app.get("/saved" , async(req , res) => {
      const email = req.query.email;
      if(!email){
        res.send([])
        return
      }
      const query = {email: email};
      const result = await savedProductCollection.find(query).toArray();
      res.send(result);
    })

    // add saved product on saved collection:
    app.post("/saved" , async(req , res) => {
      const item = req.body;
      const result = await savedProductCollection.insertOne(item);
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get( '/' , (req , res) => {
    res.send('Tech Trove is coming')
});

app.listen(port , () => {
    console.log(`Tech Trove is running on port: ${port}`)
})