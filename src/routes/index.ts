import { Router } from "express";

import {aiRouter} from "./modules/ai"
export const index = Router();

index.use("/ai",aiRouter)