import express from 'express';
import authRoute from './authRoute.js';
const app = express();

app.use("/", authRoute);

export default app;
