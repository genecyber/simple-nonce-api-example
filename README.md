# simple-nonce-api-example
Example of an API using a nonce to mitigate man in the middle attacks

Available Calls: 
```
{
    "DeviceRegistration": "/v1/devices/123456/salt/9876",
    "Session": "/v1/nonce/98317653/session/992021355",
    "Action": "/v1/action/action/dosomething/nonce/66218932/session/275262287"
}
```

The first call: /v1/devices/123456/salt/9876 registers a device with the ID of 123456 and the salt of 9876
These ID's for this example need to be INT's and should be randomized
The above results in:
```
{
    "success":false,
    "response":"device does not exist",
    "session_id":32289248,
    "device_id":"123456",
    "nonce":64341928,
    "version":"0.1.4",
    "action":"registered new device"
}
```

The nonce value of 64341928 will be very important for your next call

Here is a program to help you encode your nonce value for your next call:
```
function encodeNonce(salt,nonce,deviceId) {
    return Number(salt.toString() + nonce.toString() + salt.toString()) / deviceId
}
```
And can be called like this:
```
var encoded = encodeNonce(9876, 64341928 , 123456)
```
resulting in a value of 80001323704.71971

to check or establish a session you will need to use your newly encoded nonce to be authorized for the call.
80001323704.71971

```
/v1/nonce/80001323704.71971/session/32289248
```
resulting in:
```
{
  "success":true,
  "response":"success",
  "nonce":30267681,
  "session_id":32289248,
  "action":"returned success with a new nonce"
}
```

Your next call will require an encoded version of the nonce provided above.
```
var encoded = encodeNonce(9876, 30267681 , 123456)
```
resulting in: 79998563673.04851

Now we can perform an action:

```
/v1/action/action/dosomething/nonce/79998563673.04851/session/32289248
```

resulting in:
```
{
  "success":true,
  "response":"success",
  "action_id":"6de412f2-daf1-4ec9-8915-83999bcf79f7",
  "nonce":76055496,
  "session_id":"32289248"
}
```

Notice that after registring the first time I'm never required to provide the device ID again for communication, not my salt.
There is not enough information provided in any call after the first to allow for unauthorized behavior nor playback attacks.


To get started
```
git clone https://github.com/genecyber/simple-nonce-api-example.git
cd simple-nonce-api-example
npm install
npm start
```
