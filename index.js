// App entry point.
//
// The line-height floor patches StyleSheet.create, so it MUST run before any
// screen or component module executes its own StyleSheet.create at import time.
// These are `require` calls, not `import` declarations, on purpose: import
// declarations are hoisted and would let expo-router pull in the whole screen
// tree before the patch is installed.
require('./src/theme/installLineHeightFloor');
require('expo-router/entry');
