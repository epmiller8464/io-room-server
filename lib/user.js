/**
 * Created by ghostmac on 5/26/16.
 */



var User = function User(opts) {
    var self = this
    self.id = opts.id
    self.username = opts.username
    self.socket = opts.socket
    self.broadcaster = opts.broadcaster || false
    self.channel = opts.channel || ''
}


module.exports = User