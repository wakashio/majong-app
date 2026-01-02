import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import playerRoutes from "./routes/playerRoutes";
import hanchanRoutes from "./routes/hanchanRoutes";
import roundRoutes from "./routes/roundRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import { swaggerSpec } from "./config/swagger";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "麻雀記録アプリ API" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/players", playerRoutes);
app.use("/api/hanchans", hanchanRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api", roundRoutes);

export default app;

