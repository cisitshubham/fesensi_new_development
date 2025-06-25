import {Feedback } from '../../common/models/feedback.options.model'

export const CreateFeedbackOptions = async (data:any)=>{
	const result = Feedback.create(data);
	return result;
}

export const GetFeedbackOptions = async ()=>{
	const result= Feedback.find({status:"active"}).select('title');
	return result;
}

export const updateFeedbackOptions= async (id:string,data:any)=>{
	const result =Feedback.findByIdAndUpdate({_id:id ,status:"active" },{title:data});
	return result;
}

export const deleteFeedbackOptions = async (id:string)=>{
	const result = Feedback.findByIdAndDelete({_id:id});
	return result;
}