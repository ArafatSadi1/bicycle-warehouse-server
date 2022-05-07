const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const res = require("express/lib/response");
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e9exc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const bicycleCollection = client.db("bicycle").collection("products");

    // products api
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = bicycleCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    // product api
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await bicycleCollection.findOne(query);
      res.send(product);
    });

    // find my products
    app.get("/product", async(req, res)=>{
      const email = req.query.email;
      const query = {email: email}
      const filter =  bicycleCollection.find(query);
      const myProducts = await filter.toArray();
      res.send(myProducts)
    });

    // put updated product
    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          picture: updatedProduct.picture,
          name: updatedProduct.name,
          about: updatedProduct.about,
          price: updatedProduct.price,
          quantity: updatedProduct.quantity,
          supplierName: updatedProduct.supplierName,
        },
      };
      const result = await bicycleCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // add product api
    app.post("/product", async (req, res) => {
      const newProduct = req.body;
      const result = await bicycleCollection.insertOne(newProduct);
      res.send(result);
    });
    
    // Delete product from db
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bicycleCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("bicycle warehouse server is running");
});

app.listen(port, () => {
  console.log("Listen to port", port);
});
