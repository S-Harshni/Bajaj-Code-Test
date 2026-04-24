const test = require("node:test");
const assert = require("node:assert/strict");
const { processHierarchyData } = require("../lib/bfhlProcessor");

test("matches challenge sample behavior", () => {
  const input = [
    "A->B",
    "A->C",
    "B->D",
    "C->E",
    "E->F",
    "X->Y",
    "Y->Z",
    "Z->X",
    "P->Q",
    "Q->R",
    "G->H",
    "G->H",
    "G->I",
    "hello",
    "1->2",
    "A->",
  ];

  const response = processHierarchyData(input);

  assert.equal(response.summary.total_trees, 3);
  assert.equal(response.summary.total_cycles, 1);
  assert.equal(response.summary.largest_tree_root, "A");
  assert.deepEqual(response.invalid_entries, ["hello", "1->2", "A->"]);
  assert.deepEqual(response.duplicate_edges, ["G->H"]);

  assert.equal(response.hierarchies[0].root, "A");
  assert.equal(response.hierarchies[0].depth, 4);
  assert.deepEqual(response.hierarchies[1], {
    root: "X",
    tree: {},
    has_cycle: true,
  });
});

test("keeps first parent and discards later parent edges for same child", () => {
  const response = processHierarchyData(["A->D", "B->D", "A->C"]);

  assert.equal(response.summary.total_trees, 1);
  assert.equal(response.summary.total_cycles, 0);
  assert.equal(response.hierarchies[0].root, "A");
  assert.equal(response.hierarchies[0].depth, 2);
  assert.deepEqual(response.hierarchies[0].tree, {
    A: {
      D: {},
      C: {},
    },
  });
});

test("tracks duplicate edges once regardless of repeat count", () => {
  const response = processHierarchyData(["A->B", "A->B", "A->B", "A->B"]);

  assert.deepEqual(response.duplicate_edges, ["A->B"]);
  assert.equal(response.summary.total_trees, 1);
});

test("throws 400 when data is not an array", () => {
  assert.throws(() => processHierarchyData("A->B"), {
    message: 'Request body must include a "data" array.',
  });
});
