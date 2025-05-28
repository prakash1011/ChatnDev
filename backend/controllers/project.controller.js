import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';


export const createProject = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { name } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        const newProject = await projectService.createProject({ name, userId });

        res.status(201).json(newProject);

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }



}

export const getAllProject = async (req, res) => {
    try {

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const allUserProjects = await projectService.getAllProjectByUserId({
            userId: loggedInUser._id
        })

        return res.status(200).json({
            projects: allUserProjects
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { projectId, users } = req.body

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })


        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id
        })

        return res.status(200).json({
            project,
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }


}

export const getProjectById = async (req, res) => {

    const { projectId } = req.params;

    try {

        const project = await projectService.getProjectById({ projectId });

        return res.status(200).json({
            project
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }

}

export const updateFileTree = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { projectId, fileTree } = req.body;

        const project = await projectService.updateFileTree({
            projectId,
            fileTree
        })

        return res.status(200).json({
            project
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }

}

export const deleteProject = async (req, res) => {
    try {
        // Log route parameters for debugging
        console.log('Delete Project Route Hit:', req.method, req.path);
        console.log('Request params:', req.params);
        console.log('Project ID to delete:', req.params.projectId);
        
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
        
        console.log('User found:', loggedInUser.email);
        
        const result = await projectService.deleteProject({
            projectId,
            userId: loggedInUser._id
        });
        
        console.log('Project deleted successfully:', result);
        
        return res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (err) {
        console.log('Error in deleteProject:', err.message);
        res.status(400).json({ error: err.message });
    }
}