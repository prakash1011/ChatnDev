import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redis.service.js';

/**
 * Create a new user
 */
export const createUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const user = await userService.createUser(req.body);
        const token = await user.generateJWT();
        delete user._doc.password;
        
        return res.status(201).json({ user, token });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

/**
 * User login
 */
export const loginController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = await user.generateJWT();
        delete user._doc.password;

        return res.status(200).json({ user, token });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}

/**
 * Get user profile
 */
export const profileController = async (req, res) => {
    return res.status(200).json({ user: req.user });
}

/**
 * Logout user by blacklisting the token
 */
export const logoutController = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];
        // Blacklist token for 24 hours
        await redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);
        
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}

/**
 * Get all users except the logged in user
 */
export const getAllUsersController = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const allUsers = await userService.getAllUsers({ userId: loggedInUser._id });
        
        return res.status(200).json({ users: allUsers });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}
