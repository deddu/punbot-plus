//api, votes, and aggregations reads 
const AWS = require('aws-sdk');
const R = require('ramda');
const q = require('./queries');
const mut = require('./mutations');

const newItemLens = R.lensPath(['dynamodb','NewImage'])
const oldItemLens = R.lensPath(['dynamodb','OldImage'])

const documentClient = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.TABLE_NAME || "monthlyScoresTable"

const compute_score = (author_aggregate) => {
    const keys = Object.keys(author_aggregate.punsScores)
    const tot =  keys.reduce((acc,x) => author_aggregate.punsScores[x]+ acc, 0)
    return tot / (keys.length)
}

// {
//        pk: chan_yymm
//        authors : {
//          author_id:{
//            avg:number,
//            punsScores: { punId:number }
//            }
//        }
//      }
function process_record(r){
    switch (r.eventName){
        case 'INSERT':
        case 'MODIFY':{
            const updated_pun = AWS.DynamoDB.Converter.unmarshall(R.view(newItemLens,r))
            //so we have the new pun. We go grab this fella's record for this chan
            console.log('updated pun', updated_pun);
            const [chan,author] = updated_pun.pk.split(':');
            const score = updated_pun.score;
            const punId = updated_pun.sk;
            let current_agg = await q.getItem(updated_pun.chan_yymm);
            if (!current_agg){
                //not existing, we initialize it
                current_agg = {
                    pk:updated_pun.chan_yymm,
                    authors:{
                        [author]:{
                            avg:0,
                            punsScores:{}
                        }
                    }
                }
            }
            
            // updates pun score
            current_agg.authors[author].punsScores[punId]=score;
            // updates avg
            current_agg.authors[author].avg = compute_score(current_agg.authors[author]);
            await mut.put_record(current_agg);
            return current_agg;
        }
        case 'DELETE':{
            const deleted_pun = AWS.DynamoDB.Converter.unmarshall(R.view(oldItemLens,r))
            console.log('updated pun', deleted_pun);
            const [chan,author] = deleted_pun.pk.split(':');
            const punId = deleted_pun.sk;
            let current_agg = await q.getItem(updated_pun.chan_yymm);
            delete current_agg.authors[author].punsScores[punId]
            if (Object.keys(current_agg.authors[author].punsScores)>0){
                //still has puns to score
                current_agg.authors[author].avg = compute_score(current_agg.authors[author]);
            }
            else {
                //doesn't have any more puns, let's give him a nice 0
                current_agg.authors[author].avg = 0
            }
            await mut.put_record(current_agg);
            return current_agg;
        }
    }
}  

exports.handler = async (event) => {
    console.log(event);
    const data = event.Records;
    data.map(process_record)
    
    return event;
};
