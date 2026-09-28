const EDGE_PATTERN = /^[A-Z]->[A-Z]$/;

const env = typeof process !== "undefined" && process.env ? process.env : {};

const identity = {
  user_id: env.BFHL_USER_ID || "khushalnarsaria_13072006",
  email_id: env.BFHL_EMAIL_ID || "kn4379@srmist.edu.in",
  college_roll_number: env.BFHL_ROLL_NUMBER || "RA2311026010175",
};

function normalizeEntry(entry) {
  if (typeof entry === "string") {
    return entry.trim();
  }

  if (entry === null || entry === undefined) {
    return "";
  }

  return String(entry).trim();
}

function extractValidEdges(rawData) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const duplicateLogged = new Set();
  const seenEdges = new Set();
  const firstParentByChild = new Map();
  const validEdges = [];
  const nodeFirstSeenOrder = new Map();

  let nodeOrderCounter = 0;

  for (const rawEntry of rawData) {
    const edgeText = normalizeEntry(rawEntry);

    if (!EDGE_PATTERN.test(edgeText)) {
      invalidEntries.push(edgeText);
      continue;
    }

    const [parent, child] = edgeText.split("->");

    if (parent === child) {
      invalidEntries.push(edgeText);
      continue;
    }

    if (seenEdges.has(edgeText)) {
      if (!duplicateLogged.has(edgeText)) {
        duplicateLogged.add(edgeText);
        duplicateEdges.push(edgeText);
      }
      continue;
    }

    seenEdges.add(edgeText);

    if (firstParentByChild.has(child)) {
      continue;
    }

    firstParentByChild.set(child, parent);
    validEdges.push({ parent, child });

    if (!nodeFirstSeenOrder.has(parent)) {
      nodeFirstSeenOrder.set(parent, nodeOrderCounter++);
    }

    if (!nodeFirstSeenOrder.has(child)) {
      nodeFirstSeenOrder.set(child, nodeOrderCounter++);
    }
  }

  return {
    validEdges,
    invalidEntries,
    duplicateEdges,
    nodeFirstSeenOrder,
  };
}

function buildGraph(validEdges) {
  const nodes = new Set();
  const childrenByParent = new Map();
  const childrenSet = new Set();
  const undirected = new Map();

  for (const edge of validEdges) {
    const { parent, child } = edge;
    nodes.add(parent);
    nodes.add(child);
    childrenSet.add(child);

    if (!childrenByParent.has(parent)) {
      childrenByParent.set(parent, []);
    }
    childrenByParent.get(parent).push(child);

    if (!undirected.has(parent)) {
      undirected.set(parent, new Set());
    }
    if (!undirected.has(child)) {
      undirected.set(child, new Set());
    }
    undirected.get(parent).add(child);
    undirected.get(child).add(parent);
  }

  return { nodes, childrenByParent, childrenSet, undirected };
}

function sortByNodeOrder(nodes, nodeFirstSeenOrder) {
  return [...nodes].sort((a, b) => {
    const orderA = nodeFirstSeenOrder.has(a)
      ? nodeFirstSeenOrder.get(a)
      : Number.MAX_SAFE_INTEGER;
    const orderB = nodeFirstSeenOrder.has(b)
      ? nodeFirstSeenOrder.get(b)
      : Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.localeCompare(b);
  });
}

function getComponents(nodes, undirected, nodeFirstSeenOrder) {
  const sortedNodes = sortByNodeOrder(nodes, nodeFirstSeenOrder);
  const visited = new Set();
  const components = [];

  for (const startNode of sortedNodes) {
    if (visited.has(startNode)) {
      continue;
    }

    const queue = [startNode];
    const componentNodes = new Set();
    visited.add(startNode);
    let minOrder = nodeFirstSeenOrder.get(startNode) ?? Number.MAX_SAFE_INTEGER;

    while (queue.length > 0) {
      const node = queue.shift();
      componentNodes.add(node);
      const order = nodeFirstSeenOrder.get(node) ?? Number.MAX_SAFE_INTEGER;
      if (order < minOrder) {
        minOrder = order;
      }

      const neighbors = undirected.get(node) || new Set();
      for (const nextNode of neighbors) {
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push(nextNode);
        }
      }
    }

    components.push({
      nodes: componentNodes,
      minOrder,
    });
  }

  components.sort((a, b) => a.minOrder - b.minOrder);
  return components;
}

function hasDirectedCycle(componentNodes, childrenByParent, nodeFirstSeenOrder) {
  const state = new Map();
  const orderedNodes = sortByNodeOrder(componentNodes, nodeFirstSeenOrder);

  const dfs = (node) => {
    state.set(node, 1);
    const children = childrenByParent.get(node) || [];

    for (const child of children) {
      if (!componentNodes.has(child)) {
        continue;
      }

      const childState = state.get(child) || 0;
      if (childState === 1) {
        return true;
      }

      if (childState === 0 && dfs(child)) {
        return true;
      }
    }

    state.set(node, 2);
    return false;
  };

  for (const node of orderedNodes) {
    if ((state.get(node) || 0) === 0 && dfs(node)) {
      return true;
    }
  }

  return false;
}

function pickRoot(componentNodes, childrenSet) {
  const roots = [...componentNodes]
    .filter((node) => !childrenSet.has(node))
    .sort((a, b) => a.localeCompare(b));

  if (roots.length > 0) {
    return roots[0];
  }

  return [...componentNodes].sort((a, b) => a.localeCompare(b))[0];
}

function buildTree(root, componentNodes, childrenByParent) {
  const visit = (node) => {
    const subtree = {};
    let longestDepth = 1;
    const children = childrenByParent.get(node) || [];

    for (const child of children) {
      if (!componentNodes.has(child)) {
        continue;
      }

      const { subtree: childTree, depth: childDepth } = visit(child);
      subtree[child] = childTree;
      const candidateDepth = childDepth + 1;
      if (candidateDepth > longestDepth) {
        longestDepth = candidateDepth;
      }
    }

    return { subtree, depth: longestDepth };
  };

  const { subtree, depth } = visit(root);
  return {
    tree: { [root]: subtree },
    depth,
  };
}

function processHierarchyData(data) {
  if (!Array.isArray(data)) {
    const error = new Error('Request body must include a "data" array.');
    error.statusCode = 400;
    throw error;
  }

  const { validEdges, invalidEntries, duplicateEdges, nodeFirstSeenOrder } =
    extractValidEdges(data);
  const { nodes, childrenByParent, childrenSet, undirected } = buildGraph(validEdges);

  const components = getComponents(nodes, undirected, nodeFirstSeenOrder);
  const hierarchies = [];

  let totalTrees = 0;
  let totalCycles = 0;
  let largestTreeRoot = "";
  let largestTreeDepth = 0;

  for (const component of components) {
    const componentNodes = component.nodes;
    const root = pickRoot(componentNodes, childrenSet);
    const cycleDetected = hasDirectedCycle(
      componentNodes,
      childrenByParent,
      nodeFirstSeenOrder
    );

    if (cycleDetected) {
      totalCycles += 1;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    const { tree, depth } = buildTree(root, componentNodes, childrenByParent);
    totalTrees += 1;
    hierarchies.push({
      root,
      tree,
      depth,
    });

    if (
      depth > largestTreeDepth ||
      (depth === largestTreeDepth &&
        (largestTreeRoot === "" || root.localeCompare(largestTreeRoot) < 0))
    ) {
      largestTreeDepth = depth;
      largestTreeRoot = root;
    }
  }

  return {
    ...identity,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestTreeRoot,
    },
  };
}

// Works in Node (CommonJS) and in the browser (window.BfhlProcessor), so the static
// demo can process input client-side when no /bfhl server is available.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { processHierarchyData, identity };
} else if (typeof window !== "undefined") {
  window.BfhlProcessor = { processHierarchyData, identity };
}
