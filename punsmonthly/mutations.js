const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const documentClient = new AWS.DynamoDB.DocumentClient();

const TABLE = process.env.TABLE_NAME || "monthlyScoresTable"

const put_record = (record)=>{
    const params = {
        TableName: TABLE,
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

const delete_record = (pk)=>{
    const params = {
        TableName: TABLE,
        Key: {
            pk: pk
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