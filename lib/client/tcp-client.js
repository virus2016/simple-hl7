var Parser = require('../hl7/parser.js');
var net = require('net')
var Q = require('q');

var VT = String.fromCharCode(0x0b);
var FS = String.fromCharCode(0x1c);
var CR = String.fromCharCode(0x0d);

function TcpClient(host, port) {
    this.host = host;
    this.port = port;
    this.parser = new Parser({
        segmentSeperator: '\r'
    });
}

TcpClient.prototype.send = function (msg) {
    var self = this;
    var deferred = Q.defer();

    try {
        var client = net.connect({
            host: this.host,
            port: this.port
        }, function () {
            client.write(VT + msg.toString() + CR + FS + CR);
        });

        var response = '';

        client.on('data', function (data) {
            response += data.toString();
            if (response.substring(response.length - 2, response.length) == FS + CR) {
                var ack = self.parser.parse(response.substring(1, response.length - 2));
                deferred.resolve({
                    ack: ack,
                    raw: response
                });
                client.end();
            }
        });

        client.on('end', function () {});

        client.on('error', function (err) {
            deferred.reject(err)
        });

    } catch (err) {
        deferred.reject(err);
    }

    return deferred.promise;
}

module.exports = TcpClient