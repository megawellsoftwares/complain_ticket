export const adminCheck = (req, res, next) => {
    // Assuming user data was attached to req in a previous middleware
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Admin access only" });
    }
    next();
};


