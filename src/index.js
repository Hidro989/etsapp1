import 'dotenv/config';
import app from './routes/app.js';
import cookieParser from 'cookie-parser';

const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);
app.use(cookieParser());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
