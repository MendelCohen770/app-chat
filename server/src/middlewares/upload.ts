import multer from "multer";
import path from "path";

// הגדרת תיקיית שמירה ופורמט שם הקובץ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // תיקיית שמירה
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // שם קובץ ייחודי: timestamp + שם הקובץ המקורי
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

// פילטר לבדיקה שהקובץ הוא תמונה בלבד
const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // קובץ מאושר
    } else {
        cb(new Error('Only image files are allowed'), false); // שגיאה אם זה לא תמונה
    }
};

// יצירת האובייקט Multer
const upload = multer({ 
    storage, 
    fileFilter 
});

export default upload;