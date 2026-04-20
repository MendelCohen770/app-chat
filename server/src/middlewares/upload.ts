import multer from "multer";
import path from "path";
import fs from "fs";

const defaultUploadsDir = path.join(__dirname, "..", "uploads");
try {
    fs.mkdirSync(defaultUploadsDir, { recursive: true });
} catch (err) {
    console.error("Failed to ensure uploads directory:", err);
}

// Default image upload (used by legacy code paths / general purpose).
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, defaultUploadsDir);
    },
    filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${safe}`);
    },
});

const imageFileFilter = (_req: any, file: any, cb: any) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Dedicated storage for profile icons so they live in a separate folder and
// are easy to serve / clean up.
const profileIconsDir = path.join(__dirname, "..", "uploads", "profile");
try {
    fs.mkdirSync(profileIconsDir, { recursive: true });
} catch (err) {
    console.error("Failed to ensure profile uploads directory:", err);
}

const profileIconStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, profileIconsDir),
    filename: (req, file, cb) => {
        const userId = req.user?.id || "anonymous";
        const rawExt = path.extname(file.originalname || "").toLowerCase();
        const allowedExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
        let ext = allowedExt.includes(rawExt) ? rawExt : "";
        if (!ext) {
            switch (file.mimetype) {
                case "image/jpeg":
                    ext = ".jpg";
                    break;
                case "image/png":
                    ext = ".png";
                    break;
                case "image/gif":
                    ext = ".gif";
                    break;
                case "image/webp":
                    ext = ".webp";
                    break;
                default:
                    ext = ".img";
            }
        }
        cb(null, `user-${userId}-${Date.now()}${ext}`);
    },
});

export const profileIconUpload = multer({
    storage: profileIconStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 3 * 1024 * 1024 },
}).single("profileIcon");

// Dedicated storage for chat media (images / videos / files) attached to
// messages. Each file goes under uploads/media so it can be served via the
// /uploads static mount just like voice notes.
const chatMediaDir = path.join(__dirname, "..", "uploads", "media");
try {
    fs.mkdirSync(chatMediaDir, { recursive: true });
} catch (err) {
    console.error("Failed to ensure chat media directory:", err);
}

const chatMediaStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, chatMediaDir),
    filename: (_req, file, cb) => {
        const rawExt = path.extname(file.originalname || "").toLowerCase();
        const safeExt = rawExt.replace(/[^a-z0-9.]/g, "").slice(0, 10) || ".bin";
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `media-${unique}${safeExt}`);
    },
});

// Allow images, videos and generic documents. Audio has its own dedicated
// endpoint (voiceUpload), but we still accept it here for completeness.
const chatMediaFileFilter = (_req: any, file: any, cb: any) => {
    const mime = (file.mimetype || "").toLowerCase();
    const allowedPrefix = ["image/", "video/", "audio/"];
    const allowedExact = new Set([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip",
        "application/x-zip-compressed",
        "application/json",
        "text/plain",
        "text/csv",
    ]);
    if (allowedPrefix.some((p) => mime.startsWith(p)) || allowedExact.has(mime)) {
        cb(null, true);
        return;
    }
    cb(new Error("Unsupported file type"), false);
};

export const chatMediaUpload = multer({
    storage: chatMediaStorage,
    fileFilter: chatMediaFileFilter,
    limits: { fileSize: 25 * 1024 * 1024 },
}).single("media");

export default upload;
