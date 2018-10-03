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

docs:
	npm run docs
.PHONY: docs
