const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'Unauthorized access'})
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(403).send({message: 'Access forbidden'})
    }
    req.decoded = decoded;
    next()
  })
}

async function run() {
  try {
    await client.connect();
    const bicycleCollection = client.db("bicycle").collection("products");
    const myProductsCollection = client.db("bicycle").collection("myProducts");

    // JWT auth
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

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

    // add myProduct api
    app.post("/myProducts", async (req, res) => {
      const newProduct = req.body;
      const result = await myProductsCollection.insertOne(newProduct);
      res.send(result);
    });

    // find myProducts
    app.get("/myProducts",verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if(decodedEmail === email){
        const query = { email: email };
        const filter = myProductsCollection.find(query);
        const myProducts = await filter.toArray();
        res.send(myProducts);  
      }
      else{
        return res.status(403).send({message: 'Access forbidden'})
      }
    });

    // myProduct api
    app.get("/myProducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await myProductsCollection.findOne(query);
      res.send(product);
    });

    // Delete myProducts from db
    app.delete("/myProducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await myProductsCollection.deleteOne(query);
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
