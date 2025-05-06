import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";


export const authUser = async (req, res, next) => {
    try {
        // More robust token extraction that handles different authorization header formats
        let token = req.cookies.token;
        
        // Check for authorization header in different formats
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[ 1 ];
            } else if (!authHeader.includes(' ')) {
                // Handle case where token is sent without 'Bearer' prefix
                token = authHeader;
            }
        }

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized User' });
        }

        const isBlackListed = await redisClient.get(token);

        if (isBlackListed) {

            res.cookie('token', '');

            return res.status(401).send({ error: 'Unauthorized User' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {

        console.log(error);

        res.status(401).send({ error: 'Unauthorized User' });
    }
}