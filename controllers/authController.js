const User = require('../models/userModel'); // Note: Make sure the path is correct

// Get login page
exports.getLogin = (req, res) => {
    // If user is already logged in, redirect to dashboard
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    
    res.render('auth/login', {
        title: 'Login',
        error: null,
        user: null
    });
};

// Get register page
exports.getRegister = (req, res) => {
    // If user is already logged in, redirect to dashboard
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    
    res.render('auth/register', {
        title: 'Register',
        error: null,
        user: null
    });
};

// Handle registration
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phoneNumber, role, address } = req.body;

        // Validate input
        if (!firstName || !lastName || !email || !password || !phoneNumber) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'All required fields must be filled',
                user: null
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Email already registered',
                user: null
            });
        }

        // Create new user (password will be hashed by the pre-save hook)
        const user = new User({
            firstName,
            lastName,
            email,
            password, // Will be hashed automatically by the model's pre-save hook
            phoneNumber,
            role: role || 'student', // Default role if not specified
            address: address ? {
                street: address.street || '',
                city: address.city || '',
                state: address.state || '',
                zipCode: address.zipCode || '',
                country: address.country || ''
            } : {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            }
        });

        await user.save();

        // Set session
        req.session.userId = user._id;
        req.session.user = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName, // Using the virtual
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            profilePicture: user.profilePicture
        };

        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/dashboard/admin');
        } else {
            res.redirect('/dashboard');
        }

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.render('auth/register', {
                title: 'Register',
                error: messages.join(', '),
                user: null
            });
        }
        
        res.render('auth/register', {
            title: 'Register',
            error: 'Error during registration. Please try again.',
            user: null
        });
    }
};

// Handle login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Email and password are required',
                user: null
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
                user: null
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Your account has been deactivated. Please contact administrator.',
                user: null
            });
        }

        // Check password using the model's comparePassword method
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
                user: null
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Set session
        req.session.userId = user._id;
        req.session.user = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName, // Using the virtual
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            profilePicture: user.profilePicture,
            address: user.address
        };

        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/dashboard/admin');
        } else {
            res.redirect('/dashboard');
        }

    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Login',
            error: 'Error during login. Please try again.',
            user: null
        });
    }
};

// Handle logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/auth/login');
    });
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/auth/login');
        }

        res.render('auth/profile', {
            title: 'My Profile',
            user: req.session.user,
            profileData: user
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.redirect('/dashboard');
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, address } = req.body;
        
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update fields
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        
        if (address) {
            user.address = {
                street: address.street || user.address?.street,
                city: address.city || user.address?.city,
                state: address.state || user.address?.state,
                zipCode: address.zipCode || user.address?.zipCode,
                country: address.country || user.address?.country
            };
        }

        await user.save();

        // Update session
        req.session.user = {
            ...req.session.user,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            address: user.address
        };

        res.redirect('/auth/profile');
    } catch (error) {
        console.error('Update profile error:', error);
        res.redirect('/auth/profile');
    }
};

// Render settings page (e.g. change password or other preferences)
exports.getSettings = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }
        res.render('auth/settings', {
            title: 'Settings',
            user: req.session.user,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Settings error:', error);
        res.redirect('/dashboard');
    }
};

// Update user settings (currently only password change)
exports.updateSettings = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.session.userId);
        if (!user) return res.redirect('/auth/settings');

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.render('auth/settings', {
                title: 'Settings',
                user: req.session.user,
                error: 'Current password is incorrect',
                success: null
            });
        }
        if (newPassword !== confirmPassword) {
            return res.render('auth/settings', {
                title: 'Settings',
                user: req.session.user,
                error: 'New passwords do not match',
                success: null
            });
        }
        user.password = newPassword;
        await user.save();

        res.render('auth/settings', {
            title: 'Settings',
            user: req.session.user,
            error: null,
            success: 'Password successfully updated'
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.redirect('/auth/settings');
    }
};