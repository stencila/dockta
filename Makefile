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

docs:
	npm run docs
.PHONY: docs

commit:
	npm run commit

# Create a demo by running the `demo.sh` file.
# Generates a `demo.cast` file
demo: demo-magic.sh
	asciinema rec -c "./demo.sh -n" --overwrite demo.cast

# Play the last recorded demo
demo-play:
	asciinema play demo.cast

# Upload the last recorded demo
demo-upload:
	asciinema upload demo.cast

# Download the `demo-magic.sh` script.
demo-magic.sh:
	curl https://raw.githubusercontent.com/paxtonhare/demo-magic/master/demo-magic.sh > demo-magic.sh

# Create an animated GIF of the demo.
# Note: this can be memory intensive for long demos; you probably only
# want to do this for short demos.
demo-gif:
	docker run --rm -v $$PWD:/data asciinema/asciicast2gif demo.cast demo.gif
