const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  type: {
    type: Number,
    required: true
  }
}, { versionKey: false })

module.exports = mongoose.model('User', userSchema)