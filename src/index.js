import express from "express";
import catalogRoutes from "./routes/catalog.routes.js";
import controlRoutes from "./routes/control.routes.js";
import indexRoutes from "./routes/index.routes.js";
import inputControlRoutes from "./routes/input_control.routes.js";
import ghAccess from "./routes/ghaccess.routes.js";
import userRoutes from "./routes/user.routes.js";
import refresh from "./routes/refresh.routes.js";
import assistantRoutes from "./routes/assistant.routes.js";
import threadRoutes from "./routes/thread.routes.js";
import configRoutes from "./routes/configuration.routes.js";
import computationRoutes from "./routes/computation.routes.js";
import cors from "cors";
import { verifyAuthority } from "./middleware/verifyAuth.js";
import { validateParams } from "./middleware/validation.js";
import { endpointAvailable } from "./middleware/endpoint.js";
import cookieParser from "cookie-parser";
import Configuration from "./models/configuration.model.js";
import db from "../db/database.js";
import { verifyAdmin } from "./middleware/verifyAdmin.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "STATUS API",
            description: "API Documentation for the STATUS API",
            version: "1.0.0",
            license: {
                name: "Apache 2.0",
                url: "https://www.apache.org/licenses/LICENSE-2.0.html",
            },
            servers: ["http://localhost:3001"],
        },
    },
    apis: ["./src/routes/*.js", "./src/models/*.js"],
};
const specs = swaggerJSDoc(swaggerOptions);

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: "*",
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
    })
);

app.use(cookieParser());
app.use(indexRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use(endpointAvailable);
app.use("/api", ghAccess);
app.use("/api", refresh);
app.use("/api", userRoutes);
app.use(validateParams);
app.use(verifyAuthority);
app.use("/api", inputControlRoutes);
app.use("/api", controlRoutes);
app.use("/api", catalogRoutes);
app.use("/api", computationRoutes);
app.use("/api", assistantRoutes);
app.use("/api", threadRoutes);
app.use(verifyAdmin);
app.use("/api", configRoutes);

app.listen(3001, () => {
    console.log(`Server on http://localhost:3001`);
    console.log("API doc available at http://localhost:3001/docs");
});

export default app;

async function insertEndpointsToConfig() {
    const endpoints = [
        "/api/config",
        "/api/refresh",
        "/api/user",
        "/api/input_controls",
        "/api/controls",
        "/api/thread",
        "/api/catalogs",
        "/api/assistant",
        "/api/ghAccessToken",
        "/api/getAuth",
        "/api/computation",
        "/docs",
    ];
    try {
        await db.sync({ alter: true });
        for (const endpoint of endpoints) {
            if (endpoint === "/api/assistant") {
                await Configuration.findOrCreate({
                    where: { endpoint },
                    defaults: { endpoint, available: true, limit: 5 },
                });
            } else {
                await Configuration.findOrCreate({
                    where: { endpoint },
                    defaults: { endpoint, available: true },
                });
            }
        }
        console.log("Endpoints added to the configuration");
    } catch (error) {
        console.error("Error al insertar endpoints:", error);
    }
}
insertEndpointsToConfig();
