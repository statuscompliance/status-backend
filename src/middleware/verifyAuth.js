import jwt from "jsonwebtoken";

export function verifyAuthority(req, res, next) {
    if (
        req.headers["authorization"] === undefined &&
        req.headers["Authorization"] === undefined
    ) {
        return res.status(401).json({ message: "No token provided" });
    } else {
        const authorizationHeader =
            req.headers["authorization"] || req.headers["Authorization"];
        if (!authorizationHeader) {
            return res.status(401).json({ message: "No token provided" });
        }
        const accessToken = authorizationHeader.split(" ")[1];
        if (!accessToken) {
            return res.status(401).json({ message: "No token provided" });
        }
        try {
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
            const authority = decoded.authority;
            if (
                authority === "ADMIN" ||
                authority === "USER" ||
                authority === "DEVELOPER"
            ) {
                next();
            } else {
                return res.status(403).json({ message: "Forbidden" });
            }
        } catch (error) {
            return res.status(401).json({ message: `Unauthorized, ${error}` });
        }
    }
}
