/* Copyright (c) WAKANDA, 2015
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * The Software shall be used for Good, not Evil.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var currentOs = os.isWindows ? 'windows' : 'mac';
var utils = require("./utils");
var actions = {};

actions.getTroubleshootingPage = function getTroubleshootingPage() {
  studio.extension.registerTabPage("./index.html", './rsz_welcome.png');
  studio.extension.openPageInTab('./index.html', 'Troubleshooting', false, 'window');
};

actions.reloadTroubleshootingPage = function() {
  studio.sendExtensionWebZoneCommand('wakanda-extension-trouble-shooting', '(function(){ window.location.reload(); })');
};

actions.getTroubleshootingDependencyCheck = function getTroubleshootingDependencyCheck(message) {
  var step = message.params.step;
  var type = message.params.type;
  var cmd = message.params.command;
  var command = {
    cmd: cmd,
    options: {
      consoleSilentMode: true
    },
    onmessage: function() {
      studio.sendExtensionWebZoneCommand('wakanda-extension-trouble-shooting', 'app.updateStepDependency', [type, step, true]);
    },
    onerror: function() {
      studio.sendExtensionWebZoneCommand('wakanda-extension-trouble-shooting', 'app.updateStepDependency', [type, step, false]);
    },
    onterminated: function() {
      studio.sendExtensionWebZoneCommand('wakanda-extension-trouble-shooting', 'app.updateStepDependency', [type, step, null]);
    }
  };
  utils.executeAsyncCmd(command);
};

function getTroubleShootingLink(dep) {
  if (typeof dep != 'undefined' && dep.troubleshooting) {
    var depApp = (typeof dep.troubleshooting[currentOs] !== 'undefined') ? dep.troubleshooting[currentOs].app : dep.troubleshooting.app;
    var depStep = (typeof dep.troubleshooting[currentOs] !== 'undefined') ? dep.troubleshooting[currentOs].step : dep.troubleshooting.step;
    return ' - {%a href="#" class="tip" onclick="studio.sendCommand(\'wakanda-extension-trouble-shooting.goToTroubleShootingStep.\'+btoa(JSON.stringify({nickname : \'' +
      depApp + '\' , step : ' + depStep + '})))"%}' + dep.text + ' {%i%}»{%/i%}{%/a%}';
  }
  return '';
}

var solutionConfig = {};

var configFileNames = [
  'dependencies.json',
  'troubleshooting.json'
];

function getConfigFiles() {
  var wakandaFiles = [];
  var currentProjects = studio.currentSolution.getProjects();
  try {

    var extensionFolder = studio.extension.getFolder();
    extensionFolder.folders.forEach(function(subFolder) {
      if (subFolder.name === '.wakanda') {
        subFolder.files.forEach(function(subFolderFile) {
          if (configFileNames.indexOf(subFolderFile.name) >= 0) {
            wakandaFiles.push(subFolderFile.toString());
          }
        });
      }
    });

    if (currentProjects) {
      var solutionFile = studio.currentSolution.getSolutionFile();
      var projects = currentProjects.map(function(projectName) {
        var waProjectPath = solutionFile.parent.parent.path + projectName + '/' + projectName + '.waProject';
        return studio.File(waProjectPath);
      });

      projects.forEach(function(projectFile) {
        projectFile.parent.folders.forEach(function(projectFolder) {
          projectFolder.folders.forEach(function(subFolder) {
            if (subFolder.name === '.wakanda') {
              subFolder.files.forEach(function(subFolderFile) {
                if (configFileNames.indexOf(subFolderFile.name) >= 0) {
                  wakandaFiles.push(subFolderFile.toString());
                }
              });
            }
          });
        });
      });

    }

    wakandaFiles.forEach(function(wakandaConfigFile) {
      var jsonConfigFile = JSON.parse(wakandaConfigFile);
      Object.keys(jsonConfigFile).forEach(function(jsonKey) {
        if (typeof solutionConfig[jsonKey] === 'undefined') {
          if (utils.isArray(jsonConfigFile[jsonKey])) {
            solutionConfig[jsonKey] = [];
          } else {
            solutionConfig[jsonKey] = {}; 
          }
        }
        Object.keys(jsonConfigFile[jsonKey]).forEach(function(jsonSubKey) {
          if (utils.isArray(jsonConfigFile[jsonKey])) {
            solutionConfig[jsonKey].push(jsonConfigFile[jsonKey][jsonSubKey]);
          } else {
            solutionConfig[jsonKey][jsonSubKey] = jsonConfigFile[jsonKey][jsonSubKey];
          }
        });          
      });
    });

    actions.storeDependenciesStatus();
  } catch(err) {
    studio.log(err);
  }

}

actions.storeDependenciesStatus = function() {
  studio.setPreferences('solution.dependencies', JSON.stringify(solutionConfig.dependencies || {}));
  studio.extension.storage.setItem('solution-config', JSON.stringify(solutionConfig || {}));
};

actions.resetSolutionConfig = function() {
  solutionConfig = {};
  actions.storeDependenciesStatus();
};

function validationCallback(msg, envVar) {
  return msg && msg.replace(/\r?\n|\r/gm, '').trim() !== envVar;
}

actions.checkDependencies = function() {
  "use strict";

  getConfigFiles();

  if (!solutionConfig.dependencies) {
    return false;
  }

  Object.keys(solutionConfig.dependencies).forEach(function(depKey) {
    var dependency = solutionConfig.dependencies[depKey];

    if (dependency.os) {
      var dependencyOS = typeof dependency.os === 'string' ? dependency.os : dependency.os[currentOs];
      if (!dependencyOS) {
        return;
      }
    }

    if (!dependency.command || dependency.command.length === 0) {
      return;
    }
    
    var command = typeof dependency.command === 'string' ? dependency.command : dependency.command[currentOs];
    if (!command) {
      return;
    }

    var troubleshootingText = getTroubleShootingLink(dependency) || '';

    var cmd = {
      cmd: command,
      onmessage: function(msg) {
        var valid = !dependency.envVariable || validationCallback(msg, dependency.envVariable);
        solutionConfig.dependencies[depKey].status = valid;

        utils.setStorage({
          name: 'solutionConfig',
          value: solutionConfig
        });

        if (valid) {
          utils.printConsole({
            message: dependency.name + ': {%span class="green"%}Found{%/span%} - ' + msg.replace(/\r?\n|\r/, " "),
            type: 'INFO'
          });
        } else {
          utils.printConsole({
            message: dependency.name + ': {%span class="' + (!dependency.optional ? 'red' : 'orange') + '"%}Not found{%/span%}' + troubleshootingText,
            type: !dependency.optional ? 'ERROR' : 'WARNING'
          });
        }

      },
      onerror: function() {
        solutionConfig.dependencies[depKey].status = false;

        utils.setStorage({
          name: 'solutionConfig',
          value: solutionConfig
        });

        utils.printConsole({
          message: dependency.name + ': {%span class="' + (!dependency.optional ? 'red' : 'orange') + '"%}Not found{%/span%}' + troubleshootingText,
          type: 'ERROR'
        });

      },
      onterminated: function() {
        if (typeof solutionConfig.dependencies[depKey].status === 'undefined') {
          solutionConfig.dependencies[depKey].status = false;

          utils.setStorage({
            name: 'solutionConfig',
            value: solutionConfig
          });

          utils.printConsole({
            message: dependency.name + ': {%span class="' + (!dependency.optional ? 'red' : 'orange') + '"%}Not found{%/span%}' + troubleshootingText,
            type: 'WARNING'
          });
        }

        actions.storeDependenciesStatus();
      },
      options: {
        consoleSilentMode: true
      }
    };
    utils.executeAsyncCmd(cmd);

  });

  return true;
};

actions.goToTroubleShootingStep = function goToTroubleShootingStep(message) {
  if (message.params.nickname  && typeof message.params.step !== 'undefined') {
    studio.extension.storage.setItem("nickname", message.params.nickname);
    studio.extension.storage.setItem("step", message.params.step);
    actions.reloadTroubleshootingPage();
    studio.extension.registerTabPage("./index.html", './rsz_welcome.png');
    studio.extension.openPageInTab("./index.html", 'Troubleshooting Page', false, 'window');
  }
};

exports.handleMessage = function handleMessage(message) {
  "use strict";
  var actionName;
  actionName = message.action;
  if (!actions.hasOwnProperty(actionName)) {
    studio.alert("I don't know about this message: " + actionName);
    return false;
  }
  actions[actionName](message);
};