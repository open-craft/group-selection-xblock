"""
Group Selection XBlock.

Lets learners self-select into content groups within a course.
The XBlock is the UI layer — all selection state and cohort
assignment lives in the backend plugin (group_selection_plugin).
"""

import logging

from django.contrib.auth import get_user_model
from pydantic import ValidationError
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.exceptions import JsonHandlerError
from xblock.fields import Boolean, Dict, List, Scope, String

from group_selection_plugin.exceptions import (
    CohortCreationFailedException,
    SelectionLockedException,
)
from group_selection_plugin.services import (
    ensure_cohorts_for_block,
    get_course_content_groups,
    get_learner_selection,
    submit_selection,
)

from .types import (
    Choice,
    ContentGroup,
    LearnerInitData,
    SelectionData,
    StudioInitData,
    StudioSaveData,
    SubmitSelectionRequest,
)

logger = logging.getLogger(__name__)


@XBlock.wants("user")
class GroupSelectionXBlock(XBlock):
    """
    XBlock that allows learners to self-select into content groups.

    Author configures question text, choices mapped to content groups,
    and whether learners can change their selection. Learners see a
    selection form and are assigned to the corresponding cohort on submit.
    """

    public_dir = "static"

    display_name = String(
        display_name="Display Name",
        default="Group Selection",
        scope=Scope.settings,
    )

    question_text = String(
        display_name="Instruction",
        default="",
        scope=Scope.settings,
        help="The question or prompt that learners will see.",
    )

    choices = List(
        display_name="Choices",
        default=[],
        scope=Scope.settings,
        help="List of choice objects. Each is a dict with 'id' and 'text' keys.",
    )

    choice_group_partition_map = Dict(
        display_name="Choice to Content Group Mapping",
        default={},
        scope=Scope.settings,
        help="Maps choice IDs to {group_id, partition_id} objects.",
    )

    allow_change = Boolean(
        display_name="Allow learners to change their selection",
        default=True,
        scope=Scope.settings,
    )

    has_author_view = False
    show_in_read_only_mode = True

    # ------------------------------------------------------------------
    # Learner view
    # ------------------------------------------------------------------

    def student_view(self, context=None):
        """Render the learner-facing selection UI."""
        block_id = str(self.scope_ids.usage_id)
        fragment = Fragment()

        choices_parsed = [Choice(**c) for c in self.choices]

        # Get current selection from the plugin.
        selection = self._get_learner_selection()

        if selection is not None:
            selection_data = SelectionData(
                choice_id=selection.choice_id,
                content_group_id=selection.content_group_id,
                cohort_id=getattr(selection, "cohort_id", None),
                created=selection.created.isoformat(),
                modified=selection.modified.isoformat(),
                can_change=self.allow_change,
            )
        else:
            selection_data = None

        # Check for stale content group mappings.
        stale_mapping = self._check_stale_mappings(choices_parsed)

        init_data = LearnerInitData(
            block_id=block_id,
            question_text=self.question_text,
            choices=choices_parsed,
            selection=selection_data,
            allow_change=self.allow_change,
            handler_urls={
                "submit_selection": self.runtime.handler_url(self, "submit_selection"),
            },
        )

        fragment.add_content(
            f'<div class="group-selection-block" id="group-selection-learner-{block_id}"></div>'
        )
        fragment.add_css_url(
            self.runtime.local_resource_url(self, 'static/css/group_selection.css')
        )
        fragment.add_javascript_url(
            self.runtime.local_resource_url(self, 'static/js/group_selection_learner.js')
        )

        if stale_mapping:
            fragment.add_content(
                '<div class="group-selection-block-error">'
                "This block needs to be reconfigured by your instructor."
                "</div>"
            )

        fragment.initialize_js("GroupSelectionLearner", init_data.model_dump(mode="json"))
        return fragment

    @XBlock.json_handler
    def submit_selection(self, data, suffix=""):
        """
        Called when the learner clicks Submit.

        Expected data: {"choice_id": "uuid-string"}
        """
        try:
            validated = SubmitSelectionRequest.model_validate(data)
        except ValidationError:
            raise JsonHandlerError(400, "Invalid request data.")

        choice_id = validated.choice_id

        valid_ids = [c["id"] for c in self.choices]
        if choice_id not in valid_ids:
            return {"success": False, "error": "Invalid choice."}

        user = self._get_current_user()
        if user is None:
            return {"success": False, "error": "Could not identify user."}

        # Block role-based masquerade: when a staff user is viewing as a
        # role (not a specific student), scope_ids.user_id stays the
        # staff user.  Submissions would go to the wrong account.
        if user.is_staff and self._is_role_based_masquerade():
            return {
                "success": False,
                "error": (
                    "You are viewing as a role rather than as a specific "
                    "learner. Use 'Specific student' masquerade mode to "
                    "submit as a particular learner."
                ),
            }

        logger.info(
            "GroupSelection: submit_selection user=%s (id=%s) for block=%s",
            user.username, user.id, str(self.scope_ids.usage_id),
        )

        block_config = {
            "choices": [c["id"] for c in self.choices],
            "choice_group_partition_map": self.choice_group_partition_map,
            "allow_change": self.allow_change,
        }

        try:
            result = submit_selection(
                user=user,
                usage_key=str(self.scope_ids.usage_id),
                course_key=str(self.scope_ids.usage_id.course_key),
                choice_id=choice_id,
                block_config=block_config,
            )
        except SelectionLockedException:
            return {
                "success": False,
                "error": "Your selection is locked and cannot be changed.",
            }
        except CohortCreationFailedException:
            return {
                "success": False,
                "error": (
                    "This block is not properly configured. "
                    "Please contact your instructor."
                ),
            }
        except Exception:
            logger.exception("Group selection failed")
            return {"success": False, "error": "An unexpected error occurred."}

        return {
            "success": True,
            "choice_id": result.choice_id,
            "choice_text": self._get_choice_text(result.choice_id),
            "can_change": self.allow_change,
        }

    def _get_learner_selection(self):
        """Return the current learner's selection from the plugin, or None."""
        user = self._get_current_user()
        if user is None:
            return None

        try:
            return get_learner_selection(
                user=user,
                usage_key=str(self.scope_ids.usage_id),
            )
        except Exception:
            logger.exception("Failed to get learner selection")
            return None

    def _get_current_user(self):
        """Return the current Django user or None if unavailable."""
        try:
            user_id = self.scope_ids.user_id
            if user_id is None:
                logger.warning("scope_ids.user_id is not set")
                return None
            return get_user_model().objects.get(id=user_id)
        except Exception:
            logger.exception("Error getting current user")
            return None

    def _is_role_based_masquerade(self):
        """Check whether the current request is a role-based masquerade."""
        try:
            from crum import get_current_request
            request = get_current_request()
            if request is None:
                return False
            session = getattr(request, 'session', None)
            if session is None:
                return False
            course_key = self.scope_ids.usage_id.course_key
            masquerade_settings = session.get('masquerade_settings', {})
            masq = masquerade_settings.get(course_key) or masquerade_settings.get(str(course_key))
            if masq is not None and getattr(masq, 'user_name', None) is None:
                return True
        except Exception:
            pass
        return False

    def _get_choice_text(self, choice_id):
        """Look up the display text for a choice by its ID."""
        for c in self.choices:
            if c["id"] == choice_id:
                return c["text"]
        return ""

    # ------------------------------------------------------------------
    # Studio editor view
    # ------------------------------------------------------------------

    def studio_view(self, context=None):
        """Render the Studio editor form."""
        block_id = str(self.scope_ids.usage_id)
        fragment = Fragment()

        choices_parsed = [Choice(**c) for c in self.choices]

        content_groups = self._get_course_content_groups()

        init_data = StudioInitData(
            block_id=block_id,
            course_key=str(self.scope_ids.usage_id.course_key),
            question_text=self.question_text,
            choices=choices_parsed,
            choice_group_partition_map=self.choice_group_partition_map,
            allow_change=self.allow_change,
            content_groups=content_groups,
            handler_urls={
                "studio_submit": self.runtime.handler_url(self, "studio_submit"),
            },
        )

        fragment.add_content(
            f'<div class="group-selection-studio-root editor-with-buttons is-active" '
            f'id="group-selection-studio-{block_id}"></div>'
        )
        fragment.add_css_url(
            self.runtime.local_resource_url(
                self,
                'static/css/group_selection_studio.css'
                if self._is_legacy_studio()
                else 'static/css/group_selection.css',
            )
        )
        fragment.add_javascript_url(
            self.runtime.local_resource_url(self, 'static/js/group_selection_studio.js')
        )

        fragment.initialize_js("GroupSelectionStudio", init_data.model_dump(mode="json"))
        return fragment

    @XBlock.json_handler
    def studio_submit(self, data, suffix=""):
        """Save Studio editor form data."""
        try:
            validated = StudioSaveData.model_validate(data)
        except ValidationError as e:
            logger.exception("Invalid data received from Studio editor.")
            message = "\n".join(
                f"Field: {err['loc']}. Error: {err['msg']}"
                for err in e.errors()
            )
            raise JsonHandlerError(400, message)

        # Every choice must have a mapped content group.
        for choice in validated.choices:
            if choice.id not in validated.choice_group_partition_map:
                return {
                    "success": False,
                    "error": f"Choice '{choice.text}' has no content group assigned.",
                }

        # Mapped content groups must still exist in the course.
        available_groups = self._get_course_content_groups()
        available_ids = {
            (g.partition_id, g.group_id)
            for g in available_groups
        }
        for mapping in validated.choice_group_partition_map.values():
            if (mapping["partition_id"], mapping["group_id"]) not in available_ids:
                return {
                    "success": False,
                    "error": (
                        "Mapped content group no longer exists. "
                        "Please update your mappings."
                    ),
                }

        # Save to XBlock fields.
        self.question_text = validated.question_text
        self.choices = [c.model_dump() for c in validated.choices]
        self.choice_group_partition_map = validated.choice_group_partition_map
        self.allow_change = validated.allow_change

        # Auto-create cohorts for all mapped content groups.
        try:
            block_config = {
                "choices": [c["id"] for c in self.choices],
                "choice_group_partition_map": self.choice_group_partition_map,
            }
            course_key = self.scope_ids.usage_id.course_key
            ensure_cohorts_for_block(course_key, block_config)
        except Exception:
            logger.exception("Failed to auto-create cohorts")
            return {
                "success": False,
                "error": "Failed to set up content group assignments. Please try again.",
            }

        return {"success": True}

    def _get_course_content_groups(self):
        """
        Fetch content groups defined in the course's Group Configurations.

        Returns list of ContentGroup instances.
        """
        course_key = str(self.scope_ids.usage_id.course_key)
        try:
            groups = get_course_content_groups(course_key)
        except Exception:
            logger.exception("Could not load content groups for course %s", course_key)
            return []

        return [ContentGroup(**g) for g in groups]

    # ------------------------------------------------------------------
    # OLX / stale-mapping validation
    # ------------------------------------------------------------------

    def _check_stale_mappings(self, choices_parsed):
        """
        Check whether any choice's content group mapping is stale.

        Returns True if ANY mapped (partition_id, group_id) is missing
        from the course's current content groups (and at least one
        mapping exists). Returns False if all mappings are fresh or
        no mappings exist yet.
        """
        if not self.choice_group_partition_map:
            return False

        available_groups = self._get_course_content_groups()
        available_ids = {
            (g.partition_id, g.group_id)
            for g in available_groups
        }

        for choice in choices_parsed:
            mapping = self.choice_group_partition_map.get(choice.id)
            if mapping is not None:
                if (mapping["partition_id"], mapping["group_id"]) not in available_ids:
                    return True

        return False

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _is_legacy_studio():
        """
        Detect whether Studio is the legacy Django-template version
        rather than the MFE-based version.

        In the legacy Studio, XBlock CSS is loaded inline and can leak into
        the Studio wrapper, so we serve a prefixed stylesheet scoped under
        ``.group-selection-block``. In the MFE Studio, XBlocks render in
        iframes so the non-prefixed stylesheet is sufficient.
        """
        try:
            from django.conf import settings
            return not getattr(settings, 'ENABLE_STUDIO_MFE', False)
        except Exception:  # pragma: no cover
            # If settings aren't available, assume legacy mode (safe default).
            return True

    @staticmethod
    def workbench_scenarios():
        """Return scenarios for the XBlock SDK workbench."""
        return [
            (
                "Group Selection",
                """<vertical_demo>
                    <group_selection question_text="Which industry lens would you like?" />
                    </vertical_demo>
                """,
            ),
        ]
