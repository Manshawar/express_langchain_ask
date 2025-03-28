import { Router } from "express";
import { AI } from "../../controllers/ai"
const aiRouter = Router();

aiRouter.post("/ask", AI.ask)

export { aiRouter }