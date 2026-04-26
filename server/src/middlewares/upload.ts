import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";

type UploadRule = {
    folder: "images" | "audio" | "video";
    maxBytes: number;
    extension: string;
};

const UPLOAD_RULES: Record<string, UploadRule> = {
    "image/jpeg": { folder: "images", maxBytes: 5 * 1024 * 1024, extension: ".jpg" },
    "image/png": { folder: "images", maxBytes: 5 * 1024 * 1024, extension: ".png" },
    "image/webp": { folder: "images", maxBytes: 5 * 1024 * 1024, extension: ".webp" },
    "audio/webm": { folder: "audio", maxBytes: 10 * 1024 * 1024, extension: ".webm" },
    "audio/mpeg": { folder: "audio", maxBytes: 10 * 1024 * 1024, extension: ".mp3" },
    "video/mp4": { folder: "video", maxBytes: 50 * 1024 * 1024, extension: ".mp4" },
};

const defaultUploadsDir = path.join(__dirname, "..", "uploads");
try {
    fs.mkdirSync(defaultUploadsDir, { recursive: true });
} catch (err) {
    logger.error({ err, dir: defaultUploadsDir }, "Failed to ensure uploads directory");
}

// Default image upload (used by legacy code paths / general purpose).
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const imagesDir = path.join(defaultUploadsDir, "images");
        try {
            fs.mkdirSync(imagesDir, { recursive: true });
        } catch (err) {
            logger.error({ err, dir: imagesDir }, "Failed to ensure image uploads directory");
        }
        cb(null, imagesDir);
    },
    filename: (_req, file, cb) => {
        const fallbackExt = path.extname(file.originalname || "").toLowerCase() || ".bin";
        cb(null, `${randomUUID()}${fallbackExt}`);
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
    logger.error({ err, dir: profileIconsDir }, "Failed to ensure profile uploads directory");
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

const resolveUploadRule = (mime: string | undefined) => {
    const normalized = (mime || "").toLowerCase();
    return UPLOAD_RULES[normalized];
};

const secureMediaStorage = multer.diskStorage({
    destination: (_req, file, cb) => {
        const rule = resolveUploadRule(file.mimetype);
        if (!rule) {
            cb(new Error("Unsupported file type"), defaultUploadsDir);
            return;
        }
        const targetDir = path.join(defaultUploadsDir, rule.folder);
        try {
            fs.mkdirSync(targetDir, { recursive: true });
        } catch (err) {
            logger.error({ err, dir: targetDir }, "Failed to ensure typed uploads directory");
            cb(err as Error, targetDir);
            return;
        }
        cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
        const rule = resolveUploadRule(file.mimetype);
        const fallbackExt = path.extname(file.originalname || "").toLowerCase() || ".bin";
        const ext = rule?.extension || fallbackExt;
        cb(null, `${randomUUID()}${ext}`);
    },
});

const secureMediaFileFilter = (_req: any, file: any, cb: any) => {
    if (resolveUploadRule(file.mimetype)) {
        cb(null, true);
        return;
    }
    cb(new Error("Unsupported file type"), false);
};

export const chatMediaUpload = multer({
    storage: secureMediaStorage,
    fileFilter: secureMediaFileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
}).single("media");

const voiceOnlyFileFilter = (_req: any, file: any, cb: any) => {
    const mime = (file.mimetype || "").toLowerCase();
    if (mime === "audio/webm" || mime === "audio/mpeg") {
        cb(null, true);
        return;
    }
    cb(new Error("Only audio/webm and audio/mpeg are allowed"), false);
};

export const voiceUpload = multer({
    storage: secureMediaStorage,
    fileFilter: voiceOnlyFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).single("audio");

export const enforceUploadPolicy = (file: Express.Multer.File | undefined) => {
    if (!file) return;
    const rule = resolveUploadRule(file.mimetype);
    if (!rule) {
        throw new Error("Unsupported file type");
    }
    if (file.size > rule.maxBytes) {
        const maxMb = Math.floor(rule.maxBytes / (1024 * 1024));
        throw new Error(`File too large for ${file.mimetype}. Max size is ${maxMb}MB`);
    }
};

export default upload;
