const fmt_scores = (scores) => {
    const fmt_score = (x) => ({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `<@${x}>: ${scores[x]}`
        }
    });
    const user_scores = Object.keys(scores)
        .filter(x => x != 'chan')
        .map(fmt_score);
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `* <#${scores.chan}> scores:* \t :cookie:|:doughnut:|:beer:|:donutcoin: +1 \t :hankey:|:lemon: -1   `
            }
        },
        {
            type: "divider"
        },
        ...user_scores
    ];
};
exports.fmt_scores = fmt_scores;
