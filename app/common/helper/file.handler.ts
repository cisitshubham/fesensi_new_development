import multer from "multer";
import path from "path";
import fs from "fs";


const emptyMulter = multer().none();

const getUploadPath = (req: any): string => {
	const baseDir = "./public/images";
	const subDir = req.body.folder || "miscellaneous"; 
	const uploadPath = path.join(baseDir, subDir);
	if (!fs.existsSync(uploadPath)) {
		fs.mkdirSync(uploadPath, { recursive: true });
	}

	return uploadPath;
};


// Configure multer storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, getUploadPath(req));
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}${path.extname(file.originalname)}`);
	},
});

// File filter to allow only images
const allowedTypes = [
	"image/png", "image/jpeg", "image/jpg", "image/gif", // Images
	"application/pdf",
	"application/vnd.ms-excel", 
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // XLSX
];

const fileFilter = (req: any, file: any, cb: any) => {
	 cb(null, true);
	// if (allowedTypes.includes(file.mimetype)) {
	// } else {
	// 	cb(new Error("Only images, PDFs, and Excel files (XLS/XLSX) are allowed"), false);
	// }
};

// Multer instance
const upload = multer({
	storage,
	limits: { fileSize: 2 * 1024 * 1024 }, 
	fileFilter,
});

export default upload;
