const {compute_score,getNew,getOld,upMonthly,upEver,rmMonthly } = require('./index');

test('computes averages correctly', () => {
  wrap = x=> ({punsScores:x})
  expect(compute_score(wrap({a:10,b:0}))).toBe(5);
  expect(compute_score(wrap({a:10,b:0,c:5}))).toBe(5);
  expect(compute_score(wrap({a:1,b:0}))).toBeCloseTo(0.5);
  expect(compute_score(wrap({a:1,b:0,c:0}))).toBeCloseTo(0.33);
  expect(compute_score(wrap({}))).toBe(NaN);
  expect(compute_score({yymm:{a:1,b:2}},'yymm')).toBeCloseTo(1.5);
  expect(compute_score({otherk:{a:1,b:2}},'otherk')).toBeCloseTo(1.5);
});


test('lenstractors',()=> {
  const record =  {
    "eventID": "2",
    "eventVersion": "1.0",
    "dynamodb": {
      "OldImage": {
        "author": {
          "S": "bob"
        },
        "score": {
          "N": "101"
        }
      },
      "SequenceNumber": "222",
      "Keys": {
        "Id": {
          "N": "101"
        }
      },
      "SizeBytes": 59,
      "NewImage": {
        "author": {
          "S": "rob"
        },
        "score": {
          "N": "5"
        }
      }
      ,
      "StreamViewType": "NEW_AND_OLD_IMAGES"
    },
    "awsRegion": "us-east-1",
    "eventName": "MODIFY",
    "eventSourceARN": "arn:aws:dynamodb:us-east-1:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
    "eventSource": "aws:dynamodb"
  }
  expect(getNew(record)).toEqual({author:"rob",score:5});
  expect(getOld(record)).toEqual({author:"bob",score:101});
})


test('upMonthly returns a clean record on new pun', ()=>{
    // it returns new record on not existing
    const newP = {
        pk:'c123:a123',
        score:10,
        sk:'p123',
        chan_yymm:'c123:2020-01'
    }
    const expected = {
        pk: 'c123:2020-01',
        authors:{
            a123:{
                avg:10,
                punsScores:{p123:10}
            }
        }
    }
    expect(upMonthly(undefined,newP)).toEqual(expected)
})

test('upMonthly appends and update a record with the new pun', ()=>{
    // it returns new record on not existing
    const newP = {
        pk:'c123:a123',
        score:10,
        sk:'p2',
        chan_yymm:'c123:2020-01'
    }
    const current = {
        pk: 'c123:2020-01',
        authors:{
            a123:{
                avg:2,
                punsScores:{p1:2}
            }
        }
    }
    const expected = {
        pk: 'c123:2020-01',
        authors:{
            a123:{
                avg:6,
                punsScores:{p1:2,p2:10}
            }
        }
    }
    const computed = upMonthly(current,newP)
    expect(computed.authors.a123.avg).toBeCloseTo(6);
    expect(computed.authors.a123.punsScores).toEqual(expected.authors.a123.punsScores)
})


test('upMonthly appends and update a record for a new author the new pun', ()=>{
    // it returns new record on not existing
    const newP = {
        pk:'c123:a456',
        score:10,
        sk:'p2',
        chan_yymm:'c123:2020-01'
    }
    const current = {
        pk: 'c123:2020-01',
        authors:{
            a123:{
                avg:2,
                punsScores:{p1:2}
            }
        }
    }
    const expected = {
        pk: 'c123:2020-01',
        authors:{
            a123:{
                avg:2,
                punsScores:{p1:2}
            },
            a456:{
                avg:10,
                punsScores:{p2:10}
            }
        }
    }
    const computed = upMonthly(current,newP)
    expect(computed.authors.a123.avg).toBeCloseTo(2);
    expect(computed.authors.a456.avg).toBeCloseTo(10);
    expect(computed.authors.a123.punsScores).toEqual(expected.authors.a123.punsScores)
    expect(computed.authors.a456.punsScores).toEqual(expected.authors.a456.punsScores)
})


test('rmMonthly deletes a pun score among many',()=>{
    const oldP = {
        pk:'c123:a123',
        score:10,
        sk:'p2',
        chan_yymm:'c123:2020-01'
    }
    
    const current = {
        pk: 'c123:2020-01',
        authors:{
            a123:{
                avg:6,
                punsScores:{p1:2,p2:10}
            }
        }
    }

    const expected = {
        pk: 'c123:2020-01',
        authors:{
            a123:{
                avg:2,
                punsScores:{p1:2}
            }
        }
    }
    
    const computed = rmMonthly(current,oldP)
    expect(computed.authors.a123.punsScores).toEqual(expected.authors.a123.punsScores)
    expect(computed.authors.a123.avg).toBeCloseTo(2);
})

test('rmMonthly deletes the last pun score and the author',()=>{
    const oldP = {
        pk:'c123:a123',
        score:10,
        sk:'p2',
        chan_yymm:'c123:2020-01'
    }
    
    const current = {
        pk: 'c123:2020-01',
        authors:{
            a123:{
                avg:10,
                punsScores:{p2:10}
            },
            a3:{
                avg:10,
                punsScores:{p1:10}
            }
        }
    }

    const expected = {
        pk: 'c123:2020-01',
        authors:{
            a3:{
                avg:10,
                punsScores:{p1:10}
            }
        }
    }
    
    const computed = rmMonthly(current,oldP)
    expect(computed.authors).toEqual(expected.authors)
})


test('upEver returns a clean record on new pun', ()=>{
    // it returns new record on not existing
    const newP = {
        pk:'c123:a123',
        score:10,
        sk:'p2',
        chan_yymm:'c123:2020-01'
    }
    
    const mo = {
        pk: 'c123:2020-01',
        authors:{
            a123:{
                avg:6,
                punsScores:{p1:2,p2:10}
            }
        }
    }
    
    const expected = {
        pk: 'c123',
        authors:{
            a123:{
                avg:6,
                yymm:{'2020-01':6}
            }
        }
    }
    expect(upEver(undefined, mo, newP)).toEqual(expected)
})




test('upEver updates record correctly', ()=>{
    // it returns new record on not existing
    const newP = {
        pk:'c123:a123',
        score:10,
        sk:'p6',
        chan_yymm:'c123:2020-01'
    }
    
    const mo = {
        pk: 'c123:2019-12',
        authors:{
            a123:{
                avg:3,
                punsScores:{p3:0,p2:6}
            }
        }
    }
    
    const current = {
        pk: 'c123',
        authors:{
            a123:{
                avg:6,
                yymm:{'2020-01':6}
            }
        }
    }

    const expected = {
        pk: 'c123',
        authors:{
            a123:{
                avg:4.5,
                yymm:{'2020-01':6, '2019-12':3}
            }
        }
    }
    const computed = upEver(current, mo, newP);
    
    expect(computed.authors.a123.avg).toBeCloseTo(expected.authors.a123.avg)
    expect(computed.authors.a123.yymm).toEqual(expected.authors.a123.yymm)
})



test('upEver updates record correctly even on deletion of one pun', ()=>{
    // it returns new record on not existing
    const rmP = {
        pk:'c123:a123',
        score:10,
        sk:'p6',
        chan_yymm:'c123:2020-01'
    }
    
    const mo = {
        pk: 'c123:2019-12',
        authors:{
            a123:{
                avg:3,
                punsScores:{p3:0,p2:6}
            },
            a2:{
                avg:10,
                punsScores:{p1:10}
            }
        }
    }
    
    const current = {
        pk: 'c123',
        authors:{
            a123:{
                avg:8,
                yymm:{'2019-12':8}
            },
            a2:{
                avg:10,
                yymm:{'2020-01':10}
            }
        }
    }

    const expected = {
        pk: 'c123',
        authors:{
            a123:{
                avg:3,
                yymm:{'2019-12':3}
            },
            a2:{
                avg:10,
                yymm:{'2020-01':10}
            }
        }
    }
    const computed = upEver(current, mo, rmP);
    
    expect(computed.authors.a123.avg).toBeCloseTo(expected.authors.a123.avg)
    expect(computed.authors.a123.yymm).toEqual(expected.authors.a123.yymm)
})



test('upEver updates record correctly even on deletion of a month', ()=>{
    // it returns new record on not existing
    const rmP = {
        pk:'c123:a123',
        score:10,
        sk:'p6',
        chan_yymm:'c123:2020-01'
    }
    
    const mo = {
        pk: 'c123:2019-12',
        authors:{
            a2:{
                avg:10,
                punsScores:{p1:10}
            }
        }
    }
    
    const current = {
        pk: 'c123',
        authors:{
            a123:{
                avg:8,
                yymm:{'2019-12':8}
            },
            a2:{
                avg:10,
                yymm:{'2020-01':10}
            }
        }
    }

    const expected = {
        pk: 'c123',
        authors:{
            a2:{
                avg:10,
                yymm:{'2020-01':10}
            }
        }
    }
    const computed = upEver(current, mo, rmP);
    
    expect(computed.authors).toEqual(expected.authors)
})