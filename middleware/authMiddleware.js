module.exports = (req, res, next) => {
    if (!req.session.userId) {
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(401).json({ message: 'Please log in to access this resource' });
        }
        return res.redirect('/auth/login');
    }
    next();
};