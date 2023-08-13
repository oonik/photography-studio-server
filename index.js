const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bwrtzwz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = (req, res, next)=>{
  console.log('inside verify token',req.headers.authorization);
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send('unauthorized access')
  };
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
    if(err){
      return res.status(403).send({message: 'forbidden access'})
    };
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    const bookingCollection = client.db('photographyStudio').collection('bookings');
    const userCollection = client.db('photographyStudio').collection('users');

    app.get('/bookings', verifyToken, async(req, res)=>{
      const  email = req.query.email;
      const query = {email: email};
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings)
    });

    app.delete('/booking/:id', verifyToken, async(req, res)=>{
       const id = req.params.id;
       const filter = {_id: new ObjectId(id)};
       const result = await bookingCollection.deleteOne(filter);
       res.send(result);
    });

    app.post('/booking', async(req, res)=>{
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
    });

    app.get('/user/admin/:email', async(req, res)=>{
      const email = req.params.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      res.send({isAdmin: user?.role === 'admin'})
    });

    // app.put('/user/make/admin/:id', verifyToken, async(req, res)=>{
    //   const id = req.params.id;
    //   const filter = {_id: new ObjectId(id)};
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       role: 'admin'
    //     }
    //   };
    //   const result = await userCollection.updateOne(filter, updateDoc, options);
    //   res.send(result);
    // })

    app.get('/users', verifyToken, async(req, res)=>{
      const query = {};
      const users = await userCollection.find(query).toArray();
      res.send(users);
    });

    app.post('/users', async(req, res)=>{
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get('/jwt', async(req, res)=>{
      const email = req.query.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      if(user){
        const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN, { expiresIn: '2h' });
        return res.send({accessToken: token});
      };
      res.status(403).send({accessToken: ''});
    });
    
  } finally {
   
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('photography studio server is running');
});

app.listen(port, ()=>{
    console.log(`photography server is running on port ${port}`);
});