//api, votes, and aggregations reads 
const AWS = require('aws-sdk');
const R = require('ramda');
const q = require('./queries');
const mut = require('./mutations');
const log = require('debug')('monthly:index');

const newItemLens = R.lensPath(['dynamodb','NewImage'])
const oldItemLens = R.lensPath(['dynamodb','OldImage'])

function compute_score(author_aggregate,field='punsScores') {
    const keys = Object.keys(author_aggregate[field])
    const tot =  keys.reduce((acc,x) => author_aggregate[field][x]+ acc, 0)
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
    let current_agg, life_agg
    switch (r.eventName){
        case 'INSERT':
        case 'MODIFY':{
            const updated_pun = getNew(r)
            //so we have the new pun. We go grab this fella's record for this chan
            current_agg = await q.getItem(updated_pun.chan_yymm);
            life_agg = await q.getItem(updated_pun.chan);
            log('found current', current_agg,life_agg);
            current_agg = upMonthly(current_agg, updated_pun);
            life_agg = upEver(life_agg, current_agg, updated_pun);
            break;
        }
        case 'REMOVE':{
            const deleted_pun = getOld(r)
            log('updated pun', deleted_pun);
            current_agg = await q.getItem(deleted_pun.chan_yymm);
            life_agg = await q.getItem(deleted_pun.chan);
            log('found current', current_agg, life_agg);
            current_agg = rmMonthly(current_agg, deleted_pun);
            life_agg = upEver(life_agg,current_agg,deleted_pun);
            break;
        }
    }
    log('updating with', current_agg,life_agg);
    await mut.put_record(current_agg);
    await mut.put_record(life_agg);
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

// {
//        pk: chan_yymm
//        authors : {
//          author_id:{
//            avg:number,
//            punsScores: { punId:number }
//            }
//        }
//      }
function upMonthly(current_agg, newPun) {
    const [chan,author] = newPun.pk.split(':');
    const score = newPun.score;
    const punId = newPun.sk;
    if (!current_agg) {
        //not existing, we initialize it
        current_agg = {
            pk: newPun.chan_yymm,
            authors: {
                [author]: {
                    avg: 0,
                    punsScores: {}
                }
            }
        };
    }
    // updates pun score
    current_agg.authors[author].punsScores[punId] = score;
    // updates avg
    current_agg.authors[author].avg = compute_score(current_agg.authors[author]);
    return current_agg;
}

// {
//        pk: chan
//        authors : {
//          author_id:{
//            avg:number,
//            yymm: { yymm:number }
//            }
//        }
//      }
function upEver(life_agg, monthlyAgg, pun) {
    const [chan,yymm] = monthlyAgg.pk.split(':');
    const [_,author] = pun.pk.split(':');
    if (!! monthlyAgg.authors[author]){
        const score = monthlyAgg.authors[author].avg;
        if (!life_agg) {
            //not existing, we initialize it
            life_agg = {
                pk: chan,
                authors: {
                    [author]: {
                        avg: 0,
                        yymm: {}
                    }
                }
            };
        }
        // updates pun score
        life_agg.authors[author].yymm[yymm] = score;
        // updates avg
        life_agg.authors[author].avg = compute_score(life_agg.authors[author],'yymm');
    } else {
        delete life_agg.authors[author];
    }
    return life_agg;
}




function rmMonthly(current_agg, deleted_pun) {
    const [chan, author] = deleted_pun.pk.split(':');
    const punId = deleted_pun.sk;
    delete current_agg.authors[author].punsScores[punId];
    if (Object.keys(current_agg.authors[author].punsScores) <= 0) {
        //doesn't have any more puns, let's remove him
        delete current_agg.authors[author];
    }
    else {
        //still has puns to score
        current_agg.authors[author].avg = compute_score(current_agg.authors[author]);
    }
    log(current_agg);
    return current_agg;
}




exports.compute_score = compute_score;
exports.newItemLens = newItemLens;
exports.oldItemLens = oldItemLens;
exports.getNew = getNew;
exports.getOld = getOld;
exports.upMonthly = upMonthly;
exports.rmMonthly = rmMonthly;
exports.upEver = upEver;
