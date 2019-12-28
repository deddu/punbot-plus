const { fmt_scores } = require("./fmt_scores");

//api, votes, and aggregations reads 
const rp = require('request-promise-native');
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const VOTESTABLE = process.env.VOTES_TABLE_NAME || "votesstable"
const SCORESTABLE = process.env.SCORES_TABLE_NAME || "scoresstable"
const points = {
    zero:0,
    one:1,
    two:2,
    three:3,
    four:4,
    five:5,
    six:6,
    seven:7,
    eight:8,
    nine:9,
    ten:10
}

const update_record = (chan, who, how_much) => {
// we want to use a map to store voters. This way only one vote per user is automatic;
// we need however to keep a track of voters and total score for computing the score.
// those two sadly don't play well together in case of update, do they.
// consider the following
// * a voter has not voted before, but the item has votes
// * a voter has not voted before, and this is the first vote
// * a voter has removed his vote
// * a voter has voted before, and changed his mind
      const params = {
      TableName: VOTES_TABLE,
      Key: { pk : `${chan}:${author}`, sk:`${yearmonth}:${punId}` },
      UpdateExpression: 'SET #votes.#voter = :vote, ADD #voterscount :x, ADD #total :vote ',
      ExpressionAttributeNames: {
        '#votes':"votes",
        '#voter' : voter,
        '#voterscount':voters_count, //1 new voter, 0 voter update or -1 voter removed
        '#total': 'totalscore' //
    },
      ExpressionAttributeValues: {
        ':vote' : vote,
        ':x': how_much //1 new voter, 0 voter update or -1 voter removed
      },
      ReturnValues: 'NONE'
    };

    return documentClient.update(params).promise()
}

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
const top10 =()=>"top10"
const top10Month =(month='current')=>"top10month-"+month
const top10author = (author) => "top10author-"+author
const shittiest =()=>"shittiest"
const shittiestMonth =(month='current')=>"shittiestMonth-"+month
const shittiestAuthor = (author) => "shittiestAuthor-"+author
const authorsRankMonth = (month='current')=>"rankmonth"+month
const authorsRankEver = ()=>"all time author ranks"

async function on_mention( e) {
    // this will need few routes:
    const routes = {
        top10:top10,
        top10month: top10Month,
        top10author: top10author,
        shittiest:shittiest,
        shittiestAuthor:shittiestAuthor,
        shittiestMonth:shittiestMonth,
        authorsRankMonth:authorsRankMonth,
        authorsRankEver:authorsRankEver
    }
    // todo, find out how to fetch the message and parse
    // 
    const ask = e.message//parse via regex? extract chart, r
    let scores = await routes[ask]
    
    const blocks = fmt_scores(scores)
    let text_slack = await post_block(blocks, e.channel);
    return {message:scores}
}


async function on_reaction(e, sign=1){
// 1: grab record from DYDB if Exists
// 2a: if not existing: 
//        - Call slack to fetch full msg
//        - Insert new record with vote
// 2b: if existing
//       -  append vote data 
//       -  compute new score
//       -  update record

   //https://api.slack.com/events/reaction_added
//    https://api.slack.com/events/message
//     "ts": "1360782400.498405" is the message id
// grab message from  GET /api/channels.history?token=TOKEN_WITH_CHANNELS_HISTORY_SCOPE&channel=C2EB2QT8A&latest=1476909142.000007&inclusive=true&count=1
   const where = e.item.channel
   const who = e.user
   const to = e.item_user
   const p = points[e.reaction] |0
   if (!!p){
       await update_record(where, to, sign*p)
   }
   return {message:`${who} gave ${p} to ${to} in ${where}`}
}

const msg_routes = {
        'app_mention' : on_mention,
        'reaction_added' : on_reaction,
        'reaction_removed': (e) => on_reaction(e, -1)
    }

function post_block(blk,chan){
   const payload = {
       blocks:blk,
       channel:chan
   }
   return post_payload(payload )
}

function post_msg(msg,chan){
        const payload = {
            text: msg,
            channel: chan
            }
        return post_payload(payload)
}

function post_payload(payload) {
    const opts = {
        method:'POST',
        uri:'https://slack.com/api/chat.postMessage',
        headers:{
            Authorization: `Bearer ${process.env.BOTS_TOKEN}`
        },
        body:payload,
        json:true
    }
    
    return rp(opts)
}
    
const build_response = o => ({
    statusCode: 200,
    headers: {
            "Content-Type": "Application/json"
        },
    body: JSON.stringify(o),  
    isBase64Encoded: false
})
    
    
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
