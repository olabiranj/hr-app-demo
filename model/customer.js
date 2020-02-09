let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let customerSchema = new Schema({
    fullName: { type: String },
    email: { type: String},
    address: { type: String },
    gender: { type: String },
    stateOfO: { type: String },
    passport: { type: String },
    dob: { type: Date },
    phoneNum: { type: Number},
    accNum: { type: Number, unique: true },
    bvn: { type: Number, unique: true },
    createdDate: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model("Customer", customerSchema);