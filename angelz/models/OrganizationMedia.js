const mongoose = require('mongoose');

const organizationMediaSchema = mongoose.Schema({
    organization_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    type: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    url:{
        type: String,
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model('OgranizationMedia', organizationMediaSchema);