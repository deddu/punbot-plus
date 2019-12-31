const slack_api = require("./slack_api");

const fmt = require("./fmt_scores");
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
    keycap_ten:10
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
    let blocks = fmt.default_message
    if(!tokens){
        //early out, wrong ask
        await slack_api.post_block(blocks, chan);
        return {message:"wrong request"}
    }
    
    let scores;

    //fmt.fmt_items(scores)
    switch (tokens.cmd) {
        case 'top10':{
            if (tokens.ever ){
                scores = await q.top10Ever(chan)
                blocks = fmt.fmt_items(`<#${chan}> top10 ever`, scores)
            } else if (tokens.author){
                scores = await q.top10Author(chan, tokens.author)
                blocks = fmt.fmt_items(`<#${chan}> top10 by <@${tokens.author}>`, scores)
            } else if (tokens.date){
                scores = await q.top10Month(chan, tokens.date)
                blocks = fmt.fmt_items(`<#${chan}> top10 in ${tokens.date}`, scores)
            }
            break;
        }
        case 'shit':{
            if (tokens.ever ){
                scores = await q.shittiestEver(chan)
                blocks = fmt.fmt_items(`<#${chan}> shittiest ever`, scores)
            } else if (tokens.author){
                scores = await  q.shittiestAuthor(chan, tokens.author)
                blocks = fmt.fmt_items(`<#${chan}> shittiest by <@${tokens.author}>`, scores)
            } else if (tokens.date){
                scores = await  q.shittiestMonth(chan, tokens.date)
                blocks = fmt.fmt_items(`<#${chan}> shittiest in ${tokens.date}`, scores)
            }
            break;
        }
        case 'rank':{
            if (tokens.ever ){
                scores = await q.authorsRankEver(chan)
                blocks = fmt.fmt_ranks(`<#${chan}> rank ever`, scores)
            } else if (tokens.date){
                scores = await q.authorsRankMonth(chan, tokens.date)
                blocks = fmt.fmt_ranks(`<#${chan}> rank in ${tokens.date}`, scores)
            }
            break;
        }
        default:{
            blocks = fmt.default_message
        }
    }
    console.log('blocks',blocks)

    let text_slack = await slack_api.post_block(blocks, chan);
    return {message:scores, text_slack}
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
        console.log(`early return, :${e.reaction}: is not a reaction we care about` )
        return {message:`${voter} gave ${p} to ${author} in ${chan}`}
    }

    let record = await q.getMsg(chan_author, msg_id)
    if(!record){
        console.log(`early return, pk=${chan_author}, sk=${msg_id} not found` )
        return {message:`${voter} gave ${p} to ${author} in ${chan}`}
    }

    delete record.votes[voter]
    if (Object.keys(record.votes).length > 0 ){
        // it was one of many votes, we need to recompute and update;
        console.log('multiple votes are still present in record')
        record.score = compute_score(record)
        await mut.put_record(record);
    } else {
        //this was the only vote. so we can delete the pun;
        console.log('deleting record')
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
        const link  = await slack_api.get_message_link(chan, msg_id)
        const text = await slack_api.get_message(chan, msg_id)
        // put other data
        record.text = text;
        record.link = link;
        record.chan = chan;
        record.pk = chan_author;
        record.sk = msg_id;
        record.author = author;
        record.chan_author = chan_author
        record.date = date;
        record.yymm = yymm;
        record.chan_yymm = `${chan}:${yymm}`
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
