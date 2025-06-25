import { Announcements } from "../../common/models/announcements.model";
import { formatTime } from '../../common/helper/formatTIme';

export const createAnnouncement = async (announcementData: any) => {
	const announcement = await Announcements.create(announcementData);
	return announcement;
};

export const getAnnouncements = async () => {
	const announcements = await Announcements.find();
	return announcements;
};

export const updateAnnouncement = async (announcementId: string, announcementData: any) => {
	const announcement = await Announcements.findByIdAndUpdate(announcementId, announcementData, { new: true });
	return announcement;
};

export const deleteAnnouncement = async (announcementId: string) => {
	const announcement = await Announcements.findByIdAndDelete(announcementId);
	return announcement;
};

export const getAnnouncementById = async (announcementId: string) => {
	const announcement = await Announcements.findById(announcementId);
	return announcement;
};

export const getAnnouncementByStatus = async (status: boolean) => {
	const announcement = await Announcements.find({ status }).select("title content status createdAt").sort({ createdAt: -1 });
	const announcementList = announcement.map((item: any) => {
		return {
			_id: item._id,
			title: item.title,
			content: item.content,
			createdAt: formatTime(item.createdAt),
		}
	})
	return announcementList;
};









