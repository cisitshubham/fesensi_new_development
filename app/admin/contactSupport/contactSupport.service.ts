import { ContactSupport } from '../../common/models/contactSupport.model';
import { formatTime } from '../../common/helper/formatTIme'

export const createContactSupport = async (data: any) => {
	const contactSupport = await ContactSupport.create(data);
	return contactSupport;
};

export const getContactSupport = async () => {
	const contactSupport = await ContactSupport.find().populate('created_by', 'first_name').populate('query_type','title').sort({ createdAt: -1 });
	return contactSupport.map((item: any) => ({
		_id: item._id,
		message: item.message,
		query_type: (item.query_type as any)?.title || null,
		calling_time: item.calling_time,
		created_by: item.created_by.first_name,
		contact_mode: item.contact_mode,
		createdAt: formatTime(item.createdAt),
		is_resolved: item.is_resolved,
	}));
};

export const getContactSupportById = async (id: string) => {
	const contactSupport = await ContactSupport.findById(id).populate('created_by','first_name')
	.populate({ path: 'query_type', select: 'title' });
	if (!contactSupport) {
		throw new Error('Contact support not found');
	}
	const data = {
		_id: contactSupport._id,	
		message: contactSupport.message,
		contact_mode: contactSupport.contact_mode,
		calling_time: contactSupport.calling_time,
		created_by: (contactSupport.created_by as any).first_name,	
		createdAt: formatTime(contactSupport.createdAt),
		is_resolved: contactSupport.is_resolved,
		query_type: (contactSupport.query_type as any)?.title || null,
	};
	return data;
};

export const updateContactSupport = async (id: string) => {
	const contactSupport = await ContactSupport.findByIdAndUpdate({_id: id}, { is_resolved: true }, { new: true });
	return contactSupport;
};

export const deleteContactSupport = async (id: string) => {
	const contactSupport = await ContactSupport.findByIdAndDelete(id);
	return contactSupport;
};

export const getContactSupportByUserId = async (userId: string) => {
	const contactSupport = await ContactSupport.find({ created_by: userId , is_resolved: false })
	.populate({ path: 'query_type', select: 'title' })
	.populate({ path: 'created_by', select: 'first_name' })
	.sort({ createdAt: -1 });
	if (!contactSupport) {
		throw new Error('Contact support not found');
	}
	return contactSupport.map((item: any) => ({
		_id: item._id,
		is_resolved: item.is_resolved,
		contact_mode: item.contact_mode,
		message: item.message,
		calling_time: item.calling_time,
		query_type: (item.query_type as any)?.title || null,
		created_by: (item.created_by as any)?.first_name,
		createdAt: formatTime(item.createdAt),
	}));
};












