const express = require('express')
const router = express.Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const usernameV = {
  allowed: 'Lower or upper case letters; numbers; underscore; hyphen, dot.', 
  min: 4, max: 16, regEx: /^[a-z,A-Z, 0-9,_,-,\.]{4,16}$/, 
  errorMessage: function() { return `Invalid username format: 
    ${this.allowed}; min: ${this.min}; max: ${this.max}`}};
const passwordV = {
  allowed: 'Lower or upper case letters; numbers; symbols',
  min: 8, max: 255, regEx: /^.{8,254}$/, 
  errorMessage: function() {return `Invalid password format: 
    ${this.allowed}; min: ${this.min}; max: ${this.max}`}
}

//VARIABLE TO STORE PASSWORD HASH
let hp

// CREATE PASSWORD HASH
async function hashPassword(pass) {
  hp = await bcrypt.hash(pass, 10)
}

//COMPARES THE PASSWORD ENTERED VS HASH STORED
async function comparePassword(pass, hash) {
  const result = await bcrypt.compare(pass, hash)
  return result
}

// GET ALL USERS
router.get('/', async (req, res)=>{
  try {
    const users = await User.find()
    res.json(users)
  } catch (error) {
    res.status(500).json({message: error.message})
  }
})

// GET SINGLE USER
router.get('/:id', getUser, async (req, res)=>{
  res.json(res.user)
})

// VALIDATE PASSWORD
router.post('/validatepwd/:id', getUser, async (req, res)=>{
  const result = await comparePassword(req.body.password, res.user.password)
  res.status(201).json({ validated: result })
})


// CREATE USER
router.post('/', async (req, res)=>{  
  //VALIDATE PASSWORD
  if(!passwordV.regEx.test(req.body.password)){
    return res.status(200).json({message: passwordV.errorMessage()}); 
  }

  //VALIDATE USERNAME
  if(!usernameV.regEx.test(req.body.username)){
    return res.status(200).json({message: usernameV.errorMessage()}); 
  } 

  await hashPassword(req.body.password)
  //console.log(hp)
  const user = new User({
    username: req.body.username,
    password: hp
  })
 
  try {
    const newUser = await user.save()
    res.status(201).json(newUser)
  } catch (error) {
    res.status(400).json({message: error.message})
  }

  return res.status(200).json({message: 'valid'})
})

//CHANGE PASSWORD
router.post('/changepwd/:id', getUser, async (req, res) => {
  //CHECK IF NEW PWD MATCHES ITS DUPLICATE
  const duplicate = req.body.newPwd === req.body.newPwdDuplicate
  if(!duplicate) {
    return res.status(201).json({ message: `The new password and it's duplicate don't match.` })
  }
  
  const result = await comparePassword(req.body.currentPwd, res.user.password)
  if(result) {
    await hashPassword(req.body.newPwd)
    try {
      res.user.password = hp
      const updatedUser = await res.user.save()
      return res.json(updatedUser)
    } catch (error) {
      return res.status(200).json({ message: 'Password successfuly changed' })
    }
  } else {
    return res.status(201).json({ message: 'Current password is incorrect' })
  }
})

// MIDDLEWARE TO GET A SINGLE USER
async function getUser(req, res, next) {  

  //VALIDATE USER ID  
  if(!isValidObjectId(req.params.id)) {    
    return res.status(200).json({message: 'Invalid params'}); 
  }

  let user

  try {
    
    user = await User.findById(req.params.id)
    if(user == null){
      return res.status(404).json({ message: 'Cannot find user'})
    }
  } catch (error) {
    res.status(500).json({message: error.message})
  }

  res.user = user
  next()
}

//VALIDATIONS
function isValidObjectId(id) {  
  return id.length === 24
}

module.exports = router