const rp = require('request-promise-native');
const R = require('ramda')
const textract = R.lensPath(['messages',0,'text'])
const linkextract = R.lensPath(['permalink'])
const {hmac} = require('crypto');
const log = require('debug')('votes:slack');
const SLACK_APP_SECRET = process.env.SLACK_APP_SECRET || 'You should set this to something hard to guess'

function post_block(blk, chan) {
    const payload = {
        text: "check me out",
        unfurl_links:true,
        link_names:1,
        blocks: blk,
        channel: chan
    };
    return post_payload(payload);
}

function post_msg(msg, chan) {
    const payload = {
        text: msg,
        channel: chan
    };
    return post_payload(payload);
}

function post_payload(payload) {
    const opts = {
        method: 'POST',
        uri: 'https://slack.com/api/chat.postMessage',
        headers: {
            Authorization: `Bearer ${process.env.BOTS_TOKEN}`,
            ContentType:'application/json'
        },
        body: payload,
        json: true
    };
    return rp(opts)
        .then(r=>{
            console.log('request success' , r)
            return r
        })
        .catch(e=>{
            console.error('request fail', e)
            return 
        });
}

function get_message_link(chan, ts){
    //https://api.slack.com/events/reaction_added
    //    https://api.slack.com/events/message
    //     "ts": "1360782400.498405" is the message id
    // grab message from  GET /api/channels.history?token=TOKEN_WITH_CHANNELS_HISTORY_SCOPE&channel=C2EB2QT8A&latest=1476909142.000007&inclusive=true&count=1
    const opts = {
        method: 'GET',
        uri: 'https://slack.com/api/chat.getPermalink',
        headers: {
            Authorization: `Bearer ${process.env.BOTS_TOKEN}`
        },
        qs:{
            token:process.env.BOTS_TOKEN,
            channel:chan,
            message_ts:ts
                },
        json: true
    };
    return rp(opts)
    .then(r=> r.ok ? R.view(linkextract,r) : r.error )
    .catch(e =>{
        console.error(e)
        return
    });
}

function get_message(chan,ts){
    //https://api.slack.com/events/reaction_added
    //    https://api.slack.com/events/message
    //     "ts": "1360782400.498405" is the message id
    // grab message from  GET /api/channels.history?token=TOKEN_WITH_CHANNELS_HISTORY_SCOPE&channel=C2EB2QT8A&latest=1476909142.000007&inclusive=true&count=1
    const opts = {
        method: 'GET',
        uri: 'https://slack.com/api/channels.history',
        headers: {
            Authorization: `Bearer ${process.env.BOTS_TOKEN}`
        },
        qs:{
            token:process.env.BOTS_TOKEN,
            channel:chan,
            latest:ts,
            inclusive:true,
            count:1
        },
        json: true
    };
    return rp(opts)
        .then(r=> r.ok ? R.view(textract,r) : r.error )
        .catch(e =>{
            console.error(e)
            return
        });
}

const verify = (sig, request, secret=SLACK_APP_SECRET) =>{
    log('sig: ',sig, 'rq:', request);
    return true;
    const timestamp = request.headers['X-Slack-Request-Timestamp']
    sig_basestring = 'v0:' + timestamp + ':' + request.body
    my_signature = 'v0=' + hmac.compute_hash_sha256(
        slack_signing_secret,
        sig_basestring
        ).hexdigest()
    slack_signature = request.headers['X-Slack-Signature']
    return hmac.compare(my_signature, slack_signature);
}

module.exports = {
    get_message,
    post_block,
    post_payload,
    post_msg,
    get_message_link,
    verify
}