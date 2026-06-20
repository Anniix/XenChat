const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const userRoutes = require('./routes/user.routes');
const { errorMiddleware } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' })); // tighten in production
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);

app.use(errorMiddleware);

module.exports = app;