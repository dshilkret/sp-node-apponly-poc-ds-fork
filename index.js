var fs = require('fs');
var jwt = require('jsonwebtoken');
var url = require("url");
var request = require("request");


/*
 * base64.js: An extremely simple implementation of base64 encoding / decoding using node.js Buffers
 *
 * (C) 2010, Nodejitsu Inc.
 * (C) 2011, Cull TV, Inc.
 *
 */

var base64 = exports;

base64.encode = function(unencoded) {
  return new Buffer(unencoded || '').toString('base64');
};

base64.decode = function(encoded) {
  return new Buffer(encoded || '', 'base64').toString('utf8');
};

base64.urlEncode = function(unencoded) {
  var encoded = base64.encode(unencoded);
  return encoded.replace('+', '-').replace('/', '_').replace(/=+$/, '');
};

base64.urlDecode = function(encoded) {
  encoded = encoded.replace('-', '+').replace('_', '/');
  while (encoded.length % 4)
    encoded += '=';
  return base64.decode(encoded);
};

var siteUrl = 'https://spwzb27rov2c3sm.eastus2.cloudapp.azure.com';
var sharepointhostname = url.parse(siteUrl).hostname;
var clientid = 'b66f7e77-de3e-45d2-ba4c-b1b6405ec214';
var realm = 'ddd67120-9259-451c-ad8f-b8cc3b28fac3' // equals to SharePoint Farm ID
var issuerid = '9e9e46c4-6329-4990-a0b8-13b87b3ba56a'+ "@" + realm;
var audience = '00000003-0000-0ff1-ce00-000000000000/' + sharepointhostname + '@' + realm;
var x5t = 'QOCIyWwlxy8bM40Og6yzuj9vYkU';  //shaThumbprint: 'QOCIyWwlxy8bM40Og6yzuj9vYkU'
var keyFilePath = 'C:\\cert\\HighTrustOAuth.key';

var options = {
  key: fs.readFileSync(keyFilePath) //Use SN code equiv.
};

var dateref = parseInt((new Date()).getTime() / 1000);

var rs256 = {
  typ: "JWT",
  alg: "RS256",
  x5t: x5t
}

var actortoken = {
  aud: audience,
  iss: issuerid,
  nameid: clientid + '@' + realm,
  nbf: (dateref - 21600).toString(), //Use SN date-time now
  exp: "1633881331",//(dateref + 21600).toString(),
  trustedfordelegation: true
}
//get accessToken
var accessToken = jwt.sign(actortoken, options.key, { header: rs256 });
var outerHead = base64.urlEncode('{"typ":"JWT", "alg":"none"}');
var outerBodyPre = {"iss":"9e9e46c4-6329-4990-a0b8-13b87b3ba56a@f094a07e-5375-4b96-a81c-f651a25f5788","nameid":"s-1-5-21-2127521184-1604012920-1887927527-2963467", "nii":"urn:office:idp:activedirectory","nbf":"1403212820", "exp":"1633881331","actortoken":accessToken};
var outerBody = base64.urlEncode(JSON.stringify(outerBodyPre));
 var outerToken = outerHead + '.' + outerBody;
request.get({
  url: `${siteUrl}/_api/web/lists`,
  rejectUnauthorized: false,
  headers: {
    'Accept': 'application/json;odata=verbose',
    'Authorization': 'Bearer ' + outerToken  //accessToken
  }
}, function (error, response, body) {
  
  if (!error) {
    var listdata = JSON.parse(body);
    if (listdata.d && listdata.d.results) {

      for (var ri in listdata.d.results) {
        var list = listdata.d.results[ri];
        console.log(list.Title);
      }
    }
  } else {
    console.log("error");
  }
});