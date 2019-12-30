const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

const VOTESTABLE = process.env.VOTES_TABLE_NAME || "votesstable"

const put_record = (record)=>{
    const params = {
        TableName: VOTESTABLE,
        Item:record
    }
    return documentClient.put(params)
        .promise()
        .then( x => x)
        .catch(e => {
            console.error(e);
            return {}
        })
};


const delete_record = (chan_author, msgId)=>{
    const params = {
        TableName: VOTESTABLE,
        Key: {
            pk: chan_author,
            sk: msgId
          }
    }
    return documentClient.delete(params)
        .promise()
        .then( x => x)
        .catch(e => {
            console.error(e);
            return {}
        })
};

module.exports = {
    put_record,
    delete_record
}