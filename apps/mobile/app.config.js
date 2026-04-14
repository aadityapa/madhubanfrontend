const appJson = require("./app.json");

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      eas: {
        ...(appJson.expo.extra?.eas ?? {}),
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
    },
  },
});
