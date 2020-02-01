'use strict';
const api = jest.genMockFromModule('../slack_api');

function get_message(chan,ts){
    return `message ${chan} ${ts}`
}
function get_message_link(chan,ts){
    return `http://www.example.com/${chan}/${ts}`
}
api.get_message = get_message
api.get_message_link = get_message_link
module.exports = api