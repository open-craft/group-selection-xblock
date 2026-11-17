.PHONY: build watch clean requirements test test.python test.js

build:
	cd group_selection_xblock/frontend && npm run build

watch:
	cd group_selection_xblock/frontend && npm run watch

clean:
	rm -rf group_selection_xblock/static/js/*.js
	rm -rf group_selection_xblock/static/css/*.css

requirements: ## install Python and frontend test dependencies
	pip install -e '.[test]'
	cd group_selection_xblock/frontend && npm ci

test: test.python test.js ## run all tests

test.python: ## run the Python tests
	pytest

test.js: ## run the frontend (Jest) tests
	cd group_selection_xblock/frontend && npm test
