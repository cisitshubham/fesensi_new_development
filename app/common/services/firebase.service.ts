import admin  from '../firebase/firebase.config';

export const sendNotification = async (
	tokens: string[],
	title: string,
	body: string
) => {
	const message = {
		notification: {
			title,
			body,
		},
		tokens, 
	};

	try {
		const responses = await Promise.all(
			tokens.map(async (token) => {
				const singleMessage = {
					notification: {
						title,
						body,
					},
					token, 
				};
				return await admin.messaging().send(singleMessage);
			})
		);
		return responses;
		
	} catch (error) {
		console.error('Error sending notification:', error);
		return error;
	}
};

// Send Announcement Notification
export const sendAnnouncementNotification = async (data:any)=>{
	const {title, content,tokens} = data;	
	await sendNotification(tokens, title, content);
}

