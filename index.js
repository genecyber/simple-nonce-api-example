var express = require('express');
var router = express.Router();
var low = require('lowdb')

var db = low('devices.json', {
  autosave: true, // automatically save database on change (default: true)
  async: true     // asyncrhonous write (default: true)
});


/* GET INFO */
router.get('/', function(req, res, next) {
  res.render('info',{info: getInfo() });
});

/*IS REGISTERED?*/
router.get('/garmin/devices/:deviceId',function(req, res, next) {
    var toUse
    console.log(req.params.deviceId)
    var nonExist = {success: false ,response: "device does not exist" }
    var nonActive = {success: false ,response: "member is not active" }
    var nonceExists = {success: false ,response: "nonce exists" }
    var good = {
                "id": 4,
                "member_id": 18580,
                "device_id": "123456789",
                "nonce": 98317653,
                "session_id": 275262287,
                "version": "3.1.4",
                "created_at": "2015-04-10 16:08:24",
                "updated_at": "2015-04-10 11:14:14",
                "response": "success"
                }
    switch (req.params.deviceId) {
        default :
        var n = lookupDevice(req.params.deviceId)
        if (n == -1) {
            registerDevice(req.params.deviceId,function(nonce,session){
                toUse = nonExist
                toUse.session_id = session
                toUse.device_id = req.params.deviceId
                toUse.nonce = nonce
                toUse.version = "3.1.4"
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
router.get('/garmin/devices/:deviceId/version/:version/nonce/:nonce/session/:sessionId',function(req, res, next) {
var returnObj = {}
if (lookupDevice(req.params.deviceId) == -1 )
    returnObj = { success: false, response: "device does not exist"}
else if (lookupDeviceObject(req.params.deviceId, req.params.nonce, req.params.sessionId) == -1)
    returnObj = { success: false, response: "unauthorized"}
else {
    var nonce = lookupDevice(req.params.deviceId)
        if (nonce.toString() === req.params.nonce) {
            console.log("closer")
            returnObj.success = true
            returnObj.response = "success"
            returnObj.nonce = getNewNonceForDevice(req.params.deviceId)
            returnObj.session_id = req.params.sessionId
            res.json(returnObj)
        } else {
            res.json(returnObj)
        }
    }
    res.json(returnObj)
})

/*ALERT*/
router.get('/garmin/devices/:deviceId/alert/lat/:lat/lon/:lon/nonce/:nonce/session/:sessionId',function(req, res, next) {
var returnObj = {}
if (lookupDevice(req.params.deviceId) == -1 )
    returnObj = { success: false, response: "device does not exist"}
else if (lookupDeviceObject(req.params.deviceId, req.params.nonce, req.params.sessionId) == -1)
    returnObj = { success: false, response: "unauthorized"}
/*else 
    returnObj = {
        "success": true,
        "response": "success",
        "alert_id": "4489B874-E648-44FC-B8E9-DF77ABCE819D",
        "nonce": 66218932,
        "session_id": 275262287
      }*/
    var nonce = lookupDevice(req.params.deviceId)
    
        if (nonce.toString() === req.params.nonce) {
            returnObj.success = true
            returnObj.response = "success"
            returnObj.nonce = getNewNonceForDevice(req.params.deviceId)
            returnObj.session_id = req.params.sessionId
            res.json(returnObj)
        } else {
            res.json(returnObj)
        }
})

module.exports = router;

function getInfo() {
return JSON.stringify({
        "registerDevice": {
            "good": "/garmin/devices/123456789/",
            "newDevice": "/garmin/devices/123/",
            "inactive": "/garmin/devices/456/",
            "registered": "/garmin/devices/66218932/"
        },
        "newSession": {
            "good": "/garmin/devices/123456789/version/3.1.4/nonce/98317653/session/992021355",
            "unregistered": "/garmin/devices/123/version/3.1.4/nonce/98317653/session/992021355",
            "unauthorized": "/garmin/devices/123456789/version/3.14/nonce/98317653/session/992021355"
        },
        "newAlert": {
            "good": "/garmin/devices/123456789/alert/lat/101/lon/101/nonce/66218932/session/275262287",
            "unregistered": "/garmin/devices/123/alert/lat/101/lon/101/nonce/66218932/session/275262287",
            "unauthorized": "/garmin/devices/123456789/alert/lat/101/lon/101/nonce/98317653/session/992021355"
        }
    })
}

function registerDevice(deviceId, cb) {
    var newNonce = getRandomInt(00000000,99999999)
    var session = getRandomInt(00000000,99999999)
    db('devices').push({deviceId: deviceId, nonce: newNonce, created_at: new Date(), session_id: session, version: "3.1.4" })
    db.save()
    cb(newNonce,session)
}

function getNewNonceForDevice(id) {
    var newNonce = getRandomInt(00000000,99999999)
    console.log(newNonce)
    db('devices')
      .chain()
      .find({ deviceId: id })
      .assign({ nonce: newNonce, udated_at: new Date()}).value()
    db.save() 
    return newNonce
}

function lookupDevice(id) {
    var search = db('devices').find({deviceId:id})
    if (search !== undefined)
        return search.nonce
    return -1
}

function lookupDeviceAndNonce(id,nonce) {
    var search = db('devices').find({deviceId:id,nonce:nonce})

    if (search !== undefined)
        return search.nonce
    return -1
}

function lookupDeviceObject(id,nonce,session) {
    var searchQuery = {deviceId:id, nonce: Number(nonce), session_id: Number(session)}
    console.log(searchQuery)
    var search = db('devices').find(searchQuery)

    if (search !== undefined)
        return search.nonce
    return -1
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}