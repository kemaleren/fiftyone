"""
Base classes for documents that back dataset contents.

| Copyright 2017-2021, Voxel51, Inc.
| `voxel51.com <https://voxel51.com/>`_
|
"""
import mongoengine
from fiftyone.core.fields import DictField, EmbeddedDocumentField, ListField

import fiftyone.core.utils as fou

from .document import MongoEngineBaseDocument
from .utils import get_implied_field_kwargs

food = fou.lazy_import("fiftyone.core.odm.dataset")


class BaseEmbeddedDocument(MongoEngineBaseDocument):
    """Base class for documents that are embedded within other documents and
    therefore are not stored in their own collection in the database.
    """

    _parent = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # pylint: disable=no-member
        for name, field in self._fields.items():
            if isinstance(field, (DictField, ListField)):
                field = field.field
            if isinstance(field, EmbeddedDocumentField):
                field.name = name

    def _set_parent(self, parent):
        self._parent = parent
        # pylint: disable=no-member
        for field in self._fields:
            if isinstance(field, (DictField, ListField)):
                field = field.field
            if isinstance(field, EmbeddedDocumentField):
                field._set_parent(parent)

    def _get_custom_fields(self):
        if not self._parent:
            return {}

        fields = getattr(self._parent, "fields", [])
        return {field.name: field for field in fields}

    def has_field(self, name):
        if super().has_field(name):
            return True

        if name in self._get_custom_fields():
            return True

        return False

    def __setattr__(self, name, value):
        custom_fields = self._get_custom_fields()
        if name in custom_fields:
            custom_fields[name].validate(value)

        super().__setattr__(name, value)

    def __setitem__(self, name, value):
        self.set_field(name, value, create=True)

    def set_field(self, name, value, create=False):
        if hasattr(self, name) and not self.has_field(name):
            raise ValueError("Cannot use reserved keyword '%s'" % name)

        if not self.has_field(name):
            if create:
                self.add_implied_field(name, value)
            else:
                raise ValueError(
                    "%s has no field '%s'" % (self.__class__, name)
                )

        setattr(self, name, value)

    def add_implied_field(self, name, value):
        """Adds the field to the document, inferring the field type from the
        provided value.

        Args:
            name: the field name
            value: the field value
        """
        if self.has_field(name):
            raise ValueError(
                "%s field '%s' already exists" % (self.__class__, name)
            )

        self.add_field(name, **get_implied_field_kwargs(value))

    def add_field(
        self,
        name,
        ftype,
        embedded_doc_type=None,
        subfield=None,
        fields=None,
        **kwargs,
    ):
        """Adds a new field to the embedded document.

        Args:
            name: the field name
            ftype: the field type to create. Must be a subclass of
                :class:`fiftyone.core.fields.Field`
            embedded_doc_type (None): the
                :class:`fiftyone.core.odm.BaseEmbeddedDocument` type of the
                field. Only applicable when ``ftype`` is
                :class:`fiftyone.core.fields.EmbeddedDocumentField`
            subfield (None): the :class:`fiftyone.core.fields.Field` type of
                the contained field. Only applicable when ``ftype`` is
                :class:`fiftyone.core.fields.ListField` or
                :class:`fiftyone.core.fields.DictField`
            fields (None): the field definitions of the
                :class:`fiftyone.core.fields.EmbeddedDocumentField`
                Only applicable when ``ftype`` is
                :class:`fiftyone.core.fields.EmbeddedDocumentField`
        """
        self._add_field_schema(
            name,
            ftype,
            embedded_doc_type=embedded_doc_type,
            subfield=subfield,
            fields=fields,
            **kwargs,
        )

    def _add_field_schema(
        self, name, ftype, embedded_doc_type=None, subfield=None, **kwargs,
    ):
        if self.has_field(name):
            raise ValueError(
                "%s field '%s' already exists" % (self.__class__, name)
            )

        field = food.create_field(
            name,
            ftype,
            embedded_doc_type=embedded_doc_type,
            subfield=subfield,
            **kwargs,
        )
        print(field.name, field)
        self._declare_field(field)

    def _declare_field(self, field):
        if self._parent is not None:
            self._parent._save_field(field, [field.name])


class EmbeddedDocument(MongoEngineBaseDocument, mongoengine.EmbeddedDocument):
    """Base class for documents that are embedded within other documents and
    therefore are not stored in their own collection in the database.
    """

    meta = {"abstract": True}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.validate()


class DynamicEmbeddedDocument(
    BaseEmbeddedDocument, mongoengine.DynamicEmbeddedDocument,
):
    """Base class for dynamic documents that are embedded within other
    documents and therefore aren't stored in their own collection in the
    database.

    Dynamic documents can have arbitrary fields added to them.
    """

    meta = {"abstract": True}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.validate()
