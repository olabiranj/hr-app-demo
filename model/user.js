let mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");

let Schema = mongoose.Schema;

let userSchema = new Schema({
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", userSchema);