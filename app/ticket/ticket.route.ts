import { Router } from 'express'
import { catchError } from '../common/middleware/catch-error.middleware'
import * as ticketController from './ticket.controller'
import * as ticketValidator from './ticket.validation'
import { authenticate } from '../common/middleware/authenticate.middleware'
import uploade from '../common/helper/file.handler';
import *as CateoriesController from '../admin/categories/categories.controller'
import *  as levelsController from '../admin/level/level.controller'
import * as  esclationController from '../common/jobs/ticketEsclation'




const router = Router()
router
    .post('/raise-ticket',authenticate,uploade.array('file',5),ticketValidator.createTicket,catchError,ticketController.createTicket)
	.get('/ticket-list/:status?', authenticate, ticketController.getAllTickets)
    .get('/ticket/:id',authenticate,ticketValidator.getTicketDetails,catchError,ticketController.getTicketDetails)
	.get('/ticket-status/:status?', authenticate, catchError, ticketController.getTicketStatusCount)
	.get('/ticket-dropdowns', authenticate, ticketController.ticketDropdowns)
	.post('/ticket/create-comment', authenticate, uploade.array('images', 5), ticketValidator.createComment,catchError, ticketController.addComment)
	.post('/create/categories', authenticate, CateoriesController.createCategories)
	.post('/level/create', authenticate, levelsController.createLevels)
	.post('/ticket/update', authenticate, uploade.array('file', 5), ticketValidator.TicketUpdate, catchError, ticketController.ticketUpdate)
	.post('/ticket/deleteAttachements', authenticate, uploade.array('file', 5), ticketValidator.removeAttachmentFromTicket, catchError, ticketController.removeAttachmentFromTicket)
	.post('/ticket/isTicketResolved', authenticate, uploade.none() , ticketValidator.isTicketResolved, catchError, ticketController.isTicketResolved)
	.post('/ticket/addFeedback', authenticate, uploade.none(), ticketValidator.addFeedback, catchError, ticketController.addFeedback)
    .post('/filter', authenticate, uploade.none(), ticketValidator.TicketFilter, catchError, ticketController.TicketFilter)
    .post('/escalation',authenticate, esclationController.TicketEscalation)
	.post('/Dashboard/charts/:param?', authenticate, uploade.none(), ticketController.getTicketsCharts)
	.post('/contact/support/create', authenticate, uploade.none(), ticketValidator.createContactSupport, catchError, ticketController.createContactSupport)
	.get('/contact/support/list', authenticate, catchError, ticketController.getContactSupport)
	.get('/announcements', authenticate, ticketController.getAnnouncements)
	.get('/feedback/ticket', authenticate, ticketController.getSkipFeedbacks)

	// create route to test the ticket escalation
	.get('/test-escalation', authenticate, esclationController.TicketEscalation)
export default router
