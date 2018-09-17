var mongoose = require("mongoose");

var schema = new mongoose.Schema({  
content : String   , img: String , date: { type: Date, default: Date.now }
 }); 

module.exports = mongoose.model('post', schema);