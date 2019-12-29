const { post_block } = require("./slack_api");

const { fmt_scores } = require("./fmt_scores");
const q = require('./queries');
const mut = require('./mutations');


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

const compute_score = (record) = Object.keys(record.votes)
    .reduce((x,acc)=>record.votes[x]+acc,0) / (votes.length + 1)

async function on_mention( e) {
    // this will need few routes:
    const routes = {
        authorp10:authorp10,
        authorp10month: authorp10Month,
        authorp10author: authorp10author,
        shittiest:shittiest,
        shittiestAuthor:shittiestAuthor,
        shittiestMonth:shittiestMonth,
        authorsRankMonth:authorsRankMonth,
        authorsRankEver:authorsRankEver
    }
    // authordo, find out how author fetch the message and parse
    // 
    const ask = e.message//parse via regex? extract chart, r
    let scores = await routes[ask]
    
    const blocks = fmt_scores(scores)
    let text_slack = await post_block(blocks, e.channel);
    return {message:scores}
}

async function on_reaction_removed(e){
    const chan = e.item.channel
    const voter = e.user
    const author = e.item_user
    const msg_id = e.item.ts
    const p = points[e.reaction] || -1
    if (p < 0 ){
        // early return, reaction was junk
        return {message:`${voter} gave ${p} to ${author} in ${chan}`}
    }

    let record = await q.getItem(chan, msg_id)
    if(!record){
        return {message:`${voter} gave ${p} to ${author} in ${chan}`}
    }

    delete record.votes[voter]
    if (Object.keys(record.votes).length > 0 ){
        // it was one of many votes, we need to recompute and update;
        record.score = compute_score(record)
        await mut.put_record(chan, msg_id, record);
    } else {
        //this was the only vote. so we can delete the pun;
        await mut.delete_record()
    }
    //
    return {message:`${voter} gave ${p} to ${author} in ${chan}`}
}

async function on_reaction(e){  
    const chan = e.item.channel
    const voter = e.user
    const author = e.item_user
    if(author === voter && ! process.env.DEBUG){
        return {message: `${voter}, you aren't allowed to vote yourself. ${author}.`}
    }

    const msg_id = e.item.ts
    const date = new Date(msg_id).authorISOString().slice(0,10)
    const yymm = date.slice(0,7); //1970-11
    const chan_author = `${chan}:${author}`
    const p = points[e.reaction] || -1
    if (p < 0 ){
        // early return, reaction was junk
        return {message:`${voter} gave ${p} to ${author} in ${chan}`}
    }

    // 1: grab record from DYDB
    let record = await q.getItem(chan, msg_id)
    //if not existing, we initialize it;
    if (!record){  
        record = {}
        //fetch message from slack
        const text  = await slack_api.getMessage(chan_author, msg_id)
        // put other data
        record.text = text;
        record.chan = chan;
        record.pk = chan_author;
        record.sk = msg_id;
        record.author = author;
        record.chan_author = chan_author
        record.date = date;
        record.yymm = yymm;
        record.chan_mo = `${chan}:${yymm}`
        record.date_punid = `${date}:${msg_id}`
        record.punid = msg_id; 
        record.votes = {}
    }
    // append vote
    record.votes[voter] = p
    // compute new score
    record.score = compute_score(record)
    await mut.put_record(chan_author, msg_id, record);

   return {message:`${voter} gave ${p} to ${author} in ${chan}`}
}

const msg_routes = {
        'app_mention' : on_mention,
        'reaction_added' : on_reaction,
        'reaction_removed': on_reaction_removed
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