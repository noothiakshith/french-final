import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

/**
 * Generates a JWT for a given user ID.
 * @param {String} id - The user's ID.
 * @returns {String} - The generated JSON Web Token.
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
    const { email, password, name } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide an email and password.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        // 2. Check if user already exists
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create the new user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        // 5. Respond with success (but don't send token/user data on register)
        res.status(201).json({
            message: `User ${user.email} registered successfully.`,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

/**
 * @desc    Authenticate a user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        
        // 2. Check if user exists and password is correct
        if (user && (await bcrypt.compare(password, user.password))) {
            
            // 3. Update the last login timestamp
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });

            // 4. Send back token and user data (without password)
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

/**
 * @desc    Get current logged-in user data
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get full user data including onboarding status and chapters
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                chapters: {
                    select: { id: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { id, name, email, currentLevel, hasSkippedTest, placementTestScore } = user;
        const hasChapters = user.chapters.length > 0;

        const userData = {
            id,
            name,
            email,
            currentLevel,
            hasSkippedTest,
            placementTestScore,
            hasChapters
        };

        res.status(200).json(userData);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};