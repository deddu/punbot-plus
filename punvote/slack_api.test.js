const {verify } = require('./slack_api');


test('verifies signatures correctly', () => {
    // this test signature is hardcoded and made from the secret
    // if you change either it will fail. 
    // more on the algorithm for verification here:
    // https://api.slack.com/docs/verifying-requests-from-slack
    // and here:
    // https://nodejs.org/api/crypto.html#crypto_crypto_createhmac_algorithm_key_options
    const sec = 'who eats pasta for breakfast'
    const rq={headers:{
        'X-Slack-Request-Timestamp': '1581387530',
        'X-Slack-Signature': 'v0=ea445ea6f124af27826c730092f53a1926fe12a7569e2bbd480af3cc95473b52' 
    },
    body:'{"token":"maDeUp","team_id":"pu99a","api_app_id":"unkwtat","event":{"type":"reaction_added","user":"U1","item":{"type":"message","channel":"C2","ts":"1579016133.000200"},"reaction":"eight","item_user":"U1","event_ts":"1581387529.000100"},"type":"event_callback","event_id":"E9","event_time":1581387529,"authed_users":["U1"]}'
}
  expect(verify(rq, sec)).toBe(true);

});
