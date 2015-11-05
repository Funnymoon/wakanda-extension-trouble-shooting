var Base64 = require("base64");
var shell = require("shellWorker");

var bash_profile = {};
if(! os.isWindows) {
    bash_profile.file = process.env.HOME + '/.bash_profile';
    try {
        bash_profile.exists = File(bash_profile.file).exists;
    } catch(e) {
        bash_profile.exists = false;
        studio.log('Error after checking user .bash_profile, error : ' + e);
    }
}

function wrapCommand(command) {
    if(! os.isWindows && bash_profile.exists) {
        command = 'source ' + bash_profile.file + ';' + command;
    }
    return command;
}

function stringifyFunc(obj) {
    "use strict";

    return JSON.stringify(obj, function(key, value) {
        return (typeof value === 'function') ? value.toString() : value;
    });
}

function getMessageString(options) {
    "use strict";

    var message = {
        msg: options.message,
        type: options.type || null,
        category: options.category || 'env'
    };
    return 'wakanda-extension-mobile-console.append.' + Base64.encode(JSON.stringify(message));
}

function printConsole(obj) {
    "use strict";
    studio.sendCommand(getMessageString(obj));
}

function executeAsyncCmd(command) {
    "use strict";
    var consoleSilentMode = command.options && command.options.consoleSilentMode;
    var cmd = command.cmd
    if(! consoleSilentMode) {
        printConsole({
            message: command.path ? (command.path + ' ') + command.cmd : command.cmd,
            type: 'COMMAND'
        });
    }
    
    var worker = shell.create(wrapCommand(command.cmd), command.path);
    
    worker.onmessage = function(msg) {
        if(! consoleSilentMode) {
            printConsole({
                message: msg,
                type: 'OUTPUT'
            });
        }
    
        if(command.onmessage) {
            command.onmessage(msg);
        }
    };
    
    worker.onerror = function(msg) {
        if(! consoleSilentMode) {
            printConsole({
                message: msg,
                type: 'ERROR'
            });
        }

        if(command.onerror) {
            command.onerror(msg);
        }
    };
    
    worker.onterminated = function(msg) {
        if(! consoleSilentMode && ! (typeof(msg) === 'object'  && msg.type === 'terminate')) {
            printConsole({
                message: msg,
                type: 'OUTPUT'
            });
        }
        if(command.onterminated) {
            command.onterminated(msg);    
        }
    };

    return worker;
}

function executeSyncCmd(command) {
    "use strict";

    var consoleSilentMode = command.options && command.options.consoleSilentMode;
    if(! consoleSilentMode) {
        printConsole({
            message: command.path ? (command.path + ' ') + command.cmd : command.cmd,
            type: 'COMMAND'
        });
    }

    var output = shell.exec(wrapCommand(command.cmd), command.path);

    if(command.onterminated) {
        command.onterminated(output);
    }

    if(! consoleSilentMode) {
        printConsole({
            message: output,
            type: 'OUTPUT'
        });
    }

    return output;
}

exports.printConsole = printConsole;
exports.getMessageString = getMessageString;
exports.stringifyFunc = stringifyFunc;
exports.getMessageString = getMessageString;
exports.executeAsyncCmd = executeAsyncCmd;
exports.executeSyncCmd = executeSyncCmd;