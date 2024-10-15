import {User} from "../models/user.model.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req,res) =>{
    try{
        const {username, email, password} = req.body;
        if(!username || !email || !password){
            return res.status(401).json({
                message:"Something is missing, please check.",
                success: false,
            });
        };
        const user = await User.findOne({email});
        if(user){
            return res.status(401).json({
                message:"Try another email",
                success:false,
            });
        };
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            email,
            password: hashedPassword
        });
        return res.status(201).json({
            message:"Account create successfully",
            success: true,
        });
    }catch(error){
        console.log(error);
    }
}

export const login = async (req, res) => {
    try{
        const{email,password} = req.body;
        if(!email || !password){
            return res.status(401).json({
                message:"Something is missing, please check.",
                success: false,
            });
        };
        let user = await User.findOne({email});
        if(!user){
            return res.status(401).json({
                message:"Email is not registered",
                success: false,
            });
        };
        const isPasswordMatch = await bcrypt.compare(password, user.password)
        if(!isPasswordMatch){
            return res.status(401).json({
                message:"Incorrect Password",
                success: false,
            });
        };

        user ={
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture:user.profilePicture,
            bio:user.bio,
            followers:user.followers,
            following:user.following,
            posts:user.posts
        }

        const token = await jwt.sign({userId:user._id}, process.env.SECRET_KEY, {expiresIn:'1d'});
        return res.cookie('token', token, {httpOnly:true,sameSite:'strict', maxAge:1*24*60*60*1000}).json({
            message:`Welcome back ${user.username}`,
            success:true,
            user
        })
    }catch(error){
        console.log(error);
    }
};

export const logout = async (_, res) =>{
    try{
        return res.cookie('token', "", {maxAge:0}).json({
            message:"Logged out successfully",
            success:true
        });
    }catch(error){
        console.log(error);
    }
}

export const getProfile = async (req,res)=>{
    try{
        const userId = req.params.id;
        let user = await User.findById(userId).select('-password');
        return res.status(200).json({
            user,
            success:true
        });
    }catch(error){
        console.log(error);
    }
};

export const editProfile = async (req,res) => {
    try{
        const userId = req.id;
        const {bio, gender} = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if(profilePicture){
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select('-password')
        if(!user){
            return res.status(401).json({
                message:"User not found",
                success: false,
            });
        };
        if(bio) user.bio = bio;
        if(gender) user.gender = gender;
        if(profilePicture) user.profilePicture = cloudResponse.secure_url;
        
        await user.save();

        return res.status(200).json({
            message:"Profile Updates",
            success: true,
            user
        });
    }catch(error){
        console.log(error);
    }
}

export const getSuggestedUsers = async (req,res) =>{
    try{
        const suggestedUsers = await User.find({_id: {$ne: req.id}}).select("-password");
        if(!suggestedUsers){
            return res.status(401).json({
                message: 'Currently do not have any users',
            });
        }
        return res.status(200).json({
            success: true,
            users: suggestedUsers
        });
    }catch(error){
        console.log(error);
    }
};


export const followOrUnfollow = async (req, res) =>{
    try{
        const personWhoFollows= req.id;
        const personToBeFollowed = req.params.id;

        if(personWhoFollows === personToBeFollowed){
            return res.status(401).json({
                message: "You can not follow or unfollow yourself",
                success: false
            });
        }

        const user = await User.findById(personWhoFollows);
        const targetUser = await User.findById(personWhoFollows);

        if(!user || !targetUser){
            return res.status(401).json({
                message: 'User not found',
                success: false
            })
        }
        //check if the request if for follow or unfollow
        const isFollowing = user.following.includes(personToBeFollowed);
        if(isFollowing){
            //if true user already follows the taregtUser - unfollow logic here
            await Promise.all([
                User.updateOne({_id: personWhoFollows}, {$pull: {following:personToBeFollowed}}),
                User.updateOne({_id: personToBeFollowed}, {$pull: {followers:personWhoFollows}}),
            ])
            return res.status(200).json({
                message: 'Unfollowed successfully',
                success: true
            })
        }else{
            //if false - follow logic comes here
            await Promise.all([
                User.updateOne({_id: personWhoFollows}, {$push: {following:personToBeFollowed}}),
                User.updateOne({_id: personToBeFollowed}, {$push: {followers:personWhoFollows}}),
            ])
            return res.status(200).json({
                message: 'Followed successfully',
                success: true
            })
        }
    }catch(error){
        console.log(error);
    }
}