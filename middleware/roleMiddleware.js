module.exports = (...roles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!roles.includes(req.session.user.role)) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(403).json({ 
                    message: 'You do not have permission to access this resource' 
                });
            }
            return res.status(403).render('error', {
                title: 'Access Denied',
                message: 'You do not have permission to access this page',
                user: req.session.user
            });
        }
        next();
    };
};