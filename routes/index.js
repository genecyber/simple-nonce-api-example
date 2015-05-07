var express = require('express');
var router = express.Router();
var low = require('lowdb')

var version = "0.1.4"

var db = low('devices.json', {
  autosave: true, // automatically save database on change (default: true)
  async: true     // asyncrhonous write (default: true)
});


/* GET INFO */
router.get('/', function(req, res, next) {
  res.render('info',{info: getInfo() });
});

/*REGISTER*/
router.get('/v1/devices/:deviceId/salt/:salt',function(req, res, next) {
    var toUse
    console.log(req.params.deviceId)
    var nonExist = {success: false ,response: "device does not exist" }
    var nonceExists = {success: false ,response: "nonce exists" }
    var good = {
                "id": 4,
                "notes": "This is a mocked result",
                "member_id": 18580,
                "device_id": "123456789",
                "nonce": 98317653,
                "session_id": 275262287,
                "version": version,
                "created_at": new Date(),
                "updated_at": new Date(),
                "response": "success"
                }
    switch (req.params.deviceId) {
        default :
        var n = lookupDeviceById(req.params.deviceId)
        if (n == -1) {
            registerDevice(req.params.deviceId,req.params.salt, function(nonce,session){
                toUse = nonExist
                toUse.session_id = session
                toUse.device_id = req.params.deviceId
                toUse.nonce = nonce
                toUse.version = "0.1.4"
                toUse.action = "registered new device"
            }) } else {
                toUse = nonceExists
                //toUse.nonce = getNewNonceForDevice(req.params.deviceId)
            }
            
            break;
        case "456":
            toUse = nonActive
            break;
        case "789":
            toUse = nonceExists
            break;
        case "123456789":
            toUse = good
            break;
    }
    res.json(toUse)
})

/*SESSION*/
router.get('/v1/nonce/:nonce/session/:sessionId',function(req, res, next) {
var returnObj = {}
/*if (lookupDevice(req.params.nonce) == -1 )
    returnObj = { success: false, response: "device does not exist"}
else */if (lookupDeviceObject(req.params.nonce, req.params.sessionId) == -1)
    returnObj = { success: false, response: "unauthorized"}
else {
    var nonce = lookupDeviceObject(req.params.nonce, req.params.sessionId)
        if (nonce.encrypted.toString() === req.params.nonce) {
            console.log("closer")
            returnObj.success = true
            returnObj.response = "success"
            returnObj.nonce = getNewNonceForDevice(nonce.nonce,req.params.sessionId)
            returnObj.session_id = Number(req.params.sessionId)
            returnObj.action = "returned success with a new nonce"
            console.log(returnObj)
            return res.json(returnObj)
        } else {
            return res.json(returnObj)
        }
    }
    res.json(returnObj)
})

/*ACTION*/
router.get('/v1/action/:action/nonce/:nonce/session/:sessionId',function(req, res, next) {
var returnObj = {}
if (lookupDevice(req.params.nonce) == -1 )
    returnObj = { success: false, response: "device does not exist"}
else if (lookupDeviceObject(req.params.nonce, req.params.sessionId) == -1)
    returnObj = { success: false, response: "unauthorized"}
else {
    var nonce = lookupDevice(req.params.nonce)
    
        if (nonce.toString() === req.params.nonce) {
            returnObj.success = true
            returnObj.response = "success"
            returnObj.action_id = generateUUID()
            returnObj.nonce = getNewNonceForDevice(req.params.nonce, req.params.sessionId)
            returnObj.session_id = req.params.sessionId
            return res.json(returnObj)
        } else {
            return res.json(returnObj)
        }
    }
    res.json(returnObj)
})

module.exports = router;

function getInfo() {
return JSON.stringify({
        "DeviceRegistration": "/v1/devices/123456789/9876",
        "Session": "/v1/nonce/98317653/session/992021355",
        "Action": "/v1/action/action/dosomething/nonce/66218932/session/275262287" })
}

function registerDevice(deviceId, salt, cb) {
    var newNonce = getRandomInt(00000000,99999999)
    var session = getRandomInt(00000000,99999999)
    db('devices').push({deviceId: deviceId, nonce: newNonce, created_at: new Date(), session_id: session, salt: Number(salt) })
    db.save()
    cb(newNonce,session)
}

function getNewNonceForDevice(nonce, sessionId) {
    var newNonce = getRandomInt(00000000,99999999)
    console.log(newNonce)
    db('devices')
      .chain()
      .find({ nonce: Number(nonce), session_id: Number(sessionId) })
      .assign({ nonce: newNonce, updated_at: new Date()}).value()
    db.save()
    console.log("assigned!")
    return newNonce
}

function lookupDevice(nonce) {
    var search = db('devices').find({nonce: Number(nonce)})
    console.log(search)
    if (search !== undefined)
        return search.nonce
    return -1
}

function lookupDeviceById(id) {
    var search = db('devices').find({deviceId:id})
    if (search !== undefined)
        return search.nonce
    return -1
}

function lookupDeviceObject(nonce, session) {
    var searchQuery = { session_id: Number(session)}
    console.log(searchQuery)
    var search = db('devices').find(searchQuery)

    if (search !== undefined) {
        //var encryptedNonce = Number(search.nonce.toString() + search.salt.toString()) - search.deviceId
        var encryptedNonce = Number(search.salt.toString() + search.nonce.toString() + search.salt.toString()) / search.deviceId
        console.log(encryptedNonce)
        console.log(nonce)
        console.log(encryptedNonce === Number(nonce))
        if (encryptedNonce === Number(nonce))
            return {encrypted: encryptedNonce, nonce: search.nonce}
        return -1
    }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};