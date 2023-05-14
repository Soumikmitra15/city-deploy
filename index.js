const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const path = require('path');

require('dotenv').config();



const server = express();
server.use(
  session({
    key: "userId",
    secret: "foo",
    resave: false,
    saveUninitialised: true,
    cookie: {
        expires: 60 * 60 * 24
    },
  })
);

server.use(express.static(path.join(__dirname, './FrontEnd/build')))
server.get("*", function(req,res){
  res.sendFile(path.join(__dirname, "./FrontEnd/build/index.html"));
})

server.use(cookieParser());
server.use(bodyParser.json());
server.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST"],
  credentials: true
}))
server.set('view engine', 'ejs');

const citySchema = {
  email: String,
  actType: String,
  price: Number
};

const newSchema = {
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
};

const quizSchema = new mongoose.Schema({
  score: Number,
  answers: [
    {
      text: String,
      score: Number,
    },
  ],
});

const saltRounds = 10; // Define the saltRounds value for bcrypt

const city = mongoose.model("test", citySchema);
const login = mongoose.model("userDetails", newSchema);
const Quiz = mongoose.model('Quiz', quizSchema);

// Connect to the database
const DB = process.env.DB_SECRET;
mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log(`Connection to the database successful`);
}).catch((err) => {
  console.log(`Connection to the database failed:`, err);
});

server.post('/login', async (req, res) => {
  const { emailLog, passwordLog } = req.body;
  try {
    const user = await login.findOne({ email: emailLog });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
    } else {
      const isMatch = await bcrypt.compare(passwordLog, user.password);

      if (isMatch) {
        const token = jwt.sign({ emailLog }, JWT_SECRET);
        return res.json({status:'exist', log:emailLog}); // Include 'token' in the response JSON
      }
    }

    res.status(401).json({ message: "Invalid email or password" }); // Send the default response for invalid credentials
  } catch (e) {
    console.log("Login error:", e);
    res.status(500).json({ message: "An error occurred during login" }); // Send the default response for error
  }
});


server.get('/logout', (req, res) => {
  // Destroy the session and clear session data
  req.session.destroy();
  console.log('Logout successful');
  res.clearCookie('connect.sid'); // Clear the session cookie
  res.redirect('http://localhost:3000/');
});

function checkAuth(req, res, next) {
  if (req.session && req.session.loggedIn) {
    // User is authenticated, proceed to the next middleware/route handler
    next();
    
    
  } else {
    // User is not authenticated, redirect to login page or send an error response
    res.status(401).json({ message: "Unauthorized access" });
  }
}

// Protected route
server.get('/protected', checkAuth, function(req, res) {
  if (req.session.page_views) {
    req.session.page_views++;
    res.send("You visited this page " + req.session.page_views + " times. Email: " + req.session.email);
  } else {
    req.session.page_views = 1;
    res.send("Welcome to this page for the first time!");
  }
});


server.post('/api/quiz', async (req, res) => {
  try {
    const { score, answers } = req.body;
    const quiz = new Quiz({ score, answers });
    await quiz.save();
    res.status(201).json({ message: 'Quiz results saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

server.post('/signup',async(req, res)=>{
  const{email,password} = req.body;
  try{
    const check = await login.findOne({email:email})

    if(check)
    {
      res.json("exist");
    }
    else{
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const data = {
        email: email,
        password: hashedPassword
      };

      await login.insertMany([data]);
      res.json("notexist");
    }
  }
  catch(e)
  {
    res.json("notexist")
  }
})

server.post('/login/oauth',async(req, res)=>{
  const { email, password} = req.body;

  try {
    const user = await login.findOne({ email: email });

    if (!user) {
      res.json("notexist");
    } else {
      res.json("exist");
    }
  } catch(e) {
    res.json("notexist");
  }
})



server.post('/signup/oauth',async(req, res)=>{
  const{email,password} = req.body;
  try{
    const check = await login.findOne({email:email})

    if(check)
    {
      res.json("exist");
    }
    else{
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const data = {
        email: email,
        password: hashedPassword
      };

      await login.insertMany([data]);
      res.json("notexist");
    }
  }
  catch(e)
  {
    res.json("notexist")
  }
})

server.post('/dele',(req, res)=>{
    let cityDel = req.body;
    city.deleteMany({ _id: { $in: cityDel } })
    .then((result) => {
        console.log(`Documents with ObjectID equal to ${cityDel} deleted`);
        res.status(200).send(`Documents with ObjectID equal to ${cityDel} deleted`);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Error deleting documents");
      });

    console.log(cityDel)
    
})

  

server.post('/demo',(req, res)=>{
    let cityPrice = new city({
    email:req.body.email,
    actType: req.body.actType,
    price: req.body.price
    })
    cityPrice.save();
})



server.get('/demo',async (req,res)=>{
    const docs = await city.find({});
    res.json(docs)
})


server.listen(8080,()=>{
    console.log('server started')
})

/*const getPrice = async()=>{
    const response = await fetch('http://localhost:8080/demo',{
        method:'GET',
      })
      const data = await response.json();
      setPrices(data);
      updateRows(data);
  }
  
  React.useEffect(()=>{
    getPrice();
  },[])*/