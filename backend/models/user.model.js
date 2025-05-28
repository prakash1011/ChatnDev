import mongoose from "mongoose";
// Using bcryptjs instead of bcrypt for better compatibility with deployment environments
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: [ 6, 'Email must be at least 6 characters long' ],
        maxLength: [ 50, 'Email must not be longer than 50 characters' ]
    },

    password: {
        type: String,
        select: false,
    }
})


userSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

userSchema.methods.isValidPassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        console.error('Password validation error:', error);
        // Fall back to simple comparison for testing in case of bcrypt/bcryptjs incompatibility
        return false;
    }
}

userSchema.methods.generateJWT = function () {
    return jwt.sign(
        { email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
}


const User = mongoose.model('user', userSchema);

export default User;