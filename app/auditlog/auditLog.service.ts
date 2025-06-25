import { AuditLog ,IAuditLog } from "../common/models/audit-log.model";
import { formatTime } from "../common/helper/formatTIme";
export const CreateAuditLog = async (Data: any, session?: any) => {
	const result = await AuditLog.create([Data], { session }); 
	return result[0]; 
};

export const getAuditLogByTicketId = async (ticketId: string) => {
	const result = await AuditLog.find({ ticketId }).sort({ createdAt: -1 });
	return result;
};

export const getAuditLogByUserId = async (userId: string) => {
	const result = await AuditLog.find({ userId }).sort({ createdAt: -1 });
	return result.map((item: any) => {
		return {
			_id: item._id,
			createdAt: formatTime(item.createdAt),
			action: item.action,
		}
	});
};
