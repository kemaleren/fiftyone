"""
FiftyOne Server /select route

| Copyright 2017-2022, Voxel51, Inc.
| `voxel51.com <https://voxel51.com/>`_
|
"""
from starlette.endpoints import HTTPEndpoint
from starlette.requests import Request

from fiftyone.server.decorators import route


class Select(HTTPEndpoint):
    @route
    async def post(self, request: Request, data: dict):
        ids = data.get("ids", None)
        labels = data.get("labels", None)

        if ids is not None:
            pass

        if labels is not None:
            pass
