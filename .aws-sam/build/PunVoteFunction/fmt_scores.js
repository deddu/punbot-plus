// all those should return slack 'blocks' arrays, so they can be feed to 
// slack_api.post_block

const fmt_scores = (scores) => {
    const fmt_score = (x) => ({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `<@${x}>: ${scores[x]}`
        }
    });
    const user_scores = Object.keys(scores)
    .filter(x => x != 'chan')
    .map(fmt_score);
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `* <#${scores.chan}> scores:* \t :cookie:|:doughnut:|:beer:|:donutcoin: +1 \t :hankey:|:lemon: -1   `
            }
        },
        {
            type: "divider"
        },
        ...user_scores
    ];
};

function fmt_shit (shitItems){
    // scores
    // [
    //     {
    //       sk: '1577740115.003800',
    //       score: 7,
    //       chan_author: 'CPRR5AD08:U09EZ7Z2R',
    //       text: {
    //         channel_actions_count: 0,
    //         messages: [Array],
    //         is_limited: false,
    //         has_more: true,
    //         channel_actions_ts: null,
    //         ok: true,
    //         latest: '1577740115.003800'
    //       },
    //       pk: 'CPRR5AD08:U09EZ7Z2R'
    //     }
    //   ]
    shitItem = shitItems[0];
    const [chan,author] = shitItem.pk.split(':');
    const text = shitItem.text;
    const score = shitItem.score;
    const date = new Date(Number(shitItem.sk)*1000);
    const blocks = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `<#${chan}> worse by <@${author}> is \n>${text} \n with a quite impressive ${score}`
            }
        }
    ]    
    return blocks;
}

module.exports = {
    fmt_scores,
    fmt_shit
}