import * as foq from "@fiftyone/relay";
import * as fos from "@fiftyone/state";
import React, { useMemo } from "react";
import {
  commitLocalUpdate,
  useMutation,
  useRelayEnvironment,
} from "react-relay";
import { useRecoilCallback, useRecoilState, useRecoilValue } from "recoil";
import { v4 as uuid } from "uuid";
import { Button } from "../utils";
import {
  BUTTON_STYLE,
  ButtonGroup,
  LONG_BUTTON_STYLE,
  ModalActionButtonContainer,
} from "./ShareStyledDiv";
import { activeColorEntry } from "./state";

const ColorFooter: React.FC = () => {
  const isReadOnly = useRecoilValue(fos.readOnly);
  const canEditCustomColors = useRecoilValue(fos.canEditCustomColors);
  const canEdit = useMemo(
    () => !isReadOnly && canEditCustomColors,
    [canEditCustomColors, isReadOnly]
  );
  const setColorScheme = fos.useSetSessionColorScheme();
  const [activeColorModalField, setActiveColorModalField] =
    useRecoilState(activeColorEntry);
  const [setDatasetColorScheme] =
    useMutation<foq.setDatasetColorSchemeMutation>(foq.setDatasetColorScheme);
  const colorScheme = useRecoilValue(fos.colorScheme);
  const datasetName = useRecoilValue(fos.datasetName);
  const configDefault = useRecoilValue(fos.config);
  const datasetDefault = useRecoilValue(fos.datasetAppConfig).colorScheme;
  const updateDatasetColorScheme = useUpdateDatasetColorScheme();
  const subscription = useRecoilValue(fos.stateSubscription);

  if (!activeColorModalField) return null;

  if (!datasetName) {
    throw new Error("dataset not defined");
  }

  return (
    <ModalActionButtonContainer>
      <ButtonGroup>
        <Button
          text={"Reset"}
          title={`Clear session settings and revert to default settings`}
          onClick={() => {
            setColorScheme(
              datasetDefault || {
                fields: [],
                labelTags: {},
                colorPool: configDefault.colorPool,
                colorBy: configDefault.colorBy,
                multicolorKeypoints: false,
                opacity: fos.DEFAULT_ALPHA,
                showSkeletons: true,
              }
            );
          }}
          style={BUTTON_STYLE}
        />
        {canEdit && (
          <Button
            text={"Save as default"}
            title={`Save to dataset appConfig`}
            onClick={() => {
              updateDatasetColorScheme({
                ...colorScheme,
                fields: colorScheme.fields || [],
                colorPool: colorScheme.colorPool || [],
                colorBy: colorScheme.colorBy || "field",
                multicolorKeypoints: colorScheme.multicolorKeypoints || false,
                showSkeletons: colorScheme.showSkeletons || true,
              });

              setDatasetColorScheme({
                variables: {
                  subscription,
                  datasetName,
                  colorScheme: {
                    ...colorScheme,
                    fields: colorScheme.fields || [],
                    colorPool: colorScheme.colorPool || [],
                    labelTags: colorScheme.labelTags || {},
                  },
                },
              });
              setActiveColorModalField(null);
            }}
            style={LONG_BUTTON_STYLE}
          />
        )}
        {canEdit && datasetDefault && (
          <Button
            text={"Clear default"}
            title={`Clear`}
            onClick={() => {
              updateDatasetColorScheme(null);
              setDatasetColorScheme({
                variables: { subscription, datasetName, colorScheme: null },
              });
              setColorScheme({
                fields: [],
                labelTags: {},
                colorPool: configDefault.colorPool,
              });
            }}
            style={LONG_BUTTON_STYLE}
          />
        )}
      </ButtonGroup>
    </ModalActionButtonContainer>
  );
};

const useUpdateDatasetColorScheme = () => {
  const environment = useRelayEnvironment();

  return useRecoilCallback(
    ({ snapshot }) =>
      async (colorScheme: foq.ColorSchemeInput | null) => {
        const id = (await snapshot.getPromise(fos.dataset))?.id;
        id &&
          commitLocalUpdate(environment, (store) => {
            const appConfigRecord = store
              .get<foq.datasetFragment$data>(id)
              ?.getLinkedRecord("appConfig");

            if (!appConfigRecord) {
              throw new Error("app config not found");
            }

            if (!colorScheme) {
              appConfigRecord.setValue(null, "colorScheme");
              return;
            }
            let colorSchemeRecord =
              appConfigRecord.getLinkedRecord("colorScheme");

            if (!colorSchemeRecord) {
              colorSchemeRecord = store.create(uuid(), "ColorScheme");
              appConfigRecord.setLinkedRecord(colorSchemeRecord, "colorScheme");
            }
            const fields = colorScheme?.fields?.map((field) => {
              const record = store.create(uuid(), "CustomizeColor");
              Object.entries(field).forEach((key, value) => {
                // @ts-ignore
                record.setValue(value, key);
              });

              return record;
            });

            colorSchemeRecord.setValue(colorScheme.colorBy, "colorBy");
            colorSchemeRecord.setValue(
              [...(colorScheme.colorPool || [])],
              "colorPool"
            );
            colorSchemeRecord.setLinkedRecords(fields, "fields");
            colorSchemeRecord.setValue(
              colorScheme.multicolorKeypoints,
              "multicolorKeypoints"
            );
            colorSchemeRecord.setValue(colorScheme.opacity, "opacity");
            colorSchemeRecord.setValue(
              colorScheme.showSkeletons,
              "showSkeletons"
            );
          });
      },
    [environment]
  );
};

export default ColorFooter;
