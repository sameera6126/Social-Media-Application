import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    username:{type: String, required: truw, unique:true},
    email:{type: String, required: true, unique:true},
    password:{type: String, required: true},
    profilePicture: {type:String, default: ' '},
    bio:{type: String, default:''},
    gender:{type:String, enum:['Male', 'Female', 'Non-Binary', 'Other']},
    followers:[
        {type:mongoose.Schema.Types.ObjectId, ref:'User'}
    ],
    following:[
        {type:mongoose.Schema.Types.ObjectId, ref:'User'}
    ],
    posts: [
        {type:mongoose.Schema.Types.ObjectId, ref:'Post'}
    ],
    bookmarks: [
        {type:mongoose.Schema.Types.ObjectId, ref:'Post'}
    ]
}, {timestamps:true});

export default User = mongoose.model('User', userSchema);