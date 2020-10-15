import cluster from "cluster";
import { cpus } from "os";
import net from "net";
const farmhash = require('farmhash');
const numCPUs = cpus().length;

export interface ICluser {
    isClusterActive?: Boolean;
    masterPort?: number;
    log?: Boolean;
}

export default function NodeMultithreading(slave:Function, options: ICluser = {}) {
    const { 
        isClusterActive = true,
        masterPort = 3000,
        log = false
    } = options;

    function _log(...args: any[]) {
        if (log) {
            console.log.call(args);
        }
    }

    if (cluster.isMaster && isClusterActive) {
        _log(`Master ${process.pid} is running`);
        var workers: Array<any> = [];
    
        // Helper function for spawning worker at index 'i'.
        var spawn = function (i: any) {
            workers[i] = cluster.fork();
    
            // Optional: Restart worker on exit
            workers[i].on('exit', function (code: any, signal: any) {
                console.log('respawning worker', i);
                spawn(i);
            });
        };
    
        // Spawn workers.
        for (var i = 0; i < numCPUs; i++) {
            spawn(i);
        }
    
        // Helper function for getting a worker index based on IP address.
        // This is a hot path so it should be really fast. The way it works
        // is by converting the IP address to a number by removing non numeric
        // characters, then compressing it to the number of slots we have.
        //
        // Compared against "real" hashing (from the sticky-session code) and
        // "real" IP number conversion, this function is on par in terms of
        // worker index distribution only much faster.
        var worker_index = function (ip: any, len: any) {
            return farmhash.fingerprint32(ip) % len; // Farmhash is the fastest and works with IPv6, too
        };
    
        // Create the outside facing server listening on our port.
        net.createServer({ pauseOnConnect: true }, function (connection: any) {
            // We received a connection and need to pass it to the appropriate
            // worker. Get the worker for this connection's source IP and pass
            // it the connection.
            var worker = workers[worker_index(connection.remoteAddress, numCPUs)];
            worker.send('sticky-session:connection', connection);
        }).listen(masterPort);
    } else {
        _log(`Slave ${process.pid} is running`);
        const server = slave();

        if (isClusterActive) {
            process.on('message', function (message, connection) {
                if (message !== 'sticky-session:connection') {
                    return;
                }
                
                if (server) {
                    // Emulate a connection event on the server by emitting the
                    // event with the connection the master sent us.
                    server.emit('connection', connection);
                }
        
                connection.resume();
            });
        }
    }
}