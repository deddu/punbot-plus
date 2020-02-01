'use strict';
const api = jest.genMockFromModule('../queries');

let r = Object.create(null);
function __setMockData(x){
    r = x;
}
async function getMsg (chan_author, msg_id){
    return Promise.resolve(r)
}

async function top10Ever (chan){
    return Promise.resolve(r)
}

async function shittiestEver(chan){
    return Promise.resolve(r)
}

async function top10Author (chan, author){
    return Promise.resolve(r)
}

async function shittiestAuthor (chan, author){
    return Promise.resolve(r)
}

async function top10Month (chan, yymm){
    return Promise.resolve(r)
}

async function shittiestMonth (chan, yymm){
    return Promise.resolve(r)
}

async function authorsRankMonth (chan, yymm){
    return Promise.resolve(r)
}

async function authorsRankEver (chan){
    return Promise.resolve(r)
}


module.exports = {
    __setMockData,
    getMsg,
    top10Ever,
    top10Author,
    top10Month,
    shittiestEver,
    shittiestAuthor,
    shittiestMonth,
    authorsRankEver,
    authorsRankMonth
}