import SettingsIcon from "@mui/icons-material/Settings";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useControls } from "leva";
import { useEffect, useMemo } from "react";
import {
  FbxAsset,
  FoScene,
  FoSceneNode,
  GltfAsset,
  ObjAsset,
  PcdAsset,
  PlyAsset,
  StlAsset,
} from "../hooks";
import { AssetErrorBoundary } from "./AssetErrorBoundary";
import { AssetWrapper } from "./AssetWrapper";
import { Fbx } from "./Fbx";
import { Gltf } from "./Gltf";
import { Obj } from "./Obj";
import { Pcd } from "./Pcd";
import { Ply } from "./Ply";
import { Stl } from "./Stl";
import {
  getLabelForSceneNode,
  getNodeFromSceneByName,
  getVisibilityMapFromFo3dParsed,
} from "./utils";

import { useRecoilState } from "recoil";
import { VOXEL51_THEME_COLOR } from "../constants";
import { activeNodeAtom, currentVisibilityMapAtom } from "../state";
import { booleanButton } from "./leva-plugins/boolean-button";

interface FoSceneProps {
  scene: FoScene;
}

const getAssetForNode = (node: FoSceneNode) => {
  if (!node.asset) {
    return null;
  }

  const label = getLabelForSceneNode(node);

  let jsx: JSX.Element = null;
  const key = `${label}-${node.position.x}-${node.position.y}-${node.position.z}`;

  if (node.asset instanceof ObjAsset) {
    jsx = (
      <Obj
        key={key}
        name={node.name}
        obj={node.asset as ObjAsset}
        position={node.position}
        quaternion={node.quaternion}
        scale={node.scale}
      />
    );
  } else if (node.asset instanceof PcdAsset) {
    jsx = (
      <Pcd
        key={key}
        name={node.name}
        pcd={node.asset as PcdAsset}
        position={node.position}
        quaternion={node.quaternion}
        scale={node.scale}
      />
    );
  } else if (node.asset instanceof PlyAsset) {
    jsx = (
      <Ply
        key={key}
        name={node.name}
        ply={node.asset as PlyAsset}
        position={node.position}
        quaternion={node.quaternion}
        scale={node.scale}
      />
    );
  } else if (node.asset instanceof StlAsset) {
    jsx = (
      <Stl
        key={key}
        name={node.name}
        stl={node.asset as StlAsset}
        position={node.position}
        quaternion={node.quaternion}
        scale={node.scale}
      />
    );
  } else if (node.asset instanceof GltfAsset) {
    jsx = (
      <Gltf
        key={key}
        name={node.name}
        gltf={node.asset as GltfAsset}
        position={node.position}
        quaternion={node.quaternion}
        scale={node.scale}
      />
    );
  } else if (node.asset instanceof FbxAsset) {
    jsx = (
      <Fbx
        key={key}
        name={node.name}
        fbx={node.asset as FbxAsset}
        position={node.position}
        quaternion={node.quaternion}
        scale={node.scale}
      />
    );
  }

  if (!jsx) {
    return null;
  }

  return (
    <AssetWrapper key={jsx.key} node={node}>
      <AssetErrorBoundary>{jsx}</AssetErrorBoundary>
    </AssetWrapper>
  );
};

const getR3fNodeFromFo3dNode = (
  node: FoSceneNode,
  visibilityMap: ReturnType<typeof getVisibilityMapFromFo3dParsed>
) => {
  const label = getLabelForSceneNode(node);

  // todo: should we still "shadow render" asset when visibility is off?
  // check for perforamance trade-offs to see if this is the right way to handle visibility
  if (Boolean(visibilityMap[label]) === false) {
    return null;
  }

  const jsx = getAssetForNode(node);

  if (!node.children || node.children.length === 0) {
    return jsx;
  }

  return (
    <group
      key={`${label}-${node.position.x}-${node.position.y}-${node.position.z}`}
      position={node.position}
      quaternion={node.quaternion}
      scale={node.scale}
    >
      {jsx && jsx}
      {node.children.map((child) =>
        getR3fNodeFromFo3dNode(child, visibilityMap)
      )}
    </group>
  );
};

const getR3fSceneFromFo3dScene = (
  scene: FoScene,
  visibilityMap: ReturnType<typeof getVisibilityMapFromFo3dParsed>
) => {
  return (
    <group
      position={scene.position}
      quaternion={scene.quaternion}
      scale={scene.scale}
    >
      {scene.children.map((child) => {
        return getR3fNodeFromFo3dNode(child, visibilityMap);
      })}
    </group>
  );
};

export const FoSceneComponent = ({ scene }: FoSceneProps) => {
  const defaultVisibilityMap = useMemo(
    () => getVisibilityMapFromFo3dParsed(scene),
    [scene]
  );

  const [activeNode, setActiveNode] = useRecoilState(activeNodeAtom);
  const activeNodeName = useMemo(() => activeNode?.name, [activeNode]);

  const [visibilityMap, setVisibilityMap] = useRecoilState(
    currentVisibilityMapAtom
  );

  useEffect(() => {
    if (
      scene &&
      defaultVisibilityMap &&
      Object.entries(defaultVisibilityMap).length > 0 &&
      (!visibilityMap || Object.entries(visibilityMap).length === 0)
    ) {
      setVisibilityMap(defaultVisibilityMap);
    }
  }, [scene, visibilityMap, defaultVisibilityMap]);

  const levaControls = useMemo(() => {
    if (
      !scene ||
      !visibilityMap ||
      Object.entries(visibilityMap).length === 0
    ) {
      return {};
    }

    const controls = {};

    for (const nodeName of Object.keys(defaultVisibilityMap)) {
      controls[nodeName] = booleanButton({
        checked: visibilityMap[nodeName],
        onCheckboxChange: (checked) => {
          setVisibilityMap((prev) => {
            return { ...prev, [nodeName]: checked };
          });
        },
        onClick: ({ checked }) => {
          if (checked) {
            setActiveNode((prev) =>
              !prev ? getNodeFromSceneByName(scene, nodeName) : null
            );
          }
        },
        buttonStyles:
          nodeName === activeNodeName
            ? { color: VOXEL51_THEME_COLOR, opacity: 1 }
            : { opacity: 0.7 },
        icon:
          nodeName === activeNodeName ? (
            <SettingsIcon />
          ) : (
            <SettingsOutlinedIcon />
          ),
      });
    }

    return controls;
  }, [activeNodeName, defaultVisibilityMap, visibilityMap, scene]);

  useControls("Visibility", levaControls ?? {}, [levaControls]);

  const sceneR3f = useMemo(() => {
    if (!scene) {
      return null;
    }

    const r3fScene = getR3fSceneFromFo3dScene(scene, visibilityMap);
    return r3fScene;
  }, [scene, visibilityMap]);

  if (!sceneR3f) {
    return null;
  }

  return sceneR3f;
};
