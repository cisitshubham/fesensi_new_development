import { ResolvedPosts} from '../../common/models/resolvedPost.model'

export const CreateResolvedPost = async (data:any)=>{
	const result = ResolvedPosts.create(data);
	return result;
}

export const GetResolvedPost= async ()=>{
	const result= ResolvedPosts.find().select('title');
	return result;
}

export const updateResolvedPost= async (id:string,data:any)=>{
	const result =ResolvedPosts.findByIdAndUpdate({_id:id},{title:data});
	return result;
}

export const deleteResolvedPost= async (id:string)=>{
	const result = ResolvedPosts.findByIdAndDelete({_id:id});
	return result;
}