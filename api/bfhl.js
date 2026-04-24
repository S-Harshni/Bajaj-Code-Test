const { processHierarchyData } = require("../lib/bfhlProcessor");

function parseRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      const parseError = new Error("Invalid JSON request body.");
      parseError.statusCode = 400;
      throw parseError;
    }
  }

  return {};
}

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed. Use POST /bfhl.",
    });
  }

  try {
    const body = parseRequestBody(req);
    const payload = processHierarchyData(body.data);
    return res.status(200).json(payload);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error",
    });
  }
};
