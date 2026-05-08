.PHONY: build watch clean

build:
	cd group_selection_xblock/frontend && npm run build

watch:
	cd group_selection_xblock/frontend && npm run watch

clean:
	rm -rf group_selection_xblock/static/js/*.js
	rm -rf group_selection_xblock/static/css/*.css
