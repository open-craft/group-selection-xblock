# Group Selection XBlock

An Open edX XBlock that lets learners self-select into content groups within a
course. Instructors configure a question and a set of choices, each mapped to a
content group - when a learner submits their choice they are automatically
assigned to the corresponding cohort.

## Architecture

This repository is the **UI layer**. All selection state and cohort management
lives in the backend plugin (`group_selection_plugin`), which exposes a set of
service functions that this XBlock calls:

| Service function | Purpose |
|---|---|
| `get_course_content_groups` | Fetch content groups defined in Studio's Group Configurations |
| `get_learner_selection` | Read a learner's current selection + cohort assignment |
| `submit_selection` | Persist a selection and assign the learner to the matching cohort |
| `ensure_cohorts_for_block` | Auto-create cohorts for every mapped content group on save |

## Features

- **Studio editor** - add/remove choices, map each choice to a content group,
  toggle whether learners can change their selection after submitting
- **Learner view** - React + Paragon selection form with confirmation modal
- **Locking** - optionally prevent learners from changing their selection once
  made
- **Stale mapping detection** - warns learners if content groups have changed
  and the block needs reconfiguration by the instructor


## Installation

```bash
pip install group-selection-xblock
```

Then add `group_selection` to the advanced module list of your course.

### Dependencies

- Python >= 3.11
- XBlock >= 1.5.0
- pydantic >= 2.12.5
- `group_selection_plugin` (backend plugin, required at runtime)

## Usage

1. In Studio, add a **Group Selection** component to a unit.
2. Click **Edit** to open the Studio editor:
   - Set the instruction text (question prompt).
   - Add choices, each mapped to a content group from the course's Group
     Configurations.
   - Choose whether learners can change their selection after submitting.
3. Click **Save** - cohorts are auto-created for each mapped content group.
4. Learners see the selection form, pick a choice, and are assigned to the
   matching cohort on submit.


