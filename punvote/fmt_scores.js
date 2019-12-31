const R = require('ramda');
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
- \`rank [YYYY-MM]\` *eg:* _rank 2020-01_
`
// - :construction-worker: ~rank~ [YYYY-MM|ever]
        }
    }
]

const fmt_one_rank = (x) =>{
    const block = {   type: "section",
    text: {
        type: "mrkdwn",
        text: `*${x.score}* <@${x.author}>`
    }}
    return block;
}

const fmt_ranks = (title, rnk) => {
    // {
    //     "authors": {
    //       "U09EZ7Z2R": {
    //         "avg": 6.666666666666667,
    //         "punsScores": {
    //           "1577813196.006300": 3,
    //           "1577813575.007300": 9,
    //           "1577814220.008300": 8
    //         }
    //       }
    //     },
    //     "pk": "CPRR5AD08:2019-12"
    //   }
    
    
    const authors_scores = R.pluck('avg', rnk.authors)
    //{ U09EZ7Z2R: 6.666666666666667, bob: 3 }
    const p = R.toPairs(authors_scores)
    //[['U09..','6'],['bob','3']]
    const lz = R.map(x=>({'author':x[0],score:x[1]}),p)
    // [{author:u.., score: 6},..]
    const ordered = R.sortWith([R.descend(R.prop('score'))], lz)
    
    const user_blocks = ordered.map(fmt_one_rank)

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
    fmt_items,
    fmt_ranks
}