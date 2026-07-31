#!/bin/sh
set -e

# Disable React Native DevTools (causes sandbox errors in some environments)
# and start Metro bundler for Expo Go development.
export EXPO_NO_DEVTOOLS=1

cd "$(dirname "$0")"
exec node_modules/.bin/expo start --tunnel "$@"
