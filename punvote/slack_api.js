const rp = require('request-promise-native');
function post_block(blk, chan) {
    const payload = {
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
            Authorization: `Bearer ${process.env.BOTS_TOKEN}`
        },
        body: payload,
        json: true
    };
    return rp(opts);
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
    return rp(opts);
}

module.exports = {
    get_message,
    post_block,
    post_payload,
    post_msg
}