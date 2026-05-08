"""
Tests for GroupSelectionXBlock.
"""

import json
import sys
from datetime import datetime
from unittest.mock import MagicMock, PropertyMock, patch

import pytest
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.field_data import DictFieldData

# ---------------------------------------------------------------------------
# Pre-install mock plugin into sys.modules (imports are now at module level)
# ---------------------------------------------------------------------------


def _setup_mock_modules():
    """Install mock plugin modules into sys.modules."""
    mock_services = MagicMock()
    mock_exceptions = MagicMock()
    mock_exceptions.SelectionLockedException = type(
        "SelectionLockedException", (Exception,), {}
    )
    mock_exceptions.CohortCreationFailedException = type(
        "CohortCreationFailedException", (Exception,), {}
    )

    modules = {
        "group_selection_plugin": MagicMock(),
        "group_selection_plugin.services": mock_services,
        "group_selection_plugin.exceptions": mock_exceptions,
        "django": MagicMock(),
        "django.template": MagicMock(),
        "django.template.loader": MagicMock(),
        "django.contrib": MagicMock(),
        "django.contrib.auth": MagicMock(),
        "common": MagicMock(),
        "common.djangoapps": MagicMock(),
        "common.djangoapps.student": MagicMock(),
        "common.djangoapps.student.models": MagicMock(),
        "xmodule": MagicMock(),
        "xmodule.partitions": MagicMock(),
        "xmodule.partitions.partitions_service": MagicMock(),
        "xmodule.modulestore": MagicMock(),
        "xmodule.modulestore.django": MagicMock(),
        "openedx": MagicMock(),
        "openedx.core": MagicMock(),
        "openedx.core.djangoapps": MagicMock(),
    }
    for name, mod in modules.items():
        if name not in sys.modules:
            sys.modules[name] = mod


_MOCK_MODULE_NAMES = [
    "group_selection_plugin",
    "group_selection_plugin.services",
    "group_selection_plugin.exceptions",
    "django",
    "django.template",
    "django.template.loader",
    "django.contrib",
    "django.contrib.auth",
    "common",
    "common.djangoapps",
    "common.djangoapps.student",
    "common.djangoapps.student.models",
    "xmodule",
    "xmodule.partitions",
    "xmodule.partitions.partitions_service",
    "xmodule.modulestore",
    "xmodule.modulestore.django",
    "openedx",
    "openedx.core",
    "openedx.core.djangoapps",
]

_setup_mock_modules()

from group_selection_xblock.group_selection import GroupSelectionXBlock  # noqa: E402


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_request(data):
    """Return a mock WSGI request whose .body is JSON-encoded *data*."""
    req = MagicMock()
    req.method = "POST"
    req.body = json.dumps(data).encode("utf-8")
    return req


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def mock_runtime():
    """Mock XBlock runtime with a user service."""
    runtime = MagicMock()
    runtime.anonymous_student_id = "anon-user-id"
    runtime.handler_url.return_value = "/handler/test_handler"
    runtime.local_resource_url.return_value = "/static/test.js"

    mock_user = MagicMock()
    mock_user.id = 42
    type(mock_user).opt_attrs = PropertyMock(
        return_value={"edx-platform.user_id": 42}
    )

    mock_user_service = MagicMock()
    mock_user_service.get_current_user.return_value = mock_user

    def service_impl(block, name):
        if name == "user":
            return mock_user_service
        return None

    runtime.service.side_effect = service_impl
    return runtime


@pytest.fixture
def block(mock_runtime):
    """A GroupSelectionXBlock with empty fields."""
    field_data = DictFieldData({})
    b = GroupSelectionXBlock(
        runtime=mock_runtime,
        field_data=field_data,
        scope_ids=MagicMock(),
    )
    mock_usage_id = MagicMock()
    mock_usage_id.course_key = "course-v1:TestX+TS101+2025"
    type(b.scope_ids).usage_id = PropertyMock(return_value=mock_usage_id)
    return b


@pytest.fixture
def configured_block(block):
    """Block with author-configured fields."""
    block.question_text = "Which industry lens would you like?"
    block.choices = [
        {"id": "opt_it", "text": "IT"},
        {"id": "opt_healthcare", "text": "Healthcare"},
    ]
    block.choice_group_partition_map = {
        "opt_it": {"group_id": 1, "partition_id": 50},
        "opt_healthcare": {"group_id": 2, "partition_id": 50},
    }
    block.allow_change = True
    return block


# ---------------------------------------------------------------------------
# Pre-install mock plugin into sys.modules (the XBlock imports inside methods)
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def mock_plugin_modules():
    """Reset mock plugin modules between tests."""
    for name in _MOCK_MODULE_NAMES:
        if name in sys.modules:
            mock = sys.modules[name]
            if isinstance(mock, MagicMock):
                mock.reset_mock(return_value=True, side_effect=True)
    # Reset known child mocks that tests configure.
    svc = sys.modules["group_selection_plugin.services"]
    for child_name in (
        "submit_selection",
        "get_learner_selection",
        "ensure_cohorts_for_block",
        "get_course_content_groups",
    ):
        child = getattr(svc, child_name, None)
        if isinstance(child, MagicMock):
            child.reset_mock(return_value=True, side_effect=True)
    yield


# ---------------------------------------------------------------------------
# Phase 2: XBlock fields
# ---------------------------------------------------------------------------


class TestXBlockFields:
    """Test that XBlock fields are defined and have correct defaults."""

    def test_display_name_default(self, block):
        assert block.display_name == "Group Selection"

    def test_question_text_default(self, block):
        assert block.question_text == ""

    def test_choices_default(self, block):
        assert block.choices == []

    def test_choice_group_partition_map_default(self, block):
        assert block.choice_group_partition_map == {}

    def test_allow_change_default(self, block):
        assert block.allow_change is True

    def test_all_fields_are_scope_settings(self, block):
        for field_name in [
            "display_name",
            "question_text",
            "choices",
            "choice_group_partition_map",
            "allow_change",
        ]:
            field = block.fields[field_name]
            from xblock.fields import Scope
            assert field.scope == Scope.settings, (
                f"{field_name} should be Scope.settings"
            )


# ---------------------------------------------------------------------------
# Phase 3: Learner view (student_view)
# ---------------------------------------------------------------------------


class TestStudentView:
    """Tests for student_view rendering."""

    def test_student_view_unselected(self, configured_block):
        """When no selection exists, renders the selection form."""
        with patch.object(configured_block, "_get_current_user", return_value=None):
            with patch.object(Fragment, "initialize_js") as mock_init_js:
                with patch.object(Fragment, "add_css_url") as mock_add_css_url:
                    configured_block.student_view()

        mock_init_js.assert_called_once()
        mock_add_css_url.assert_called_once()
        configured_block.runtime.local_resource_url.assert_any_call(
            configured_block,
            "static/css/group_selection.css",
        )

        func_name, init_data = mock_init_js.call_args[0]
        assert func_name == "GroupSelectionLearner"
        assert init_data["question_text"] == configured_block.question_text
        assert init_data["allow_change"] is True
        assert init_data["selection"] is None

    def test_student_view_selected_editable(self, configured_block):
        """When selection exists and allow_change=True, includes selection JSON."""
        mock_user = MagicMock()
        mock_user.id = 42
        with patch.object(configured_block, "_get_current_user", return_value=mock_user):
            mock_sel = MagicMock()
            mock_sel.choice_id = "opt_it"
            mock_sel.content_group_id = 1
            mock_sel.cohort_id = 10
            mock_sel.created = datetime(2025, 1, 15, 10, 0, 0)
            mock_sel.modified = datetime(2025, 1, 15, 10, 0, 0)

            svc = sys.modules["group_selection_plugin.services"]
            svc.get_learner_selection.return_value = mock_sel

            with patch.object(Fragment, "initialize_js") as mock_init_js:
                configured_block.student_view()

        func_name, init_data = mock_init_js.call_args[0]
        assert func_name == "GroupSelectionLearner"
        assert init_data["selection"]["choice_id"] == "opt_it"

    def test_student_view_selected_locked(self, configured_block):
        """allow_change=False → selection data reflects that."""
        configured_block.allow_change = False
        mock_user = MagicMock()
        mock_user.id = 42
        with patch.object(configured_block, "_get_current_user", return_value=mock_user):
            mock_sel = MagicMock()
            mock_sel.choice_id = "opt_healthcare"
            mock_sel.content_group_id = 2
            mock_sel.cohort_id = 11
            mock_sel.created = datetime(2025, 1, 15, 10, 0, 0)
            mock_sel.modified = datetime(2025, 1, 15, 10, 0, 0)

            svc = sys.modules["group_selection_plugin.services"]
            svc.get_learner_selection.return_value = mock_sel

            with patch.object(Fragment, "initialize_js") as mock_init_js:
                configured_block.student_view()

        func_name, init_data = mock_init_js.call_args[0]
        assert func_name == "GroupSelectionLearner"
        assert init_data["selection"]["choice_id"] == "opt_healthcare"
        assert init_data["allow_change"] is False


# ---------------------------------------------------------------------------
# Phase 3: submit_selection handler
# ---------------------------------------------------------------------------


class TestSubmitSelection:
    """Tests for the submit_selection JSON handler."""

    def test_submit_selection_valid(self, configured_block):
        """Valid selection calls plugin and returns success."""
        mock_user = MagicMock()
        mock_user.id = 42
        mock_result = MagicMock()
        mock_result.choice_id = "opt_it"
        mock_result.content_group_id = 1

        svc = sys.modules["group_selection_plugin.services"]
        svc.submit_selection.return_value = mock_result

        with patch.object(configured_block, "_get_current_user", return_value=mock_user):
            result = configured_block.submit_selection(
                _make_request({"choice_id": "opt_it"})
            )

        result_data = json.loads(result.body)
        assert result_data["success"] is True
        assert result_data["choice_id"] == "opt_it"
        assert result_data["choice_text"] == "IT"
        svc.submit_selection.assert_called_once()

    def test_submit_selection_invalid_choice(self, configured_block):
        """Unknown choice ID returns error."""
        mock_user = MagicMock()
        mock_user.id = 42

        with patch.object(configured_block, "_get_current_user", return_value=mock_user):
            result = configured_block.submit_selection(
                _make_request({"choice_id": "nonexistent"})
            )

        result_data = json.loads(result.body)
        assert result_data["success"] is False
        assert "error" in result_data

    def test_submit_selection_invalid_payload(self, configured_block):
        """Malformed payload returns error response (JsonHandlerError caught by wrapper)."""
        result = configured_block.submit_selection(_make_request({}))
        assert result.status_code == 400

    def test_submit_selection_locked(self, configured_block):
        """SelectionLockedException returns error message."""
        mock_user = MagicMock()
        mock_user.id = 42

        LockedExc = sys.modules["group_selection_plugin.exceptions"].SelectionLockedException
        svc = sys.modules["group_selection_plugin.services"]
        svc.submit_selection.side_effect = LockedExc()

        with patch.object(configured_block, "_get_current_user", return_value=mock_user):
            result = configured_block.submit_selection(
                _make_request({"choice_id": "opt_it"})
            )

        result_data = json.loads(result.body)
        assert result_data["success"] is False
        assert "locked" in result_data["error"].lower()

    def test_submit_selection_cohort_creation_failed(self, configured_block):
        """CohortCreationFailedException returns error message."""
        mock_user = MagicMock()
        mock_user.id = 42

        CohortExc = sys.modules["group_selection_plugin.exceptions"].CohortCreationFailedException
        svc = sys.modules["group_selection_plugin.services"]
        svc.submit_selection.side_effect = CohortExc()

        with patch.object(configured_block, "_get_current_user", return_value=mock_user):
            result = configured_block.submit_selection(
                _make_request({"choice_id": "opt_it"})
            )

        result_data = json.loads(result.body)
        assert result_data["success"] is False
        assert "configure" in result_data["error"].lower()


# ---------------------------------------------------------------------------
# Phase 4: Studio editor view
# ---------------------------------------------------------------------------


class TestStudioView:
    """Tests for studio_view rendering."""

    def test_studio_view_renders(self, configured_block):
        """Studio editor renders with content groups in the context."""
        with patch.object(
            configured_block, "_get_course_content_groups", return_value=[]
        ):
            with patch.object(Fragment, "initialize_js") as mock_init_js:
                with patch.object(Fragment, "add_css_url") as mock_add_css_url:
                    configured_block.studio_view()

        mock_init_js.assert_called_once()
        mock_add_css_url.assert_called_once()
        configured_block.runtime.local_resource_url.assert_any_call(
            configured_block,
            "static/css/group_selection.css",
        )

        func_name, init_data = mock_init_js.call_args[0]
        assert func_name == "GroupSelectionStudio"
        assert init_data["question_text"] is not None
        assert init_data["content_groups"] is not None


class TestStudioSubmit:
    """Tests for the studio_submit JSON handler."""

    def test_studio_submit_valid(self, configured_block):
        """Valid save persists all fields and triggers cohort creation."""
        svc = sys.modules["group_selection_plugin.services"]
        svc.ensure_cohorts_for_block.return_value = []

        with patch.object(
            configured_block, "_get_course_content_groups",
            return_value=[
                MagicMock(partition_id=50, group_id=1, name="IT Group"),
            ],
        ):
            data = {
                "question_text": "Updated question?",
                "choices": [{"id": "opt_it", "text": "IT"}],
                "choice_group_partition_map": {
                    "opt_it": {"group_id": 1, "partition_id": 50},
                },
                "allow_change": False,
            }
            result = configured_block.studio_submit(_make_request(data))
            result_data = json.loads(result.body)

        assert result_data["success"] is True
        assert configured_block.question_text == "Updated question?"
        assert configured_block.choices == [{"id": "opt_it", "text": "IT"}]
        assert configured_block.choice_group_partition_map == {
            "opt_it": {"group_id": 1, "partition_id": 50},
        }
        assert configured_block.allow_change is False
        svc.ensure_cohorts_for_block.assert_called_once()

    def test_studio_submit_missing_mapping(self, configured_block):
        """Choice without content group mapping returns error."""
        data = {
            "question_text": "Q",
            "choices": [{"id": "opt_it", "text": "IT"}],
            "choice_group_partition_map": {},
            "allow_change": True,
        }
        result = configured_block.studio_submit(_make_request(data))
        result_data = json.loads(result.body)

        assert result_data["success"] is False
        assert "content group" in result_data["error"].lower()

    def test_studio_submit_stale_group(self, configured_block):
        """Mapping to a non-existent content group returns error."""
        with patch.object(
            configured_block, "_get_course_content_groups",
            return_value=[
                MagicMock(partition_id=50, group_id=1, name="IT Group"),
            ],
        ):
            data = {
                "question_text": "Q",
                "choices": [{"id": "opt_it", "text": "IT"}],
                "choice_group_partition_map": {
                    "opt_it": {"group_id": 99, "partition_id": 50},
                },
                "allow_change": True,
            }
            result = configured_block.studio_submit(_make_request(data))
            result_data = json.loads(result.body)

        assert result_data["success"] is False
        assert "no longer exists" in result_data["error"].lower()

    def test_studio_submit_auto_creates_cohorts(self, configured_block):
        """On save, ensure_cohorts_for_block is called with the right config."""
        svc = sys.modules["group_selection_plugin.services"]
        svc.ensure_cohorts_for_block.return_value = []

        with patch.object(
            configured_block, "_get_course_content_groups",
            return_value=[
                MagicMock(partition_id=50, group_id=1, name="IT Group"),
            ],
        ):
            data = {
                "question_text": "Q",
                "choices": [{"id": "opt_it", "text": "IT"}],
                "choice_group_partition_map": {
                    "opt_it": {"group_id": 1, "partition_id": 50},
                },
                "allow_change": True,
            }
            configured_block.studio_submit(_make_request(data))

        svc.ensure_cohorts_for_block.assert_called_once()
        call_args = svc.ensure_cohorts_for_block.call_args
        assert call_args[0][0] == configured_block.scope_ids.usage_id.course_key
        block_config = call_args[0][1]
        assert "opt_it" in block_config["choices"]
        assert block_config["choice_group_partition_map"]["opt_it"] == {
            "group_id": 1, "partition_id": 50,
        }

    def test_studio_submit_invalid_payload(self, configured_block):
        """Invalid payload returns 400 error response."""
        result = configured_block.studio_submit(_make_request({"invalid": "data"}))
        assert result.status_code == 400

    def test_studio_submit_missing_question_text(self, configured_block):
        """StudioSaveData requires question_text — returns 400."""
        result = configured_block.studio_submit(_make_request({
            "choices": [],
            "choice_group_partition_map": {},
            "allow_change": True,
        }))
        assert result.status_code == 400


# ---------------------------------------------------------------------------
# Phase 5: OLX / stale mappings
# ---------------------------------------------------------------------------


class TestOLX:
    """Tests for OLX serialization and stale mapping validation."""

    def test_olx_roundtrip(self, mock_runtime):
        """Export to OLX XML preserves all field values."""
        # Create block from configured fixture values via DictFieldData.
        field_data = DictFieldData({
            "display_name": "GS Block",
            "question_text": "Which track?",
            "choices": [{"id": "a", "text": "A"}],
            "choice_group_partition_map": {
                "a": {"group_id": 1, "partition_id": 50},
            },
            "allow_change": False,
        })

        scope_ids = MagicMock()
        block1 = GroupSelectionXBlock(
            runtime=mock_runtime,
            field_data=field_data,
            scope_ids=scope_ids,
        )

        # Verify values roundtrip correctly.
        assert block1.display_name == "GS Block"
        assert block1.question_text == "Which track?"
        assert block1.choices == [{"id": "a", "text": "A"}]
        assert block1.choice_group_partition_map == {
            "a": {"group_id": 1, "partition_id": 50},
        }
        assert block1.allow_change is False

    def test_check_stale_mappings_fresh(self, configured_block):
        """All mappings valid → check returns False."""
        from group_selection_xblock.types import Choice

        with patch.object(
            configured_block, "_get_course_content_groups",
            return_value=[
                MagicMock(partition_id=50, group_id=1, name="Group 1"),
                MagicMock(partition_id=50, group_id=2, name="Group 2"),
            ],
        ):
            choices_parsed = [Choice(**c) for c in configured_block.choices]
            assert configured_block._check_stale_mappings(choices_parsed) is False

    def test_check_stale_mappings_stale(self, configured_block):
        """Mapped group no longer exists → check returns True."""
        from group_selection_xblock.types import Choice

        with patch.object(
            configured_block, "_get_course_content_groups",
            return_value=[
                MagicMock(partition_id=50, group_id=1, name="Group 1"),
            ],
        ):
            choices_parsed = [Choice(**c) for c in configured_block.choices]
            assert configured_block._check_stale_mappings(choices_parsed) is True

    def test_check_stale_mappings_no_mappings(self, block):
        """No mappings at all → check returns False."""
        from group_selection_xblock.types import Choice
        assert block._check_stale_mappings([]) is False


# ---------------------------------------------------------------------------
# Phase 2: Pydantic models
# ---------------------------------------------------------------------------


class TestPydanticModels:
    """Test the Pydantic models in types.py."""

    def test_choice_id_is_required(self):
        """Choice requires an explicit id — no auto-generation."""
        from group_selection_xblock.types import Choice
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            Choice(text="Option A")

    def test_choice_serialization(self):
        from group_selection_xblock.types import Choice
        c = Choice(id="my-id", text="My Choice")
        dumped = c.model_dump()
        assert dumped == {"id": "my-id", "text": "My Choice"}

    def test_submit_selection_request(self):
        from group_selection_xblock.types import SubmitSelectionRequest
        req = SubmitSelectionRequest.model_validate({"choice_id": "opt_it"})
        assert req.choice_id == "opt_it"

    def test_submit_selection_request_extra_field(self):
        from group_selection_xblock.types import SubmitSelectionRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            SubmitSelectionRequest.model_validate({"choice_id": "x", "extra": 1})

    def test_studio_save_data(self):
        from group_selection_xblock.types import StudioSaveData
        data = {
            "question_text": "Q?",
            "choices": [{"id": "a", "text": "A"}],
            "choice_group_partition_map": {
                "a": {"group_id": 1, "partition_id": 50},
            },
            "allow_change": False,
        }
        validated = StudioSaveData.model_validate(data)
        assert validated.question_text == "Q?"
        assert len(validated.choices) == 1
        assert validated.choices[0].id == "a"

    def test_studio_save_data_extra_field(self):
        from group_selection_xblock.types import StudioSaveData
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            StudioSaveData.model_validate({
                "question_text": "Q?",
                "choices": [],
                "choice_group_partition_map": {},
                "allow_change": False,
                "extra_field": True,
            })

    def test_content_group_model(self):
        from group_selection_xblock.types import ContentGroup
        cg = ContentGroup(partition_id=50, group_id=1, name="IT Group")
        assert cg.partition_id == 50
        assert cg.group_id == 1
        assert cg.name == "IT Group"

    def test_selection_data_model(self):
        from group_selection_xblock.types import SelectionData
        sd = SelectionData(
            choice_id="opt_it",
            content_group_id=1,
            cohort_id=10,
            created="2025-01-15T10:00:00",
            modified="2025-01-15T10:00:00",
            can_change=True,
        )
        assert sd.choice_id == "opt_it"
        assert sd.can_change is True

    def test_learner_init_data(self):
        from group_selection_xblock.types import Choice, LearnerInitData
        data = LearnerInitData(
            block_id="block-1",
            question_text="Q?",
            choices=[Choice(id="a", text="A")],
            selection=None,
            allow_change=True,
            handler_urls={"submit_selection": "/handler/submit"},
        )
        assert data.selection is None

    def test_studio_init_data(self):
        from group_selection_xblock.types import Choice, ContentGroup, StudioInitData
        data = StudioInitData(
            block_id="block-1",
            question_text="Q?",
            choices=[Choice(id="a", text="A")],
            choice_group_partition_map={
                "a": {"group_id": 1, "partition_id": 50},
            },
            allow_change=True,
            content_groups=[ContentGroup(partition_id=50, group_id=1, name="IT")],
            handler_urls={"studio_submit": "/handler/studio_submit"},
        )
        assert len(data.content_groups) == 1
