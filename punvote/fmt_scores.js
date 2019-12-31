// all those should return slack 'blocks' arrays, so they can be feed to 
// slack_api.post_block
const default_message = [
    {
        type: "section",
        text: {
            type: "mrkdwn",
            text: `punbot tracks reaction votes :zero: - :keycap_ten: when added to messages.
you can ask for 
- \`top10 [@user|YYYY-MM|ever]\` *eg:* _top10 2019-12_
- \`shit [@user|YYYY-MM|ever]\`  *eg:* _shit ever_
`
// - :construction-worker: ~rank~ [YYYY-MM|ever]
        }
    }
]
const fmt_one = (x) => {      
    // {
    //       sk: '1577740115.003800',
    //       score: 7,
    //       chan_author: 'CPRR5AD08:U09EZ7Z2R',
    //       text: 'bad pun',
    //       link: 'https://blah,
    //       pk: 'CPRR5AD08:U09EZ7Z2R'
    //     }
    const [chan,author] = x.pk.split(':');
    const epochDate = x.sk.split('.')[0];    
    const block = {   type: "section",
    text: {
        type: "mrkdwn",
        text: `*${x.score}* <@${author}>:\n>${x.text}\n<!date^${epochDate}^{date_short}^${x.link}|fallback>`
    }}
    return block;
};

function fmt_items (title, items){
    // scores
    // [
    //     {
    //       sk: '1577740115.003800',
    //       score: 7,
    //       chan_author: 'CPRR5AD08:U09EZ7Z2R',
    //       text: 'bad pun',
    //       link: 'https://blah,
    //       pk: 'CPRR5AD08:U09EZ7Z2R'
    //     }
    //   ]
    
    const user_blocks = items.map(fmt_one)

    const blocks = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: title
            }
        },
        {
            type: "divider"
        },
        ...user_blocks
    ]

    return blocks;
}


module.exports = {
    default_message,
    fmt_items
}