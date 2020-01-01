const {compute_score,getNew,getOld} = require('./index');

test('computes averages correctly', () => {
  wrap = x=> ({punsScores:x})
  expect(compute_score(wrap({a:10,b:0}))).toBe(5);
  expect(compute_score(wrap({a:10,b:0,c:5}))).toBe(5);
  expect(compute_score(wrap({a:1,b:0}))).toBeCloseTo(0.5);
  expect(compute_score(wrap({a:1,b:0,c:0}))).toBeCloseTo(0.33);
  expect(compute_score(wrap({}))).toBe(NaN);
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