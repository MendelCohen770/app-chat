import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import Message from "../models/message.schema";
import User from "../models/user.schema";
import { asyncHandler, AppError } from "../middlewares/errorHandler";

const uploadsRoot = path.resolve(process.cwd(), "uploads");
const messageMediaCategories = new Set(["images", "audio", "video", "media"]);

const sanitizePathSegment = (value: string, fieldName: string) => {
    if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
        throw new AppError(400, "Invalid file path", `${fieldName} contains unsupported characters`);
    }
    return value;
};

const ensureSafeAbsolutePath = (category: string, filename: string) => {
    const absoluteRoot = path.resolve(uploadsRoot);
    const absolutePath = path.resolve(absoluteRoot, category, filename);
    const normalizedRootPrefix = `${absoluteRoot}${path.sep}`;
    if (!absolutePath.startsWith(normalizedRootPrefix)) {
        throw new AppError(400, "Invalid file path", "Path traversal detected");
    }
    return absolutePath;
};

const ensureOwnership = async (authUserId: string, mediaUrl: string, category: string) => {
    if (category === "profile") {
        const owner = await User.findOne({ _id: authUserId, profileIcon: mediaUrl }).select("_id");
        if (!owner) {
            throw new AppError(404, "File not found");
        }
        return;
    }

    if (messageMediaCategories.has(category)) {
        const message = await Message.findOne({
            media: mediaUrl,
            $or: [{ sender: authUserId }, { receiver: authUserId }],
        }).select("_id");
        if (!message) {
            throw new AppError(404, "File not found");
        }
        return;
    }

    throw new AppError(404, "File not found");
};

export const serveUpload = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, "Authentication failed", "No authenticated user");
    }

    const category = sanitizePathSegment(String(req.params.category || ""), "category");
    const filename = sanitizePathSegment(String(req.params.filename || ""), "filename");
    const mediaUrl = `/uploads/${category}/${filename}`;

    await ensureOwnership(String(authUserId), mediaUrl, category);
    const absolutePath = ensureSafeAbsolutePath(category, filename);

    try {
        await fs.promises.access(absolutePath, fs.constants.R_OK);
    } catch {
        throw new AppError(404, "File not found");
    }

    if (category === "audio" || category === "video") {
        const escapedName = filename.replace(/"/g, "");
        res.setHeader("Content-Disposition", `inline; filename="${escapedName}"`);
    }

    res.sendFile(absolutePath);
});
