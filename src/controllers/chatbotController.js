require("dotenv").config();
import request from "request";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const {dockStart} = require('@nlpjs/basic');

let getHomePage = (req, res) => {
    /*
    res.writeHead('200', {'content-type': 'text/html'});
    //đọc file code.html encode utf8
    fs.readFile('../views/index.html', 'utf8', function (err, data) {
        if (err) throw err;
        // in ra nội dung đọc được
        res.write(data);
        //kết thúc response
        res.end();
    });
    */
};

let getChat = async (req, res) => {
    var msg = req.query.msg;
    (async () => {
        const dock = await dockStart({use: ['Basic']});
        const nlp = dock.get('nlp');
        await nlp.addCorpus('src/services/corpus-vi.json');
        await nlp.train();
        const response = await nlp.process('vi', msg);
        console.log(response);
        if (response.answers.length == 0) {
            res.send("Xin lỗi, tôi không hiểu bạn nói gì!");
        } else {
            res.send(response.answer);
        }
    })();
}

let getWebhook = (req, res) => {
    // Your verify token. Should be a random string.

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
};

let postWebhook = (req, res) => {

    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {
            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);


            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
};

// Handles messages events
function handleMessage(sender_psid, received_message) {

    var response;

    // Check if the message contains text
    if (received_message.text) {

        // Create the payload for a basic text message
        let msg = received_message.text.toLowerCase();
        (async () => {
            const dock = await dockStart({use: ['Basic']});
            const nlp = dock.get('nlp');
            await nlp.addCorpus('src/services/corpus-vi.json');
            await nlp.train();
            const response_ = await nlp.process('vi', msg);
            console.log(response_);
            if (response_.answers.length == 0) {
                response = {
                    "text": `Xin lỗi, tôi không hiểu bạn nói gì!`
                }
                callSendAPI(sender_psid, response);
            } else {
                response = {
                    "text": response_.answer
                }
                callSendAPI(sender_psid, response);
            }
        })();

    }
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {

    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {"access_token": PAGE_ACCESS_TOKEN},
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

module.exports = {
    getChat: getChat,
    getHomePage: getHomePage,
    getWebhook: getWebhook,
    postWebhook: postWebhook
};
