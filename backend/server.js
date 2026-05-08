import express from 'express';
import visitRoutes from './routes/visits.js';
import { connectDB } from './models/db.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));
// DB Connection
connectDB();

// Routes
app.use('/api', visitRoutes);
app.set('view engine', 'ejs');
app.set('views', './views');

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});