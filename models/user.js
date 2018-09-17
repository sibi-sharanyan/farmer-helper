var mongoose = require("mongoose"),
passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    userName : String,
    password : String,
    date: { type: Date, default: Date.now } 
    
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("user" , UserSchema);