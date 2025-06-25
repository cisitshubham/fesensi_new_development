import { createTransport } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const transporter=createTransport({
	host: process.env.SMTP_HOST ||'smtp.gmail.com',
	port: Number(process.env.SMTP_PORT||587),
	secure:false,
	auth:{
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,

	}
});

export const sendMail=async( to:string,subject:string,html:any)=>{
	try {
		const info= await transporter.sendMail({
			from: process.env.EMAIL_FROM,
			to,
			subject,
			html,
		})
	} catch (error) {

		console.error(error);
	}
}