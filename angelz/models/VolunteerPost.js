const mongoose = require('mongoose');

const volunteerPostSchema = mongoose.Schema({
    title: String,
    description: String,
    image: String,
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
},{ timestamps: true });

module.exports = mongoose.model('VolunteerPost',volunteerPostSchema);