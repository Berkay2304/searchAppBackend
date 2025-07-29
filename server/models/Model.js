const mongoose = require("mongoose");

const domainSchema = new mongoose.Schema({
    domain: { type: String, required: true, unique: true },
    subdomains: [String]
});

module.exports = mongoose.model("Domain",domainSchema);