import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';


/**
 * Create a new project for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createProject = async (req, res) => {
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation error',
            errors: errors.array() 
        });
    }

    try {
        // Extract project name from request
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }
        
        // Get user details from authentication middleware
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        if (!loggedInUser) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const userId = loggedInUser._id;

        // Create the project using service layer
        const newProject = await projectService.createProject({ name, userId });
        
        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            project: newProject
        });
    } catch (err) {
        console.error('Error creating project:', err.message);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create project',
            error: err.message 
        });
    }
}

/**
 * Get all projects for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllProject = async (req, res) => {
    try {
        // Get user details from authentication middleware
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });
        
        if (!loggedInUser) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get all projects for the user
        const allUserProjects = await projectService.getAllProjectByUserId({
            userId: loggedInUser._id
        });

        return res.status(200).json({
            success: true,
            message: 'Projects retrieved successfully',
            projects: allUserProjects
        });
    } catch (err) {
        console.error('Error getting projects:', err.message);
        return res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve projects',
            error: err.message 
        });
    }
}

/**
 * Add users to a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addUserToProject = async (req, res) => {
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation error',
            errors: errors.array() 
        });
    }

    try {
        // Extract request data
        const { projectId, users } = req.body;
        
        // Validate required fields
        if (!projectId || !users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Project ID and users array are required'
            });
        }
        
        // Get logged in user details
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });
        
        if (!loggedInUser) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Add users to the project
        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id
        });

        return res.status(200).json({ 
            success: true,
            message: 'Users added to project successfully',
            project 
        });
    } catch (err) {
        console.error('Error adding users to project:', err.message);
        return res.status(500).json({ 
            success: false,
            message: 'Failed to add users to project',
            error: err.message 
        });
    }
}

/**
 * Get a project by its ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProjectById = async (req, res) => {
    const { projectId } = req.params;

    // Validate projectId
    if (!projectId) {
        return res.status(400).json({
            success: false,
            message: 'Project ID is required'
        });
    }

    try {
        const project = await projectService.getProjectById({ projectId });
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        
        return res.status(200).json({ 
            success: true,
            message: 'Project retrieved successfully',
            project 
        });
    } catch (err) {
        console.error('Error getting project by ID:', err.message);
        return res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve project',
            error: err.message 
        });
    }
}

/**
 * Update a project's file tree
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateFileTree = async (req, res) => {
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation error',
            errors: errors.array() 
        });
    }

    try {
        const { projectId, fileTree } = req.body;
        
        // Validate required fields
        if (!projectId || !fileTree) {
            return res.status(400).json({
                success: false,
                message: 'Project ID and file tree are required'
            });
        }
        
        // Update the file tree
        const project = await projectService.updateFileTree({ projectId, fileTree });
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        
        return res.status(200).json({ 
            success: true,
            message: 'File tree updated successfully',
            project 
        });
    } catch (err) {
        console.error('Error updating file tree:', err.message);
        return res.status(500).json({ 
            success: false,
            message: 'Failed to update file tree',
            error: err.message 
        });
    }
}

export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }
        
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });
        
        if (!loggedInUser) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        const result = await projectService.deleteProject({
            projectId,
            userId: loggedInUser._id
        });
        
        return res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting project:', err.message);
        res.status(400).json({ error: err.message });
    }
}