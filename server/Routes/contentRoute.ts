import express from "express";
import { generateContent } from "../controllers/contentController.js";


const contentRouter = express.Router();

contentRouter.post("/generate-content",generateContent);

export default contentRouter;