var mongoose = require("mongoose");

var schema = new mongoose.Schema({  
content : String   , img: String , date: { type: Date, default: Date.now } , responded: {type: Boolean , default: false} , author : {type : mongoose.Schema.Types.ObjectId , ref : "user"} , solution: String 
 }); 

module.exports = mongoose.model('post', schema);