import { useLoader } from "@react-three/fiber";
import React, { useEffect, useMemo } from "react";
import { Mesh, MeshPhongMaterial } from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { ObjReturnType } from "../hooks";
import { getColorFromPoolBasedOnHash } from "../utils";
import { getIdentifierForAsset, getVisibilityMapFromFo3dParsed } from "./utils";

type ObjsProps = {
  objs: ObjReturnType[];
  visibilityMap: ReturnType<typeof getVisibilityMapFromFo3dParsed>;
};

const ObjMeshDefaultMaterial = ({ obj }: { obj: ObjReturnType }) => {
  const { objUrl, position, quaternion, scale } = obj;
  const mesh = useLoader(OBJLoader, objUrl);

  useEffect(() => {
    if (!mesh) {
      return;
    }

    mesh.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = new MeshPhongMaterial({
          color: getColorFromPoolBasedOnHash(objUrl),
        });
      }
    });
  }, [mesh]);

  return (
    <primitive
      object={mesh}
      position={position}
      quaternion={quaternion}
      scale={scale}
    />
  );
};

const ObjMeshWithCustomMaterial = ({ obj }: { obj: ObjReturnType }) => {
  const { objUrl, mtlUrl, position, quaternion, scale } = obj;

  const materials = useLoader(MTLLoader, mtlUrl);
  const mesh = useLoader(OBJLoader, objUrl, (loader) => {
    if (mtlUrl) {
      materials.preload();
      loader.setMaterials(materials);
    }
  });

  return (
    <primitive
      object={mesh}
      position={position}
      quaternion={quaternion}
      scale={scale}
    />
  );
};

export const Objs = ({ objs, visibilityMap }: ObjsProps) => {
  const objMeshes = useMemo(() => {
    return objs
      .filter((obj) => visibilityMap[getIdentifierForAsset(obj)])
      .map((obj) => {
        return (
          <group key={obj.objUrl}>
            <ObjErrorBoundary>
              {obj.mtlUrl ? (
                <ObjMeshWithCustomMaterial obj={obj} />
              ) : (
                <ObjMeshDefaultMaterial obj={obj} />
              )}
            </ObjErrorBoundary>
          </group>
        );
      });
  }, [objs, visibilityMap]);

  return <group>{objMeshes}</group>;
};

// create error boundary for individual mesh
class ObjErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      // todo: add indicator in canvas that asset failed loading
      return null;
    }

    // @ts-ignore
    return this.props.children;
  }
}