"""
| Copyright 2017-2024, Voxel51, Inc.
| `voxel51.com <https://voxel51.com/>`_
|
"""

from typing import Literal

import fiftyone.core.utils as fou
from pydantic.dataclasses import dataclass

threed = fou.lazy_import("fiftyone.core.threed")

COLOR_DEFAULT_GRAY = "#808080"
COLOR_DEFAULT_DARK_GRAY = "#111111"
COLOR_DEFAULT_WHITE = "#ffffff"
COLOR_DEFAULT_BLACK = "#000000"


@dataclass
class Material3D:
    """Base class for 3D materials.

    Args:
        opacity (1.0): the opacity of the material, in the range [0, 1]
        transparent (False): whether the material is transparent
        vertex_colors (False): whether the material uses vertex colors
    """

    opacity: float = 1.0
    transparent: bool = False
    vertex_colors: bool = False

    def as_dict(self):
        return {
            "_type": self.__class__.__name__,
            "opacity": self.opacity,
            "transparent": self.transparent,
            "vertexColors": self.vertex_colors,
        }

    @staticmethod
    def _from_dict(d):
        cls_name: str = d.pop("_type")
        if not cls_name.endswith("Material"):
            raise ValueError("Invalid material type")

        clz = getattr(threed, cls_name)
        return clz(**d)


@dataclass
class PointcloudMaterial(Material3D):
    """Represents a point cloud material.

    Args:
        shading_mode ("height"): the shading mode to use. Supported values are
            "height", "intensity", "rgb", and "custom"
        custom_color ("#ffffff"): a custom color to use for the point cloud.
            This is only used when `shading_mode` is "custom"
        point_size (1.0): the size of the points in the point cloud
        attenuate_by_distance (False): whether to attenuate the point size
            based on distance from the camera
    """

    shading_mode: Literal["height", "intensity", "rgb", "custom"] = "height"
    custom_color: str = COLOR_DEFAULT_WHITE
    point_size: float = 0.5
    attenuate_by_distance: bool = False

    def as_dict(self):
        return super().as_dict() | {
            "shadingMode": self.shading_mode,
            "customColor": self.custom_color,
            "pointSize": self.point_size,
            "attenuateByDistance": self.attenuate_by_distance,
        }


@dataclass
class MeshMaterial(Material3D):
    """Represents a mesh material."""

    wireframe: bool = False

    def as_dict(self):
        return super().as_dict() | {"wireframe": self.wireframe}


@dataclass
class MeshBasicMaterial(MeshMaterial):
    """Represents a basic mesh material.

    This material is not affected by lights,
    and is rendered as a solid color.

    Args:
        color ("#ffffff"): the color of the material
    """

    color: str = COLOR_DEFAULT_GRAY

    def as_dict(self):
        return super().as_dict() | {"color": self.color}


@dataclass
class MeshLambertMaterial(MeshMaterial):
    """Represents a Lambert mesh material.

    This material only takes into account diffuse reflections,
    and ignores specular reflection. This is ideal for materials
    that reflect light evenly without a glossy or shiny appearance,
    such as unpolished surfaces.

    Args:
        color ("#ffffff"): the color of the material
        emissive_color ("#000000"): the emissive color of the material.
            This is the color emitted by the material itself independent of the light.
        emissive_intensity (0.0): the intensity of the emissive color
        reflectivity (1.0): the reflectivity of the material
        refraction_ratio (0.98): the refraction ratio (IOR) of the material
    """

    color: str = COLOR_DEFAULT_GRAY
    emissive_color: str = COLOR_DEFAULT_BLACK
    emissive_intensity: float = 0.0
    reflectivity: float = 1.0
    refraction_ratio: float = 0.98

    def as_dict(self):
        return super().as_dict() | {
            "color": self.color,
            "emissiveColor": self.emissive_color,
            "emissiveIntensity": self.emissive_intensity,
            "reflectivity": self.reflectivity,
            "refractionRatio": self.refraction_ratio,
        }


@dataclass
class MeshPhongMaterial(MeshMaterial):
    """Represents a Phong mesh material.

    This material takes into account specular reflection.
    This is ideal for materials that reflect light with a glossy or shiny appearance,
    such as polished surfaces.

    Args:
        color ("#ffffff"): the color of the material
        emissive_color ("#000000"): the emissive color of the material.
        This is the color emitted by the material itself independent of the light.
        emissive_intensity (0.0): the intensity of the emissive color
        shininess (30): the shininess of the material
        reflectivity (1.0): the reflectivity of the material
        refraction_ratio (0.98): the refraction ratio of the material
    """

    color: str = COLOR_DEFAULT_GRAY
    emissive_color: str = COLOR_DEFAULT_BLACK
    emissive_intensity: float = 0.0
    shininess: float = 30.0
    specular_color: str = COLOR_DEFAULT_DARK_GRAY
    reflectivity: float = 1.0
    refraction_ratio: float = 0.98

    def as_dict(self):
        return super().as_dict() | {
            "color": self.color,
            "emissiveColor": self.emissive_color,
            "emissiveIntensity": self.emissive_intensity,
            "shininess": self.shininess,
            "specularColor": self.specular_color,
            "reflectivity": self.reflectivity,
            "refractionRatio": self.refraction_ratio,
        }


@dataclass
class MeshDepthMaterial(MeshMaterial):
    """Represents a depth mesh material.

    This material is used for drawing geometry by depth,
    where depth is based off of the camera near and far plane.
    White is nearest, black is farthest.
    """

    pass
