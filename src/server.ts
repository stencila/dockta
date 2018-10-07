import express from 'express'
import router from './router'

const app = express()
app.use('/', router)
app.listen(3000, () => console.log('Listening on port 3000'))
