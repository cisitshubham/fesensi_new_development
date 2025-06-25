import { loadConfig } from './app/common/helper/config.helper'
import express from 'express'
import http from 'http'
import errorHandler from './app/common/middleware/error-handler.middleware'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import { initPassport } from './app/common/services/passport-jwt.service'
import router from './app/routes'
import { connectToDB } from './app/common/services/database.service'
import {restoreScheduledJobs,ticketEscalationDynamicSchedule } from './app/common/jobs/ticketEslcation.job'
import { startResolutionNotificationScheduler } from './app/common/jobs/resolutionNotification.job'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'


dotenv.config()

loadConfig()
const port = Number(process.env.PORT) ?? 3000
const app = express()

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')));



app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));

app.use(morgan('dev'))
app.use( cors({ origin: '*',}))


const initApp = async () => {

	initPassport()
    connectToDB()
	await restoreScheduledJobs()
	await ticketEscalationDynamicSchedule()
	await startResolutionNotificationScheduler()
	
	app.get('/', (req, res) => {
		res.render('index');
	});

	app.use('/api', router)
    app.use(errorHandler)
    const httpServer = http.createServer(app)

    httpServer.listen(port, () => {
        console.log(`Server is running on port ${port}`)
    })
}

void initApp()

