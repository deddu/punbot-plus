const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

const VOTESSTABLE = process.env.VOTES_TABLE_NAME || "votesstable"
const MONTHLY_SCORES_TABLE = process.env.MONTHLY_SCORES_TABLE_NAME || "monthlyscoresstable"
const LIFE_SCORES_TABLE = process.env.LIFE_SCORES_TABLE_NAME || "lifescoresstable"


const get_scores = (chan)=>{
    const params = {
        TableName: TABLE,
        Key: {chan:chan}
    }
    return documentClient.get(params)
        .promise()
        .then( x => x.Item)
        .catch(e => {
            console.error(e);
            return {}
        })
}

function getMsg (chan_author, msg_id){
    const params = {
        TableName: VOTESTABLE,
        Key: { pk:chan_author,
            sk:msg_id}
    }
    return documentClient.get(params)
        .promise()
        .then( x => x.Item)
        .catch(e => {
            console.error(e);
            return {}
        })
}

function top10Ever (chan){
    const params = {
        TableName: VOTESTABLE,
        IndexName: "Top10Ever",
        ScanIndexForward: false,
        Limit:10,
        KeyConditionExpression: 'pk = :hkey',
        ExpressionAttributeValues: {
          ':hkey': chan,
        }
    }
    return documentClient.query(params)
        .promise()
        .then( x => x.Item)
        .catch(e => {
            console.error(e);
            return {}
        })
}

function top10Author (author){
    const params = {
        TableName: VOTESTABLE,
        IndexName: "AuthorsTop10",
        ScanIndexForward: false,
        Limit:10,
        KeyConditionExpression: 'pk = :hkey',
        ExpressionAttributeValues: {
          ':hkey': 'key',
        }
    }
    return documentClient.query(params)
        .promise()
        .then( x => x.Item)
        .catch(e => {
            console.error(e);
            return {}
        })
}

function top10Month (chan, yymm){
    const params = {
        TableName: VOTESTABLE,
        IndexName: "Top10month",
        ScanIndexForward: false,
        Limit:10,
        KeyConditionExpression: 'pk = :hkey',
        ExpressionAttributeValues: {
          ':hkey': `${chan}:${yymm}`,
        }
    }
    return documentClient.query(params)
        .promise()
        .then( x => x.Item)
        .catch(e => {
            console.error(e);
            return {}
        })
}

//TODO: those will be queries, should return promises
module.export = {
    getMsg:getMsg
}
export const top10 =()=>"top10"
export const top10Month =(month='current')=>"top10month-"+month
export const top10author = (author) => "top10author-"+author
export const shittiest =()=>"shittiest"
export const shittiestMonth =(month='current')=>"shittiestMonth-"+month
export const shittiestAuthor = (author) => "shittiestAuthor-"+author
export const authorsRankMonth = (month='current')=>"rankmonth"+month
export const authorsRankEver = ()=>"all time author ranks"
