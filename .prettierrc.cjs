module.exports = {
  ...require('@zzdats/prettier-config'),
  overrides: [
    {
      files: '*.css',
      options: { printWidth: 300 },
    },
  ],
};
