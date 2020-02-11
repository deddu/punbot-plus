const {verify } = require('./slack_api');


test('verifies signatures correctly', () => {
  
  expect(verify("a","b")).toBe(true);

});
