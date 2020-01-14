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
            const old_current_agg = await q.getItem(updated_pun.chan_yymm);
            const old_life_agg = await q.getItem(updated_pun.chan);
            log('found current', old_current_agg,old_life_agg);
            current_agg = upMonthly(old_current_agg, updated_pun);
            life_agg = upEver(old_life_agg, current_agg, updated_pun);
            break;
        }
        case 'REMOVE':{
            const deleted_pun = getOld(r)
            log('updated pun', deleted_pun);
            const old_current_agg = await q.getItem(deleted_pun.chan_yymm);
            const old_life_agg = await q.getItem(deleted_pun.chan);
            log('found current', old_current_agg, old_life_agg);
            current_agg = rmMonthly(old_current_agg, deleted_pun);
            life_agg = upEver(old_life_agg,current_agg,deleted_pun);
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

    const l_author = R.lensPath(['authors', author]);
    const l_author_avg = R.compose(l_author, R.lensProp('avg'))
    const l_pun = R.lensPath(['punsScores',punId])
    const l_author_pun = R.compose(l_author, l_pun)
    
    //if not existing, we initialize it
    const agg = !! current_agg? current_agg : {pk: newPun.chan_yymm}
    // updates pun score
    // covers case of author not seen before, but agg existing
    const agg0 = R.set(l_author_pun, score, agg)
    // updates avg
    const new_score = compute_score(R.view(l_author,agg0))
    const agg1 = R.set(l_author_avg, new_score, agg0);
    // current_agg.authors[author].avg = compute_score(current_agg.authors[author]);
    return agg1;
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
    const l_author = R.lensPath(['authors', author]);
    const l_author_avg = R.compose(l_author, R.lensProp('avg'))
    const l_yymm = R.lensPath(['yymm',yymm])
    const l_author_yymm = R.compose(l_author, l_yymm)
    
    const score = R.view(l_author_avg, monthlyAgg) //monthlyAgg.authors[author].avg;

    if (!! monthlyAgg.authors[author]){
        const agg = !! life_agg? life_agg : {pk: chan}
        // covers case of author not seen before, but agg existing
        const agg0 = R.set(l_author_yymm, score, agg)
        // updates avg
        const new_score = compute_score(R.view(l_author,agg0),'yymm')
        return R.set(l_author_avg, new_score, agg0);
    } else {
        delete life_agg.authors[author];
        return life_agg;
    }
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
