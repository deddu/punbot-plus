const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

const VOTESSTABLE = process.env.VOTES_TABLE_NAME || "votesstable"
const MONTHLY_SCORES_TABLE = process.env.MONTHLY_SCORES_TABLE_NAME || "monthlyscoresstable"
const LIFE_SCORES_TABLE = process.env.LIFE_SCORES_TABLE_NAME || "lifescoresstable"

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
        .then( x => x.Items)
        .catch(e => {
            console.error(e);
            return {}
        })
}

function shittiestEver(chan){
    const params = {
        TableName: VOTESTABLE,
        IndexName: "Top10Ever",
        Limit:1,
        KeyConditionExpression: 'pk = :hkey',
        ExpressionAttributeValues: {
          ':hkey': chan,
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
        .then( x => x.Items)
        .catch(e => {
            console.error(e);
            return {}
        })
}

function shittiestAuthor (author){
    const params = {
        TableName: VOTESTABLE,
        IndexName: "AuthorsTop10",
        Limit:1,
        KeyConditionExpression: 'pk = :hkey',
        ExpressionAttributeValues: {
          ':hkey': 'key',
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
        .then( x => x.Items)
        .catch(e => {
            console.error(e);
            return {}
        })
}

function shittiestMonth (chan, yymm){
    const params = {
        TableName: VOTESTABLE,
        IndexName: "Top10month",
        Limit:1,
        KeyConditionExpression: 'pk = :hkey',
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

function authorsRankMonth (chan, yymm){
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

function authorsRankEver (chan){
    const params = {
        TableName: MONTHLY_SCORES_TABLE,
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


module.export = {
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