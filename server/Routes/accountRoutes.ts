import express from "express";
import { protect } from "../middleware/authMiddlewares.js";
import { addAccounts, disconnectAccounts, getAccounts } from "../controllers/accountControllers.js";


const accountRouter=express.Router()

accountRouter.get('/',protect,getAccounts)
accountRouter.get('/',protect,addAccounts)
accountRouter.get('/:id',protect,disconnectAccounts)

export default accountRouter