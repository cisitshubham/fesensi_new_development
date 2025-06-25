import { Attachment,IAttachment } from "../common/models/attachment.model";

export const CreateAttachments = async (data: any)=>{
	let result= await Attachment.insertMany(data);
	return result;
}

export const deleteAttachment = async (id: string, session: any) => {
	const result = await Attachment.findByIdAndDelete(id, { session });
	return result;
};
