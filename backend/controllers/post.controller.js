import sharp from "sharp"
import { Post } from "../models/post.model";

export const addNewPost = async(req,res) => {
    try{
        const{caption} = req.body;
        const image = req.file;
        const authorId = req.id;
        if(!image){
            return res.status(400).json({message:'Image required'});
        } 
        // image upload
        const optimizedImageBuffer = await sharp(image.buffer)
        .resize({width: 800, height: 800, fit:'inside'})
        .toFormat('jpeg', {quality: 80})
        .toBuffer();
        // buffer to data uri
        const fileUri = `data:image/jpeg;base64, ${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        const post = await Post.create({
            caption,
            image:cloudResponse.secure_url,
            author: authorId
        });
        const user = await User.findById(authorId);
        if(user){
            user.posts.push(post._id);
            await user.save();
        }

        await post.populate({path:'author', select:'--password'});
        return res.status(201).json({
            message:'New post added',
            post, 
            success:true
        })
    }catch (error){
        console.log(error);
    }
}

//for the feed
export const getAllPost = async (req,res)=>{
    try{
        const post = await Post.find().sort({createdAt: -1})
        .populate({path: 'author', select:'username, profilePicture'})
        .populate({
            path:'comments',
            sort:{createdAt: -1},
            populate:{
                path:'author',
                select: 'username, profilePicture'
            }
        });
        return res.status(200).json({
            posts,
            success: true
        })
    }catch(error){
        console.log(error);
    }
};

//for our profile page posts belonging to one user only
export const getUserPost = async (req,res) =>{
    try{
        const authorId = req.id;
        const posts = await Post.find({author:authorId})
        .sort({createdAt: -1})
        .populate({
            path: 'author',
            select:'username, profilePicture'
        }).populate({
            path:'comments',
            sort:{createdAt: -1},
            populate:{
                path:'author',
                select: 'username, profilePicture'
            }
        });
        return res.status(200).json({
            posts,
            success: true
        })
    }catch(error){
        console.log(error);
    }
}


export const LikePost = async (req, res) => {
    try{
        const UserLiking = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if(!post) return res.ststus(404).json({message: 'Post not found', success: false});

        //Like Logic 
        await post.updateOne({$addToSet:{likes:UserLiking}});
        await post.save();

        //Implement socket.io for real - time notifications
        return res.staus(200).json({message: 'Post Liked', success: false});
    }catch(error){
        console.log(error);
    }
};

export const dislikePost = async (req, res) => {
    try{
        const UserLikingId = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if(!post) return res.ststus(404).json({message: 'Post not found', success: false});

        //Like Logic 
        await post.updateOne({$pull:{likes:UserLikingId}});
        await post.save();

        //Implement socket.io for real - time notifications
        return res.staus(200).json({message: 'Post disliked', success: true});
    }catch(error){
        console.log(error);
    }
};

export const addComment = async (req, res) =>{
    try{
        const postId = req.params.id;
        const UserCommentingId = req.id;
        const {text} = req.body;
        const post = await Post.findById(postId);
        if(!text) return res.status(400).json({messge:'Text is required', success: false});
        const comment = await comment.create({
            text,
            author: UserCommentingId,
            post: postId
        }).populate({
            path: 'author',
            select:'username, ProfilePicture'
        });
        post.comments.push(comment._id);
        await post.save();

        return res.status(201).json({
            message:'Comment Added',
            comment,
            success: true
        })
    }catch(error){
        console.log(error);
    }
};

export const getCommentsOfPost = async (req,res) => {
    try{
        const postId = req.params.id;
        const comments = await Comment.find({post:postId})
        .populate('author', 'username', profilePicture);

        if(!comments) return res.status(404).json({message:'No comments found for this post', success: false});
        return res.status(200).json({success: true, comments});

    }catch(error){
        console.log(error);
    }
}

export const deletPost = async (req, res) =>{
    try{
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.finaById(postId);
        if(!post) return res.status(404).json({message: 'Post not found', success: false});

        //check if the logged in user is the owner of the post
        if(post.author.toString() != authorId) return res.status.json({message:'Unauthorized'});
        //deletePost
        await Post.findByIdAndDelete(postId);
    }catch(error){
        console.log(error);
    }
}