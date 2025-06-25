import {Feedback} from '../common/models/feedback.model'
import { formatTime } from '../common/helper/formatTIme'

export const AddFeedback= async (data:any)=>{
	const  response= await Feedback.create(data);
	return response; 
}

export const getfeedback = async ()=>{
	const response= await Feedback.find()
	.populate({path:'ticket',select:'ticket_number title'})
	.populate({path:'User',select:'first_name '})
	return response;
}

export const getFeedbackByTicketId= async (ticketId:string)=>{
	const response = await Feedback.findById(ticketId)
	.populate({ path: 'ticket', select: 'ticket_number title' })
	.populate({ path: 'User', select: 'first_name ' })
	return response;
}



export const skipFeedback= async (userId:string)=>{
	// only status is RESOLVED  
	const response = await Feedback.findOneAndUpdate(
		{ User: userId, status: 'RESOLVED' },
		{ $set: { skip: true } },
		{ new: true }
	);
	if(!response){
		return false;
	}
	return true;
}

export const deleteFeedback= async (ticketId:string)=>{
	const response = await Feedback.findByIdAndDelete(ticketId);
	return response;
}