import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './uploads'); // Ensure this directory exists
    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + '-' + file.originalname); // Unique file name
    },
});

const upload = multer({ storage });

export default upload;
