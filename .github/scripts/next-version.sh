#!/usr/bin/env bash
# Compute the next release version from git tags and the head commit subject.
#
# Same scheme as the i-want-my-mtg and scry repos: with squash merges the head
# commit subject on main is the PR title, so the PR title decides the bump:
#   feat: / feat(scope):            -> minor
#   anything else (fix:, docs:, ..) -> patch
#   ! before the colon (feat!:) or at the end of the title -> major
#
# Git tags are the source of truth. package.json stays at its 0.0.0-dev
# placeholder and is stamped from this version at publish time (see ci.yml),
# so the version never needs to be hand-edited and can't drift across files.
#
# Continuity: this repo's historical tags carry a leading "v" (v0.3.1). The
# regex tolerates that prefix so the floor is read correctly; new tags are
# emitted WITHOUT the prefix to match the sibling repos.
#
# Idempotent: if HEAD is already tagged (e.g. a workflow re-run after the tag
# job), that tag is reused instead of bumping again.
#
# Prints "version=X.Y.Z" (suitable for $GITHUB_OUTPUT).
set -euo pipefail

semver='^v?[0-9]+\.[0-9]+\.[0-9]+$'

existing=$(git tag --points-at HEAD | grep -E "$semver" | head -1 || true)
if [ -n "$existing" ]; then
    echo "version=${existing#v}"
    exit 0
fi

# Strip the legacy "v" prefix BEFORE sorting. `git --sort=-v:refname` mis-orders
# a mix of "v0.3.1" and "0.4.0" tags (the leading "v" outranks the digit, so
# v0.3.1 sorts above 0.4.0). Normalize to bare semver and use `sort -V` so the
# true highest wins regardless of prefix.
last=$(git tag --list | sed 's/^v//' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1 || true)
last=${last:-0.0.0}
IFS=. read -r major minor patch <<< "$last"

subject=$(git log -1 --format=%s)
subject=${subject% (#*)} # strip the " (#123)" suffix GitHub appends on squash merge

major_re='^[a-zA-Z]+(\([^)]*\))?!:'
minor_re='^feat(\([^)]*\))?:'
if [[ "$subject" =~ $major_re ]] || [[ "$subject" == *! ]]; then
    version="$((major + 1)).0.0"
elif [[ "$subject" =~ $minor_re ]]; then
    version="$major.$((minor + 1)).0"
else
    version="$major.$minor.$((patch + 1))"
fi

echo "version=$version"
