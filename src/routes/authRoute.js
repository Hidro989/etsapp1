import express from 'express';
import AuthController from "../app/controllers/AuthController.js"
// import EmbedBillingController from "../app/controllers/EmbedBillingController.js";

const authRoute = express.Router();
const authController = new AuthController();
// const embedBillingController = new EmbedBillingController();

authRoute.get('/auth', authController.begin);
authRoute.get('/auth/callback', authController.callback);
// router.get('/plan/callback', embedBillingController.callback);

export default authRoute;