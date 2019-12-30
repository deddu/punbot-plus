const slack_api = require("./slack_api");

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

const compute_score = (record) => {
    const keys = Object.keys(record.votes)
    const tot =  keys.reduce((acc,x) => record.votes[x]+ acc, 0)
    return tot / (keys.length)
}

const tokenizer  = /(?<cmd>top10|shit|rank)\s(?<what>(?<ever>ever)|<@(?<author>\S*)>|(?<date>\d{4}-\d{2}))/gi
const tokenize = (s) => [... s.matchAll(tokenizer)].map(x=>x.groups)[0]


async function on_mention( e) {
    console.log('on_mention', e)
    const chan = e.channel
    const tokens = tokenize(e.text);
    if(!tokens){
        //early out, wrong ask
        return {message:"wrong request"}
    }
    
    let op;
    switch (tokens.cmd) {
        case 'top10':{
            if (tokens.ever ){
                op = ()=> q.top10Ever(chan)
            } else if (tokens.author){
                op = ()=>q.top10Author(chan, tokens.author)
            } else if (tokens.date){
                op = ()=>q.top10Month(chan, tokens.date)
            }
            break
        }
        case 'shit':{
            if (tokens.ever ){
                op = ()=>q.shittiestEver(chan)
            } else if (tokens.author){
                op = () => q.shittiestAuthor(chan, tokens.author)
            } else if (tokens.date){
                op = () => q.shittiestMonth(chan, tokens.date)
            }
        }
        case 'rank':{
            if (tokens.ever ){
                op = ()=>q.authorsRankEver(chan)
            } else if (tokens.date){
                op = ()=>q.authorsRankMonth(chan, tokens.date)
            }
        }
    }

    let scores = await op()
    console.log(scores)

    
    const blocks = fmt_scores(scores)
    let text_slack = await slack_api.post_block(blocks, e.channel);
    return {message:scores}
}

async function on_reaction_removed(e){
    const chan = e.item.channel
    const voter = e.user
    const author = e.item_user
    const msg_id = e.item.ts
    const chan_author = `${chan}:${author}`
    const p = points[e.reaction] || -1
    if (p < 0 ){
        // early return, reaction was junk
        return {message:`${voter} gave ${p} to ${author} in ${chan}`}
    }

    let record = await q.getMsg(chan, msg_id)
    if(!record){
        return {message:`${voter} gave ${p} to ${author} in ${chan}`}
    }

    delete record.votes[voter]
    if (Object.keys(record.votes).length > 0 ){
        // it was one of many votes, we need to recompute and update;
        record.score = compute_score(record)
        await mut.put_record(record);
    } else {
        //this was the only vote. so we can delete the pun;
        await mut.delete_record(chan_author,msg_id)
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
    const date = new Date(Number(msg_id) * 1000).toISOString().slice(0,10)
    const yymm = date.slice(0,7); //1970-11
    const chan_author = `${chan}:${author}`
    const p = points[e.reaction] || -1
    if (p < 0 ){
        // early return, reaction was junk
        return {message:`${voter} gave ${p} to ${author} in ${chan}`}
    }

    // 1: grab record from DYDB
    let record = await q.getMsg(chan, msg_id)
    //if not existing, we initialize it;
    console.log('found ',record)
    if (!record){  
        console.log('initializing')
        record = {}
        //fetch message from slack
        const text  = await slack_api.get_message(chan, msg_id)
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

    console.log('record:',record)
    // compute new score
    record.score = compute_score(record)
    console.log('scored record:',record)
    await mut.put_record(record);

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
    // idk those two are needed for local evts wiht the apigw format
    // const body = JSON.parse(event.body)
    // const slack_raw = body.body
    const slack_raw = JSON.parse(event.body)
    
    let resp;
    switch (slack_raw.type) {
        case 'event_callback' :{
            //the event is wrapped in metadata
            const slack_evt = slack_raw.event;
            resp = await msg_routes[slack_evt.type](slack_evt)
            break;
        }
        case 'url_verification':{
            console.log('here')
            resp = {challenge: slack_raw.challenge}
            break;
        }
        default:{
            console.log(slack_raw)
        }
    }
    
    return build_response(resp);
};
