const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

const VOTESTABLE = process.env.VOTES_TABLE_NAME || "votesstable"

const put_record = (chan,msgId,record)=>{};
const delete_record = (chan,msgId)=>{};

// const update_record = (chan, who, how_much) => {
//     // we want to use a map to store voters. This way only one vote per user can be recorded by design.
//     // we need however to keep a track of voters and total score for computing the score.
//     // those two sadly don't play well together in case of update, do they.
//     // consider the following
//     // * a voter has not voted before, but the item has votes
//     // * a voter has not voted before, and this is the first vote
//     // * a voter has removed his vote
//     // * a voter has voted before, and changed his mind
//           const params = {
//           TableName: VOTES_TABLE,
//           Key: { pk : `${chan}:${author}`, sk:`${yearmonth}:${punId}` },
//           UpdateExpression: 'SET #votes.#voter = :vote, ADD #voterscount :x, ADD #total :vote ',
//           ExpressionAttributeNames: {
//             '#votes':"votes",
//             '#voter' : voter,
//             '#voterscount':voters_count, //1 new voter, 0 voter update or -1 voter removed
//             '#total': 'totalscore' //
//         },
//           ExpressionAttributeValues: {
//             ':vote' : vote,
//             ':x': how_much //1 new voter, 0 voter update or -1 voter removed
//           },
//           ReturnValues: 'NONE'
//         };
    
//         return documentClient.update(params).promise()
//     }
    