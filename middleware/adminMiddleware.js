const isAdmin = (req, res, next) => {
    console.log("🛠 Admin Middleware - Checking user...");
    console.log("👤 Full User Object:", req.user);

    if (!req.user) {
        console.log("⛔ ERROR: req.user is missing");
        return res.status(401).json({ message: "Not authenticated" });
    }

    console.log("🔎 isAdmin Type:", typeof req.user.isAdmin, "| Value:", req.user.isAdmin);

    if (!req.user.isAdmin) {
        console.log("⛔ Access Denied: Admin only.");
        return res.status(403).json({ message: "Access denied. Admin only." });
    }

    next();
};

module.exports = { isAdmin };
