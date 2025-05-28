import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleWare from '../middleware/auth.middleware.js';

const router = Router();

// Create project route
router.post('/create',
    authMiddleWare.authUser,
    body('name').isString().withMessage('Name is required'),
    projectController.createProject
);

// Get all projects route
router.get('/all',
    authMiddleWare.authUser,
    projectController.getAllProject
);

// Add user to project route
router.put('/add-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array of strings').bail()
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'),
    projectController.addUserToProject
);

// Get specific project by ID route
router.get('/get-project/:projectId',
    authMiddleWare.authUser,
    projectController.getProjectById
);

// Update file tree route
router.put('/update-file-tree',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('fileTree').isObject().withMessage('File tree is required'),
    projectController.updateFileTree
);

// DELETE PROJECT ROUTES - offering multiple route patterns for reliability
// Standard REST pattern: DELETE /projects/:id
router.delete('/:projectId', 
    authMiddleWare.authUser,
    projectController.deleteProject
);

// More explicit route pattern: DELETE /projects/delete/:id
router.delete('/delete/:projectId', 
    authMiddleWare.authUser,
    projectController.deleteProject
);

// Completely new route specifically for deletion using POST instead of DELETE (for compatibility)
router.post('/remove-project/:projectId', 
    authMiddleWare.authUser,
    projectController.deleteProject
);

export default router;