const {compute_score,mk_record } = require('./index');

jest.mock('./slack_api');
jest.mock('./queries');
jest.mock('./mutations');

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
    

    const r = mk_record("chan5","bob","1580595054.672","2020-10-22","2020-10","test this up","http://example.com")
    expected = {
      pk:"chan5:bob",
      sk:"1580595054.672",
      chan_author:"chan5:bob",
      chan_yymm : "chan5:2020-10",
      date_punid : "2020-10-22:1580595054.672",
      punid : "1580595054.672",
      votes : {},
        text:"test this up",
        link: "http://example.com",
        chan: "chan5",
        author: "bob",
        chan_author: "chan5:bob",
        date:"2020-10-22",
        yymm: "2020-10",
    }
    expect(r).toEqual(expected)
})

const mkEvent = (chan,voter,author,msg_id,reaction)=>({
  item:{
    channel:chan, 
    ts:msg_id},
  reaction,
  item_user:author,
  user:voter,
})
describe('on reaction', ()=>{

beforeEach(()=>{
  const queries = require('./queries');
  queries.__setMockData()
})

it('cannot vote self', async ()=>{
  //mocks callbacks and getters
  const evt = mkEvent("chan5","ron","ron","1580595054.672",":one:")
  const {on_reaction} = require('./index')
  
  
  res = await on_reaction(evt)
  expect(res).toEqual({"message": "ron, you aren't allowed to vote yourself. ron."})
  // can't vote self
  // can vote self if debug up
  // no junk
  // new record
  // update record
})

it('cannot put junk', async ()=>{
  //mocks callbacks and getters
  const evt = mkEvent("chan5","ron","bob","1580595054.672",":junk:")
  const {on_reaction} = require('./index')
  res = await on_reaction(evt)
  expect(res).toEqual({message: "ron gave -1 to bob in chan5"})
  // new record
  // update record
})


it('new record is created when needed', async ()=>{
  //mocks callbacks and getters
  const evt = mkEvent("chan5","ron","bob","1580595054.672","three")
  const {on_reaction} = require('./index')
  // queries.__setMockData(undefined);
  
  expected = {
    pk:"chan5:bob",
    sk:"1580595054.672",
    chan_author:"chan5:bob",
    chan_yymm : "chan5:2020-02",
    date_punid : "2020-02-01:1580595054.672",
    punid : "1580595054.672",
    score:3,
    votes : {"ron":3},
      text:"message chan5 1580595054.672",
      link: "http://www.example.com/chan5/1580595054.672",
      chan: "chan5",
      author: "bob",
      chan_author: "chan5:bob",
      date:"2020-02-01",
      yymm: "2020-02",
  }
  res = await on_reaction(evt)
  expect(res).toEqual(expected)
  // update record
})

it('record is updated allright', async ()=>{
  //mocks callbacks and getters
  const evt = mkEvent("chan5","ron","bob","1580595054.672","three")
  const queries = require('./queries');
  
  const current = {
    pk:"chan5:bob",
    sk:"1580595054.672",
    chan_author:"chan5:bob",
    chan_yymm : "chan5:2020-02",
    date_punid : "2020-02-01:1580595054.672",
    punid : "1580595054.672",
    score:7,
    votes : {"carl":7},
      text:"message chan5 1580595054.672",
      link: "http://www.example.com/chan5/1580595054.672",
      chan: "chan5",
      author: "bob",
      chan_author: "chan5:bob",
      date:"2020-02-01",
      yymm: "2020-02",
  }
  
  queries.__setMockData(current);
  const {on_reaction} = require('./index')
  

  const expected = {
    pk:"chan5:bob",
    sk:"1580595054.672",
    chan_author:"chan5:bob",
    chan_yymm : "chan5:2020-02",
    date_punid : "2020-02-01:1580595054.672",
    punid : "1580595054.672",
    score:5,
    votes : {"ron":3, "carl":7},
      text:"message chan5 1580595054.672",
      link: "http://www.example.com/chan5/1580595054.672",
      chan: "chan5",
      author: "bob",
      chan_author: "chan5:bob",
      date:"2020-02-01",
      yymm: "2020-02",
  }
  res = await on_reaction(evt)
  expect(res).toEqual(expected)
  // update record
})

})