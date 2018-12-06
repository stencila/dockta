all: setup lint test build docs

setup:
	npm install

hooks:
	cp pre-commit.sh .git/hooks/pre-commit

lint:
	npm run lint

test:
	npm test

cover:
	npm run cover

build:
	npm run build
.PHONY: build

bundle:
	npm run bundle

docs:
	npm run docs
.PHONY: docs

commit:
	npm run commit

demo: demo-magic.sh
	asciinema rec -c "./demo.sh -n" --overwrite demo.cast

demo-play:
	asciinema play demo.cast

demo-upload:
	asciinema upload demo.cast

demo-magic.sh:
	curl https://raw.githubusercontent.com/nokome/demo-magic/master/demo-magic.sh > demo-magic.sh
