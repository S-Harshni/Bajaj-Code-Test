const express = require("express");
const cors = require("cors");
const path = require("path");
const { processHierarchyData } = require("./lib/bfhlProcessor");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.post("/bfhl", (req, res) => {
  try {
    const payload = processHierarchyData(req.body?.data);
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal server error",
    });
  }
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }
  return res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
