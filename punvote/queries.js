const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

const SCORESTABLE = process.env.SCORES_TABLE_NAME || "scoresstable"
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


//TODO: those will be queries, should return promises
export const getItem = (pk,sk)=> "item"
export const top10 =()=>"top10"
export const top10Month =(month='current')=>"top10month-"+month
export const top10author = (author) => "top10author-"+author
export const shittiest =()=>"shittiest"
export const shittiestMonth =(month='current')=>"shittiestMonth-"+month
export const shittiestAuthor = (author) => "shittiestAuthor-"+author
export const authorsRankMonth = (month='current')=>"rankmonth"+month
export const authorsRankEver = ()=>"all time author ranks"
