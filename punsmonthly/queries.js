const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const log = require('debug')('monthly:queries');

const TABLE = process.env.TABLE_NAME || "monthlyScoresTable"

// {
//        pk: chan_yymm
//        authors : {
//          author_id:{
//            avg:number,
//            punsScores: { punId:number }
//            }
//        }
//      }
async function getItem (chan_yymm){
    const params = {
        TableName: TABLE,
        Key: { pk:chan_yymm}
    }
    return documentClient.get(params)
        .promise()
        .then( x => {
            log(x);
        return    x.Item
        })
        .catch(e => {
            console.error(e);
            return 
        })
}

module.exports = {
    getItem,
}