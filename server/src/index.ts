import express, { Application, Request, Response } from 'express';
import DBconnect from './DBconnect/DBconnect'
import dotenv from 'dotenv';
import path from 'path';
import userRoute from './routes/user.route'

const app = express();
dotenv.config();
const port = process.env.PORT || 3001;

DBconnect();

app.use(express.json());
app.use('/user', userRoute)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/', (req : Request , res : Response) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});