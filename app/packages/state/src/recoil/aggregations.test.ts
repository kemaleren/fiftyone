import { describe, expect, it, vi } from "vitest";
vi.mock("recoil");
vi.mock("recoil-relay");

import { setMockAtoms, TestSelectorFamily } from "../../../../__mocks__/recoil";
import * as aggregations from "./aggregations";

describe("groups ", () => {
  const testModalAggregationPaths = <
    TestSelectorFamily<typeof aggregations.modalAggregationPaths>
  >(<unknown>aggregations.modalAggregationPaths({ path: "ground_truth" }));

  it("resolves nested dynamic groups with slices", () => {
    setMockAtoms({
      expandPath: (path) => `${path}.detections`,
      filterFields: (path) => [`${path}.one`, `${path}.two`],
      isNumericField: () => false,
      labelFields: () => ["ground_truth", "predictions"],
      groupId: null,
    });
    expect(testModalAggregationPaths()).toStrictEqual([
      "ground_truth.detections.one",
      "ground_truth.detections.two",
      "predictions.detections.one",
      "predictions.detections.two",
    ]);
  });
});
