require('dotenv').config()
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;

db.on('error', (error)=> console.log(error));
db.once('open',()=>console.log('Connected to Database.'));

app.use(express.json());
app.use(cors());

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

app.listen(process.env.PORT || 3001, ()=> console.log('Users server started...'));