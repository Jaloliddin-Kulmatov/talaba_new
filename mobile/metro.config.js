// The phone app shares a few dependency-free modules with the website (src/lib/toolkit, events, guide-topics),
// imported as "@shared/...". Metro must be told to watch that folder.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders || []), path.resolve(__dirname, "../src/lib")];
// Shared files live outside this project: resolve packages from here, never from the website's node_modules.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];

module.exports = config;
