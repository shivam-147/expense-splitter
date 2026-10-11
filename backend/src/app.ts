import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { errorMiddleware } from "./middlewares/error.middleware";
import { requestIdMiddleware } from './middlewares/request-id.middleware'
import authRouter from './modules/auth/auth.routes'
import userRouter from './modules/users/user.routes';

const app = express()

app.use(helmet())
app.use(cors())

app.use(express.json())
app.use(requestIdMiddleware);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      service: 'expense-splitter-api'
    }
  })
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', userRouter)

app.use(errorMiddleware);

export { app }
