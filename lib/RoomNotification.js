/**
 * Created by ghostmac on 6/1/16.
 */


var EventEmitter = require('events')
var util = require('util')
function RoomNotification() {
    EventEmitter.call(this)
    var self = this


}
util.inherits(RoomNotification, EventEmitter)


module.exports = RoomNotification