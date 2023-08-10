const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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