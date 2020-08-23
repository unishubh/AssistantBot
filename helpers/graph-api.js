// Imports dependencies
const request = require('request');
const camelCase = require('camelcase');
const config = require('./config');

module.exports = class GraphAPi {
  static callSendAPI(requestBody) {
    // Send the HTTP request to the Messenger Platform
    request(
      {
        uri: `${config.mPlatfom}/me/messages`,
        qs: {
          access_token: config.pageAccesToken,
        },
        method: 'POST',
        json: requestBody,
      },
      (error) => {
        if (error) {
          console.error('Unable to send message:', error);
        }
      },
    );
  }

  static callMessengerProfileAPI(requestBody) {
    // Send the HTTP request to the Messenger Profile API

    console.log(`Setting Messenger Profile for app ${config.appId}`);
    request(
      {
        uri: `${config.mPlatfom}/me/messenger_profile`,
        qs: {
          access_token: config.pageAccesToken,
        },
        method: 'POST',
        json: requestBody,
      },
      (error, _res, body) => {
        if (!error) {
          console.log('Request sent:', body);
        } else {
          console.error('Unable to send message:', error);
        }
      },
    );
  }

  static callSubscriptionsAPI() {
    // Send the HTTP request to the Subscriptions Edge to configure your webhook
    // You can use the Graph API's /{app-id}/subscriptions edge to configure and
    // manage your app's Webhooks product
    // https://developers.facebook.com/docs/graph-api/webhooks/subscriptions-edge
    console.log(
      `Setting app ${config.appId} callback url to ${config.webhookUrl}`,
    );
    request(
      {
        uri: `${config.mPlatfom}/${config.appId}/subscriptions`,
        qs: {
          access_token: `${config.appId}|${config.appSecret}`,
          object: 'page',
          callback_url: config.webhookUrl,
          verify_token: config.verifyToken,
          fields:
                        'messages, messaging_postbacks, messaging_optins, \
                      message_deliveries, messaging_referrals ',
          include_values: 'true',
        },
        method: 'POST',
      },
      (error, _res, body) => {
        if (!error) {
          console.log('Request sent:', body);
        } else {
          console.error('Unable to send message:', error);
        }
      },
    );
  }

  static callSubscribedApps() {
    // Send the HTTP request to subscribe an app for Webhooks for Pages
    // You can use the Graph API's /{page-id}/subscribed_apps edge to configure
    // and manage your pages subscriptions
    // https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
    console.log(`Subscribing app ${config.appId} to page ${config.pageId}`);
    request(
      {
        uri: `${config.mPlatfom}/${config.pageId}/subscribed_apps`,
        qs: {
          access_token: config.pageAccesToken,
          subscribed_fields:
                        'messages, messaging_postbacks, messaging_optins, \
                      message_deliveries, messaging_referrals ',
        },
        method: 'POST',
      },
      (error) => {
        if (error) {
          console.error('Unable to send message:', error);
        }
      },
    );
  }

  static async getUserProfile(senderPsid) {
    try {
      const userProfile = await this.callUserProfileAPI(senderPsid);

      for (const key in userProfile) {
        const camelizedKey = camelCase(key);
        const value = userProfile[key];
        delete userProfile[key];
        userProfile[camelizedKey] = value;
      }
      return userProfile;
    } catch (err) {
      console.log('Fetch failed:', err);
    }
  }

  static callUserProfileAPI(senderPsid) {
    return new Promise(((resolve, reject) => {
      let body = [];

      // Send the HTTP request to the Graph API
      console.log(`${config.mPlatfom}/${senderPsid}`);
      request({
        uri: `${config.mPlatfom}/${senderPsid}`,
        qs: {
          access_token: config.pageAccesToken,
          fields: 'first_name, last_name,locale,email',
        },
        method: 'GET',
      })
        .on('response', (response) => {
          console.log(response.statusCode);

          if (response.statusCode !== 200) {
            reject(Error(response.statusCode));
          }
        })
        .on('data', (chunk) => {
          body.push(chunk);
        })
        .on('error', (error) => {
          console.error(`Unable to fetch profile:${error}`);
          reject(Error('Network Error'));
        })
        .on('end', () => {
          body = Buffer.concat(body).toString();
          // console.log(JSON.parse(body));

          resolve(JSON.parse(body));
        });
    }));
  }

  static getPersonaAPI() {
    return new Promise(((resolve, reject) => {
      let body = [];

      // Send the POST request to the Personas API
      console.log(`Fetching personas for app ${config.appId}`);

      request({
        uri: `${config.mPlatfom}/me/personas`,
        qs: {
          access_token: config.pageAccesToken,
        },
        method: 'GET',
      })
        .on('response', (response) => {
          // console.log(response.statusCode);

          if (response.statusCode !== 200) {
            reject(Error(response.statusCode));
          }
        })
        .on('data', (chunk) => {
          body.push(chunk);
        })
        .on('error', (error) => {
          console.error(`Unable to fetch personas:${error}`);
          reject(Error('Network Error'));
        })
        .on('end', () => {
          body = Buffer.concat(body).toString();
          // console.log(JSON.parse(body));

          resolve(JSON.parse(body).data);
        });
    }));
  }

  static postPersonaAPI(name, profilePictureUrl) {
    let body = [];

    return new Promise(((resolve, reject) => {
      // Send the POST request to the Personas API
      console.log(`Creating a Persona for app ${config.appId}`);

      const requestBody = {
        name,
        profilePictureUrl,
      };

      request({
        uri: `${config.mPlatfom}/me/personas`,
        qs: {
          access_token: config.pageAccesToken,
        },
        method: 'POST',
        json: requestBody,
      })
        .on('response', (response) => {
          // console.log(response.statusCode);
          if (response.statusCode !== 200) {
            reject(Error(response.statusCode));
          }
        })
        .on('data', (chunk) => {
          body.push(chunk);
        })
        .on('error', (error) => {
          console.error('Unable to create a persona:', error);
          reject(Error('Network Error'));
        })
        .on('end', () => {
          body = Buffer.concat(body).toString();
          // console.log(JSON.parse(body));

          resolve(JSON.parse(body).id);
        });
    })).catch((error) => {
      console.error('Unable to create a persona:', error, body);
    });
  }

  static callNLPConfigsAPI() {
    // Send the HTTP request to the Built-in NLP Configs API
    // https://developers.facebook.com/docs/graph-api/reference/page/nlp_configs/

    console.log(`Enable Built-in NLP for Page ${config.pageId}`);
    request(
      {
        uri: `${config.mPlatfom}/me/nlp_configs`,
        qs: {
          access_token: config.pageAccesToken,
          nlp_enabled: true,
        },
        method: 'POST',
      },
      (error, _res, body) => {
        if (!error) {
          console.log('Request sent:', body);
        } else {
          console.error('Unable to activate built-in NLP:', error);
        }
      },
    );
  }

  static callFBAEventsAPI(senderPsid, eventName) {
    // Construct the message body
    const requestBody = {
      event: 'CUSTOM_APP_EVENTS',
      custom_events: JSON.stringify([
        {
          _eventName: 'postback_payload',
          _value: eventName,
          _origin: 'original_coast_clothing',
        },
      ]),
      advertiser_tracking_enabled: 1,
      application_tracking_enabled: 1,
      extinfo: JSON.stringify(['mb1']),
      page_id: config.pageId,
      page_scoped_user_id: senderPsid,
    };

    // Send the HTTP request to the Activities API
    request(
      {
        uri: `${config.mPlatfom}/${config.appId}/activities`,
        method: 'POST',
        form: requestBody,
      },
      (error) => {
        if (!error) {
          console.log(`FBA event '${eventName}'`);
        } else {
          console.error(`Unable to send FBA event '${eventName}':${error}`);
        }
      },
    );
  }
};
