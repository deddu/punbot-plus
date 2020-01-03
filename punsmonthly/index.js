//api, votes, and aggregations reads 
const AWS = require('aws-sdk');
const R = require('ramda');
const q = require('./queries');
const mut = require('./mutations');
const log = require('debug')('monthly:index');

const newItemLens = R.lensPath(['dynamodb','NewImage'])
const oldItemLens = R.lensPath(['dynamodb','OldImage'])

const compute_score = (author_aggregate) => {
    const keys = Object.keys(author_aggregate.punsScores)
    const tot =  keys.reduce((acc,x) => author_aggregate.punsScores[x]+ acc, 0)
    return tot / (keys.length)
}

const getNew = (x) => AWS.DynamoDB.Converter.unmarshall(R.view(newItemLens, x))
const getOld = (x) => AWS.DynamoDB.Converter.unmarshall(R.view(oldItemLens, x))


// {
//        pk: chan_yymm
//        authors : {
//          author_id:{
//            avg:number,
//            punsScores: { punId:number }
//            }
//        }
//      }
async function process_record(r){
    let current_agg 
    switch (r.eventName){
        case 'INSERT':
        case 'MODIFY':{
            const updated_pun = getNew(r)
            //so we have the new pun. We go grab this fella's record for this chan
            
            const [chan,author] = updated_pun.pk.split(':');
            const score = updated_pun.score;
            const punId = updated_pun.sk;
            current_agg = await q.getItem(updated_pun.chan_yymm);
            log('found current', current_agg);

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
            log('updating with', current_agg);
            await mut.put_record(current_agg);
            break;
        }
        case 'REMOVE':{
            const deleted_pun = getOld(r)
            log('updated pun', deleted_pun);
            const [chan,author] = deleted_pun.pk.split(':');
            const punId = deleted_pun.sk;
            current_agg = await q.getItem(deleted_pun.chan_yymm);
            log('found current', current_agg);
            delete current_agg.authors[author].punsScores[punId]
            if (Object.keys(current_agg.authors[author].punsScores)>0){
                //still has puns to score
                current_agg.authors[author].avg = compute_score(current_agg.authors[author]);
            }
            else {
                //doesn't have any more puns, let's give him a nice 0
                current_agg.authors[author].avg = 0
            }
            log('updating with', current_agg);
            await mut.put_record(current_agg);
            break;
        }
    }
    return current_agg;
}  

exports.handler = async (event) => {
    log(event);
    const data = event.Records;
    for (r of  data){
        log("processing", r)
        await process_record(r)
    }
        
    
    return event;
};

exports.compute_score = compute_score;
exports.newItemLens = newItemLens;
exports.oldItemLens = oldItemLens;
exports.getNew = getNew;
exports.getOld = getOld;