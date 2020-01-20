const {compute_score } = require('./index');

test('computes scores correctly', () => {
  wrap = x=> ({votes:x})
  expect(compute_score(wrap({a:10,b:0}))).toBe(5);
  expect(compute_score(wrap({a:10,b:0,c:5}))).toBe(5);
  expect(compute_score(wrap({a:1,b:0}))).toBeCloseTo(0.5);
  expect(compute_score(wrap({a:1,b:0,c:0}))).toBeCloseTo(0.33);
  expect(compute_score(wrap({}))).toBe(NaN);
});

test('new records are built correctly when needed', () => {
    // import mocks for api calls, or factor out
})