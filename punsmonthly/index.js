//api, votes, and aggregations reads 
const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.TABLE_NAME || "punstable"

const update_record = (chan, who, how_much) => {
      const params = {
      TableName: TABLE,
      Key: { chan : chan },
      UpdateExpression: 'ADD #a :x',
      ExpressionAttributeNames: {'#a' : who},
      ExpressionAttributeValues: {
        ':x' : how_much,
      },
      ReturnValues: 'NONE'
    };

    return documentClient.update(params).promise()
}
  
exports.handler = async (event) => {
    const slack_raw = JSON.parse(event.body)
    let resp;
    if ('event_callback' == slack_raw.type ) {
        //the event is wrapped in metadata
        const slack_evt = slack_raw.event;
         resp = await msg_routes[slack_evt.type](slack_evt)
    }
    else if ('url_verification' == slack_raw.type){
        resp = {challenge: slack_raw.challenge}
    }
    
    return build_response(resp);
};
