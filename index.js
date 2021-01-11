require('dotenv').config()

// Imports the Dialogflow library
const dialogflow = require('@google-cloud/dialogflow');

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const port = 3000

// Dialogflow config
const projectId = process.env.PROJECT_ID;
const languageCode = process.env.LANGUAGE_CODE;

// Instantiates a session client
const sessionClient = new dialogflow.SessionsClient();

let contexts = {};

async function detectIntent(
  sessionId,
  query,
  contexts,
) {
  // The path to identify the agent that owns the created intent.
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: languageCode,
      },
    },
  };

  if (contexts && contexts.length > 0) {
    request.queryParams = {
      contexts: contexts,
    };
  }

  const responses = await sessionClient.detectIntent(request);
  return responses[0];
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', async (req, res) => {
  try {
    let sessionId = req.body.sessionId;
    let query = req.body.message;

    console.log(`Sending Query: ${query}`);
    let intentResponse = await detectIntent(
      sessionId,
      query,
      contexts[sessionId],
    );
    console.log('Detected intent');
    // console.log(
    //   `Fulfillment Text: ${intentResponse.queryResult.fulfillmentText}`
    // );
    // Use the context from this response for next queries
    contexts[sessionId] = intentResponse.queryResult.outputContexts;

    res.send(intentResponse);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
})

app.listen(port, () => {
  console.log(`Dialogflow proxy app listening at http://localhost:${port}`)
})

/*async function executeQueries(projectId, sessionId, queries, languageCode) {
  // Keeping the context across queries let's us simulate an ongoing conversation with the bot
  let context;
  let intentResponse;
  for (const query of queries) {
    try {
      console.log(`Sending Query: ${query}`);
      intentResponse = await detectIntent(
        projectId,
        sessionId,
        query,
        context,
        languageCode
      );
      console.log('Detected intent');
      console.log(
        `Fulfillment Text: ${intentResponse.queryResult.fulfillmentText}`
      );
      // Use the context from this response for next queries
      context = intentResponse.queryResult.outputContexts;
    } catch (error) {
      console.log(error);
    }
  }
}
executeQueries(projectId, sessionId, queries, languageCode);*/