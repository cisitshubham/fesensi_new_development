import { getTicketCategoryCount } from './../ticket/ticket.service';
import { Router } from 'express'
import { catchError } from '../common/middleware/catch-error.middleware'
import { authenticate } from '../common/middleware/authenticate.middleware'
import uploade from '../common/helper/file.handler';
import * as ticketController from '../ticket/ticket.controller'
import * as ticketValidator from '../ticket/ticket.validation'
import * as adminValidator from '../admin/admin.validator'
import* as adminController from '../admin/roles/roles.controller'
import * as userController from '../admin/user/user.controller'
import * as resolvePostController from '../admin/resolvedPosts/resolvedPosts.Controller'
import * as reAssignentController from '../admin/reassignments/reAssignmentOptions.Controller'
import *as priorityController from '../admin/priority/priority.controller'
import * as feedbackOptionsController from '../admin/feedbackOptions/feedbackOptions.Controller'
import * as adminTicketController from '../admin/tickets/ticket.controller'
import * as rolesPermissionsController from '../admin/roles_permissions/rolesPermissions.controller'
import * as announcementsController from './announcements/announcements.controller'
import * as contactSupportController from './contactSupport/contactSupport.controller'
import * as categoriesController from './categories/categories.controller'
import * as contactSupportOptionsController from './contactSupportOptions/contactSupportOptions.controller'
import * as trustLevelController from '../trustLevel/turstLevel.controller'
const router =  Router();

// Tickets
router.get('/tickets/:page?/:limit?', authenticate, catchError, adminTicketController.getAllTicketsByAdmin);
router.post('/tickets/dashboard/tickets/progression', authenticate, uploade.array('images', 5), ticketValidator.filter,  ticketController.getTicketStatusCountByAdmin);
router.post('/tickets/dashboard/tickets/categories', authenticate, uploade.array('images', 5), ticketValidator.filter, adminTicketController.getTicketCategoryCount);
router.post('/tickets/filter', authenticate, uploade.array('images', 5), ticketValidator.TicketFilter, catchError, ticketController.TicketFilter);
router.post('/tickets/update/:id', authenticate, uploade.array('images', 5) , catchError, ticketController.updateTicket);
router.post('/Dashboard/charts/:status?/:page?/:limit?', authenticate, uploade.none(), adminTicketController.getTicketsCharts)
router.get('/request/reassign/tickets/:status?', authenticate, catchError, adminTicketController.getTicketsRequestReassign);
router.get('/ticket/by/:id', authenticate, catchError, adminTicketController.getTicketById);
router.post('/update/ticket/reassign', authenticate, uploade.none(), adminValidator.updateTicketReassign, catchError, adminTicketController.updateTicketReassign);
router.post('/assign/ticket/to/agent', authenticate, uploade.none(), adminValidator.assignTicketToAgent, catchError, adminTicketController.AssignTicketToAgent);


// Roles
router.post('/roles/create', authenticate, uploade.array('images', 5),adminValidator.role ,catchError, adminController.createRoles);
router.get('/roles/list', authenticate,  catchError, adminController.getAllRoles);
router.get('/users/by/role', authenticate,  catchError, userController.getAllUsersByRole);

// Users
router.get('/users/list', authenticate,  catchError, userController.getAllUsers);
router.get('/users/:id', authenticate,  catchError, userController.getUserById);
router.post('/users/update/:id', authenticate, uploade.single('image'), catchError, userController.updateUser);
router.post('/users/activate/:id', authenticate, uploade.none(), catchError, userController.activate_DeactivateUser);
router.post('/users/make/admin/:id', authenticate, uploade.none(), catchError, userController.makeAdmin);
router.post('/user/create', authenticate, uploade.none(), adminValidator.createUser, catchError, userController.createUser);


// Agent Resolevd Reason
router.post('/resolved/post/create', authenticate, uploade.single('image'), adminValidator.resolvePostCreate, catchError,resolvePostController.createResolvedPost) 
router.get('/resolved/list', authenticate, catchError, resolvePostController.GetResolvedPost);
router.post('/resolved/post/update/:id', authenticate, uploade.single('image'),adminValidator.resolvePostUpdate, catchError,resolvePostController.UpdateResolvedPost) 
router.post('/resolved/post/delete/:id',authenticate,resolvePostController.deleteResolvedPost) 


// Agent ReAssignment Reason
router.post('/reassignement/create', authenticate, uploade.single('image'), adminValidator.resolvePostCreate, catchError,reAssignentController.createReassignoption) 
router.get('/reassignement/list', authenticate, catchError, reAssignentController.GetReassignoption);
router.post('/reassignement/post/update/:id', authenticate, uploade.single('image'),adminValidator.resolvePostUpdate, catchError,reAssignentController.UpdateReassignoption) 
router.post('/reassignement/post/delete/:id',authenticate,reAssignentController.deleteReassignoption) 

// Priroties
router.post('/priority/create', authenticate, uploade.none(), adminValidator.createPriorities, catchError, priorityController.createPriorities)
router.get('/priority/getAllPriorities', authenticate, catchError, priorityController.getPriorities)
router.post('/priroty/update/:id',authenticate,uploade.none(),catchError,priorityController.updatePriorities)
router.post('/priroty/delete/:id',authenticate,uploade.none(),catchError,priorityController.deletePriorities)

// Feedback Options
router.post('/feedback/create', authenticate, uploade.none(), adminValidator.FeedbackOptions, catchError, feedbackOptionsController.createfeedbackOption)
router.get('/feedback/getAllFeedback', authenticate, catchError, feedbackOptionsController.getFeedbackOptions)
router.post('/feedback/update/:id', authenticate, uploade.none(), adminValidator.FeedbackOptionsUpdate, catchError, feedbackOptionsController.UpdateFeedbackOptions)
router.post('/feedback/delete/:id', authenticate, uploade.none(), catchError, feedbackOptionsController.deleteFeedbackOptions)

// Roles Permission
router.post('/assign/permissions', authenticate, uploade.none(), adminValidator.assignPermissionsToRole, catchError, rolesPermissionsController.assignPermissionsToRole) 
router.get('/assigned/permissions', authenticate, catchError, rolesPermissionsController.getAllPermissions)
router.post('/delete/permissions', authenticate, uploade.none(), adminValidator.deletePermissionsFromRole, catchError, rolesPermissionsController.deletePermissionsFromRole)

// Announcements
router.post('/announcements/create', authenticate, uploade.none(), adminValidator.createAnnouncement, catchError, announcementsController.createAnnouncementController)
router.get('/announcements/getAllAnnouncements', authenticate, catchError, announcementsController.getAnnouncementsController)
router.post('/announcements/update/:id', authenticate,uploade.none(), adminValidator.updateAnnouncement, catchError, announcementsController.updateAnnouncementController)
router.get('/announcements/delete/:id', authenticate,catchError, announcementsController.deleteAnnouncementController)

// Contact Support
router.post('/contact/support/create', authenticate, catchError, contactSupportController.createContactSupport)
router.get('/contact/support/list', authenticate, catchError, contactSupportController.getContactSupport)
router.get('/contact/support/getContactSupportById/:id', authenticate, catchError, contactSupportController.getContactSupportById)
router.get('/contact/support/delete/:id', authenticate, catchError, contactSupportController.deleteContactSupport)
router.get('/contact/support/update/:id', authenticate, catchError, contactSupportController.updateContactSupport)

// Contact Support Options
router.post('/contact/support/options/create', authenticate, uploade.none(), adminValidator.createContactSupportOptions, catchError, contactSupportOptionsController.createContactSupportOptionsController)
router.get('/contact/support/options/list', authenticate,catchError, contactSupportOptionsController.getContactSupportOptionsController)
router.post('/contact/support/options/update/:id', authenticate,uploade.none(), adminValidator.updateContactSupportOptions, catchError, contactSupportOptionsController.updateContactSupportOptionsController)
router.get('/contact/support/options/delete/:id', authenticate, catchError, contactSupportOptionsController.deleteContactSupportOptionsController)

	
// Categories
router.post('/categories/create', authenticate, uploade.none(), adminValidator.createCategories, catchError, categoriesController.createCategories)
router.post('/categories/update/:id', authenticate,uploade.none(), adminValidator.updateCategories, catchError, categoriesController.updateCategories)
router.get('/categories/delete/:id', authenticate, catchError, categoriesController.deleteCategories)

// Trust Level Info
router.post('/trust/level/info/create', authenticate, uploade.none(), adminValidator.createTrustLevelInfo, catchError, trustLevelController.createTrustLevelInfo)
router.get('/trust/level/info/list', authenticate, catchError, trustLevelController.getTrustLevelInfo)
router.get('/trust/level/info/:id', authenticate, catchError, trustLevelController.getTrustLevelInfoById)
router.post('/trust/level/info/update/:id', authenticate, uploade.none(), adminValidator.updateTrustLevelInfo, catchError, trustLevelController.updateTrustLevelInfoById)
router.get('/trust/level/info/delete/:id', authenticate, catchError, trustLevelController.deleteTrustLevelInfoById)

export const adminRoutes = router;