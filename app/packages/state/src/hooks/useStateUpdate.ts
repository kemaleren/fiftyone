import { RGB } from "@fiftyone/looker";
import {
  TransactionInterface_UNSTABLE,
  useRecoilTransaction_UNSTABLE,
} from "recoil";
import {
  aggregationsTick,
  modal,
  sidebarGroupsDefinition,
  State,
  tagging,
  _activeFields,
  dataset as datasetAtom,
  resolveGroups,
  filters,
  colorPool as colorPoolAtom,
  selectedLabels,
  appConfig,
  colorscale as colorscaleAtom,
  selectedSamples,
  patching,
  similaritySorting,
  savingFilters,
  groupSlice,
  similarityParameters,
  extendedSelection,
  selectedMediaField,
  theme,
} from "../recoil";
import { useColorScheme } from "@mui/material";

import * as viewAtoms from "../recoil/view";
import { collapseFields, viewsAreEqual } from "../utils";

interface StateUpdate {
  colorscale?: RGB[];
  config?: State.Config;
  dataset?: State.Dataset;
  state?: Partial<State.Description>;
}

export type StateResolver =
  | StateUpdate
  | ((t: TransactionInterface_UNSTABLE) => StateUpdate);

const useStateUpdate = () => {
  const { setMode } = useColorScheme();

  return useRecoilTransaction_UNSTABLE(
    (t) => (resolve: StateResolver) => {
      const { colorscale, config, dataset, state } =
        resolve instanceof Function ? resolve(t) : resolve;

      const { get, reset, set } = t;

      if (state) {
        const view = get(viewAtoms.view);

        if (!viewsAreEqual(view || [], state.view || [])) {
          set(viewAtoms.view, state.view || []);
          reset(extendedSelection);
          reset(similarityParameters);
          reset(filters);
        }
      }

      colorscale !== undefined && set(colorscaleAtom, colorscale);

      config !== undefined && set(appConfig, config);
      state?.viewCls !== undefined && set(viewAtoms.viewCls, state.viewCls);

      state?.selected && set(selectedSamples, new Set(state.selected));
      state?.selectedLabels &&
        set(
          selectedLabels,
          Object.fromEntries(
            (state.selectedLabels || []).map(({ labelId, ...data }) => [
              labelId,
              data,
            ])
          )
        );

      if (config && config.theme !== "browser") {
        set(theme, config.theme);
        setMode(config.theme);
      }
      const colorPool = get(colorPoolAtom);
      if (
        config &&
        JSON.stringify(config.colorPool) !== JSON.stringify(colorPool)
      ) {
        set(colorPoolAtom, config.colorPool);
      }

      if (dataset) {
        dataset.brainMethods = Object.values(dataset.brainMethods || {});
        dataset.evaluations = Object.values(dataset.evaluations || {});
        dataset.sampleFields = collapseFields(dataset.sampleFields);
        dataset.frameFields = collapseFields(dataset.frameFields);

        const groups = resolveGroups(dataset);
        const currentSidebar = get(sidebarGroupsDefinition(false));

        if (JSON.stringify(groups) !== JSON.stringify(currentSidebar)) {
          set(sidebarGroupsDefinition(false), groups);
          set(aggregationsTick, get(aggregationsTick) + 1);
        }

        const previousDataset = get(datasetAtom);
        if (
          !previousDataset ||
          previousDataset.id !== dataset.id ||
          dataset.groupSlice !== previousDataset.groupSlice
        ) {
          reset(_activeFields({ modal: false }));
          let slice = dataset.groupSlice;

          if (dataset.groupMediaTypes[slice] === "pcd") {
            slice = dataset.defaultGroupSlice;
          }

          set(groupSlice(false), slice);

          reset(similarityParameters);
          set(
            selectedMediaField(false),
            dataset?.appConfig?.gridMediaField || "filepath"
          );
          set(
            selectedMediaField(true),
            dataset?.appConfig?.modalMediaField || "filepath"
          );
          reset(extendedSelection);
          reset(filters);
        }

        set(datasetAtom, dataset);
      }

      set(modal, null);

      [true, false].forEach((i) =>
        [true, false].forEach((j) =>
          set(tagging({ modal: i, labels: j }), false)
        )
      );
      set(patching, false);
      set(similaritySorting, false);
      set(savingFilters, false);
    },
    []
  );
};

export default useStateUpdate;
