const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const entryInput = document.getElementById("entryInput");
const statusBox = document.getElementById("statusBox");
const resultRoot = document.getElementById("resultRoot");
const rawResponse = document.getElementById("rawResponse");

const defaultInput = entryInput.value;

// API URL: same-origin /bfhl (Express locally, Vercel rewrite in production) unless a
// BACKEND_URL is configured via localStorage or window.BACKEND_URL.
function getApiUrl() {
  return localStorage.getItem("BACKEND_URL") || window.BACKEND_URL || "/bfhl";
}

// Call the API; on a static host with no /bfhl endpoint, fall back to the same processor
// running in the browser (lib/bfhlProcessor.js exposes window.BfhlProcessor).
async function callApi(entries) {
  try {
    const response = await fetch(getApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: entries }),
    });
    const type = response.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      return { ok: response.ok, payload: await response.json(), source: "API" };
    }
  } catch (error) {
    // network error: fall through to local processing
  }
  if (!window.BfhlProcessor) throw new Error("Unable to reach the /bfhl API.");
  try {
    return { ok: true, payload: window.BfhlProcessor.processHierarchyData(entries), source: "browser" };
  } catch (error) {
    return { ok: false, payload: { error: error.message }, source: "browser" };
  }
}

function setStatus(type, text) {
  if (!text) {
    statusBox.innerHTML = "";
    return;
  }
  statusBox.innerHTML = `<div class="status ${type}">${text}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function parseInput(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new Error("JSON input must be an array.");
    }
    return parsed.map((item) => String(item));
  }

  return trimmed
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderTreeNode(nodeLabel, subtree) {
  const keys = Object.keys(subtree);
  if (keys.length === 0) {
    return `<li>${escapeHtml(nodeLabel)}</li>`;
  }

  const children = keys
    .map((childKey) => renderTreeNode(childKey, subtree[childKey]))
    .join("");

  return `<li>${escapeHtml(nodeLabel)}<ul class="tree-list">${children}</ul></li>`;
}

function renderHierarchyCard(item, index) {
  const cycleTag = item.has_cycle
    ? '<span class="chip warn">cycle detected</span>'
    : "";

  let treeHtml = "<p>No tree structure.</p>";
  if (!item.has_cycle && item.tree && Object.keys(item.tree).length > 0) {
    const rootKey = Object.keys(item.tree)[0];
    treeHtml = `<ul class="tree-list">${renderTreeNode(rootKey, item.tree[rootKey])}</ul>`;
  }

  const depthText = item.depth ? `<span class="chip">depth: ${item.depth}</span>` : "";

  return `
    <article class="card">
      <h3>Hierarchy ${index + 1}</h3>
      <div class="chips">
        <span class="chip">root: ${escapeHtml(item.root)}</span>
        ${depthText}
        ${cycleTag}
      </div>
      <div class="tree-wrap">${treeHtml}</div>
    </article>
  `;
}

function renderResponse(data) {
  const hierarchyCards = (data.hierarchies || [])
    .map((item, index) => renderHierarchyCard(item, index))
    .join("");

  const invalidEntries = (data.invalid_entries || [])
    .map((value) => `<span class="chip warn">${escapeHtml(value)}</span>`)
    .join("");

  const duplicateEdges = (data.duplicate_edges || [])
    .map((value) => `<span class="chip warn">${escapeHtml(value)}</span>`)
    .join("");

  resultRoot.innerHTML = `
    <article class="card">
      <h3>Identity</h3>
      <div class="mini-grid">
        <div class="metric"><small>user_id</small><strong>${escapeHtml(data.user_id)}</strong></div>
        <div class="metric"><small>email_id</small><strong>${escapeHtml(data.email_id)}</strong></div>
        <div class="metric"><small>college_roll_number</small><strong>${escapeHtml(data.college_roll_number)}</strong></div>
      </div>
    </article>
    <article class="card">
      <h3>Summary</h3>
      <div class="mini-grid">
        <div class="metric"><small>total_trees</small><strong>${Number(data.summary?.total_trees || 0)}</strong></div>
        <div class="metric"><small>total_cycles</small><strong>${Number(data.summary?.total_cycles || 0)}</strong></div>
        <div class="metric"><small>largest_tree_root</small><strong>${escapeHtml(data.summary?.largest_tree_root || "")}</strong></div>
      </div>
    </article>
    <article class="card">
      <h3>Invalid Entries</h3>
      <div class="chips">${invalidEntries || '<span class="chip">none</span>'}</div>
    </article>
    <article class="card">
      <h3>Duplicate Edges</h3>
      <div class="chips">${duplicateEdges || '<span class="chip">none</span>'}</div>
    </article>
    ${hierarchyCards}
  `;
}

async function submit() {
  setStatus("", "");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const entries = parseInput(entryInput.value);
    const { ok, payload, source } = await callApi(entries);
    rawResponse.textContent = JSON.stringify(payload, null, 2);

    if (!ok) {
      setStatus("error", payload.error || "Request failed.");
      resultRoot.innerHTML = "";
      return;
    }

    renderResponse(payload);
    setStatus("ok", source === "API" ? "API call successful." : "Processed in the browser (static demo, same logic as POST /bfhl).");
  } catch (error) {
    rawResponse.textContent = "No response due to error.";
    resultRoot.innerHTML = "";
    setStatus("error", error.message || "Unable to call API.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
}

submitBtn.addEventListener("click", submit);
resetBtn.addEventListener("click", () => {
  entryInput.value = defaultInput;
  rawResponse.textContent = "No response yet.";
  resultRoot.innerHTML = "";
  setStatus("", "");
});
