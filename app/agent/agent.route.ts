import { Router } from 'express'
import { catchError } from '../common/middleware/catch-error.middleware'
import { authenticate } from '../common/middleware/authenticate.middleware'
import uploade from '../common/helper/file.handler'
import* as agentController from './agent.controller'
import* as agentValidator from './agent.validation'
import* as trustLevelController from '../trustLevel/turstLevel.controller'

import { TicketEscalation } from '../common/jobs/ticketEsclation'

const router = Router()

	.get('/dashboard/:status?', authenticate, agentController.dashboard)
	.post('/myTickets/:status?', authenticate, uploade.none(), agentValidator.TicketFilter ,agentController.TicketFilter)
	.get('/myTickets/charts/:status?', authenticate, agentController.TicketFilter)
	.get('/myTicket/details/:id', authenticate, agentController.getTicketDetails)
	.get('/myTicket/comments/:id', authenticate, agentController.getUserCommentByTicketId)
	.post('/update/resolution', authenticate,uploade.array('image',5), agentValidator.addResolution, catchError, agentController.addResolution)
	.post('/update/AddResovedPost', authenticate, uploade.single('image'), agentValidator.addResovedPost, catchError, agentController.AddResovedPost)
	.post('/myTicket/requestReassign', authenticate, uploade.single('image'), agentValidator.requestReAssign, catchError, agentController.requestReassignTicket)
	.post('/closed/ticket', authenticate, uploade.single('image'), agentValidator.closedTicket, catchError, agentController.closedTicket)
	.post('/update/ticketIncomplete', authenticate, uploade.array('image', 5), agentValidator.Ticketincomplete, catchError, agentController.Ticketincomplete)
	.post('/myTicket/filter', authenticate,uploade.none(), agentValidator.TicketFilter, catchError, agentController.TicketFilter)	
	.get('/myTicket/RequestReassign/:status?', authenticate, agentController.GetAllTciketRequestAssign)
	.post('/myTickets/Dashboard/charts/:status?', authenticate,uploade.none() ,agentController.getTicketsCharts)
	.post('/myTicket/escalated', authenticate,uploade.none(),catchError, agentController.getEscalatedTickets)
	.get('/myTicket/escalated/:id', authenticate, agentController.getEscalatedTicketsByID)
	.get('/myTicket/slaStatus', authenticate, agentController.getTicketsSlaStatus)
	.post('/contact/support/create', authenticate, uploade.none(), agentValidator.createContactSupport, catchError, agentController.createContactSupport)
	.get('/contact/support/list', authenticate, catchError, agentController.getContactSupport)
	.get('/myTicket/countByWeek', authenticate, catchError, agentController.getTicketCountByWeek)
	.get('/sla', authenticate, catchError, agentController.slaKnowledgeBase)
	.get('/trustLevel', authenticate, catchError, trustLevelController.getTrustLevel)
	.post('/run-escalation', async (req, res) => {
		try {
			await TicketEscalation();
			res.status(200).json({ message: 'Ticket escalation executed successfully.' });
		} catch (err: any) {
			console.error('Error running escalation:', err);
			res.status(500).json({ message: 'Escalation failed', error: err?.message });
		}
	});
export const agentRoutes = router;