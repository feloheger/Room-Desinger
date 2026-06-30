module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // expo-router requires this plugin
      "expo-router/babel",
      // Reanimated plugin MUST be listed last
      "react-native-reanimated/plugin",
    ],
  };
};
