const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

const VOTESSTABLE = process.env.VOTES_TABLE_NAME || "votesstable"
const MONTHLY_SCORES_TABLE = process.env.MONTHLY_SCORES_TABLE_NAME || "monthlyscoresstable"
const LIFE_SCORES_TABLE = process.env.LIFE_SCORES_TABLE_NAME || "lifescoresstable"

async function getMsg (chan_author, msg_id){
    const params = {
        TableName: VOTESSTABLE,
        Key: { pk:chan_author,
            sk:msg_id}
    }
    return documentClient.get(params)
        .promise()
        .then( x => x.Item)
        .catch(e => {
            console.error(e);
            return 
        })
}

async function top10Ever (chan){
    const params = {
        TableName: VOTESSTABLE,
        IndexName: "Top10Ever",
        ScanIndexForward: false,
        Limit:10,
        KeyConditionExpression: 'chan = :chan',
        ExpressionAttributeValues: {
          ':chan': chan,
        }
    }
    return documentClient.query(params)
        .promise()
        .then( x => x.Items)
        .catch(e => {
            console.error(e);
            return {}
        })
}

async function shittiestEver(chan){
    const params = {
        TableName: VOTESSTABLE,
        IndexName: "Top10Ever",
        Limit:1,
        KeyConditionExpression: 'chan = :chan',
        ExpressionAttributeValues: {
          ':chan': chan,
        }
    }
    return documentClient.query(params)
        .promise()
        .then( x => x.Items)
        .catch(e => {
            console.error(e);
            return {}
        })
}

async function top10Author (chan, author){
    const params = {
        TableName: VOTESSTABLE,
        IndexName: "AuthorsTop10",
        ScanIndexForward: false,
        Limit:10,
        KeyConditionExpression: 'chan_author = :hkey',
        ExpressionAttributeValues: {
          ':hkey': `${chan}:${author}`
        }
    }
    return documentClient.query(params)
        .promise()
        .then( x => x.Items)
        .catch(e => {
            console.error(e);
            return {}
        })
}

async function shittiestAuthor (chan, author){
    const params = {
        TableName: VOTESSTABLE,
        IndexName: "AuthorsTop10",
        Limit:1,
        KeyConditionExpression: 'chan_author = :hkey',
        ExpressionAttributeValues: {
          ':hkey':  `${chan}:${author}`
        }
    }
    return documentClient.query(params)
        .promise()
        .then( x => x.Items)
        .catch(e => {
            console.error(e);
            return {}
        })
}

async function top10Month (chan, yymm){
    const params = {
        TableName: VOTESSTABLE,
        IndexName: "Top10month",
        ScanIndexForward: false,
        Limit:10,
        KeyConditionExpression: 'chan_yymm = :hkey',
        ExpressionAttributeValues: {
          ':hkey': `${chan}:${yymm}`,
        }
    }
    return documentClient.query(params)
        .promise()
        .then( x => x.Items)
        .catch(e => {
            console.error(e);
            return {}
        })
}

async function shittiestMonth (chan, yymm){
    const params = {
        TableName: VOTESSTABLE,
        IndexName: "Top10month",
        Limit:1,
        KeyConditionExpression: 'chan_yymm = :hkey',
        ExpressionAttributeValues: {
          ':hkey': `${chan}:${yymm}`,
        }
    }
    return documentClient.query(params)
        .promise()
        .then( x => x.Items)
        .catch(e => {
            console.error(e);
            return {}
        })
}

async function authorsRankMonth (chan, yymm){
    const params = {
        TableName: MONTHLY_SCORES_TABLE,
        Key:{ pk:`${chan}:${yymm}`}
    }
    return documentClient.get(params)
        .promise()
        .then( x => x.Item)
        .catch(e => {
            console.error(e);
            return {}
        })
}

async function authorsRankEver (chan){
    const params = {
        TableName: LIFE_SCORES_TABLE_NAME,
        Key:{ pk:chan}
    }
    return documentClient.get(params)
        .promise()
        .then( x => x.Item)
        .catch(e => {
            console.error(e);
            return {}
        })
}


module.exports = {
    getMsg,
    top10Ever,
    top10Author,
    top10Month,
    shittiestEver,
    shittiestAuthor,
    shittiestMonth,
    authorsRankEver,
    authorsRankMonth
}