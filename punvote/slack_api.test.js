const {verify } = require('./slack_api');


describe('verifies signatures correctly', () => {
  
  expect(verify("a","b")).toBe(true);
});
