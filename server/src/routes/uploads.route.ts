import express from "express";
import { serveUpload } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/middel";

const uploadsRoute = express.Router();

/**
 * @openapi
 * /uploads/{category}/{filename}:
 *   get:
 *     tags:
 *       - Uploads
 *     summary: Serve an uploaded media file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Uploaded file returned
 */
uploadsRoute.get("/:category/:filename", authMiddleware, serveUpload);

export default uploadsRoute;
