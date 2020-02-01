'use strict';
const api = jest.genMockFromModule('../mutations');
const put_record = (record)=>{
    return "ok"
};

const delete_record = (chan_author, msgId)=>{
    "ok"
};

module.exports = {
    put_record,
    delete_record
}