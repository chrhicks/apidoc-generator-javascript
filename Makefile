APP_NAME = apidoc-javascript-generator
DOCKER_USERNAME = chrhicks
VERSION = development
CURRENT_VERSION = $(shell node -p "require('./package.json').version")

release: set-npm-version docker-release git-post-release

release-patch: set-patch-version release

release-minor: set-minor-version release

release-major: set-major-version release

docker-build:
	docker build -t $(DOCKER_USERNAME)/$(APP_NAME):$(VERSION) .

docker-push:
	docker push $(DOCKER_USERNAME)/$(APP_NAME):$(VERSION)

docker-release: docker-build docker-push

set-patch-version:
	$(eval VERSION := $(shell semver -i patch $(CURRENT_VERSION)))
	@echo "Setting version to $(VERSION)."

set-minor-version:
	$(eval VERSION := $(shell semver -i minor $(CURRENT_VERSION)))
	@echo "Setting version to $(VERSION)."

set-major-version:
	$(eval VERSION := $(shell semver -i major $(CURRENT_VERSION)))
	@echo "Setting version to $(VERSION)."

set-npm-version:
	@echo "Updating package.json"
	@npm --git-tag-version=false version $(VERSION) > /dev/null 2>&1

git-post-release:
	@echo "Adding updated files to git, comitting and tagging"
	@git add package.json
	@git commit -m "Releasing version $(VERSION)"
	@git tag -a $(VERSION) -m $(VERSION)
	@git push origin --tags
	@git push origin master
