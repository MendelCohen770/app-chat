import express from "express";
import { serveUpload } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/middel";

const uploadsRoute = express.Router();

uploadsRoute.get("/:category/:filename", authMiddleware, serveUpload);

export default uploadsRoute;
