(function() {
  var masterFunctions = function(params) {
    var CHAT_ACTIONS = params.actions;

    this.masterSystemCalls = function(content, statistics, users) {
      switch (content.type) {
        case "userInfo":
          if (content.user) {
            users.push(content.user.result.user);
          }
          break;

        case "startedWorkers":
          if (content.state) {
            statistics.nodeWorkers.startedWorkers++;
          }
          break;

        case "error":
          if (!statistics.errors[content.errorCode]) {
            statistics.errors[content.errorCode] = 1;
          } else {
            statistics.errors[content.errorCode] = parseInt(parseInt(statistics.errors[content.errorCode]) + 1);
          }
          switch (content.errorCode) {
            case 401:
              statistics.chatReady.invalidToken++;
              statistics.chatReady.failed++;
              break;
            case 6001:
              statistics.chatReady.invalidToken++;
              statistics.chatReady.failed++;
              break;
            default:
              break;
          }
          break;

        default:
          break;
      }
    };

    this.masterGetReady = function(content, statistics) {
      if (!statistics.chatReady) {
        statistics.chatReady = {
          passed: 0,
          failed: 0,
          timeout: 0,
          invalidToken: 0,
          minTime: 0,
          maxTime: 0,
          meanTime: 0,
          totalTime: 0
        };
      }

      switch (content.type) {
        case "startedWorkers":
          if (content.state) {
            statistics.nodeWorkers.startedWorkers++;
          }
          break;

        case "chatReady":
          if (content.state) {
            statistics.chatReady.passed++;

            if (content.duration > 0) {
              if (statistics.chatReady.minTime == 0 || content.duration < statistics.chatReady.minTime) {
                statistics.chatReady.minTime = content.duration;
              }
            }

            if (content.duration > statistics.chatReady.maxTime) {
              statistics.chatReady.maxTime = content.duration;
            }
            statistics.chatReady.totalTime += content.duration;
          } else if (content.state == false) {
            statistics.chatReady.failed++;
          }
          break;

        case "error":
          switch (content.errorCode) {
            case 401:
              statistics.chatReady.invalidToken++;
              statistics.chatReady.failed++;
              break;
            case 6001:
              statistics.chatReady.invalidToken++;
              statistics.chatReady.failed++;
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
    };

    this.masterGetThreads = function(content, statistics) {
      if (!statistics.getThreads) {
        statistics.getThreads = {
          passed: 0,
          failed: 0,
          timeout: 0,
          minTime: 0,
          maxTime: 0,
          meanTime: 0,
          totalTime: 0
        };
      }

      switch (content.type) {
        case "getThreads":
          if (content.state == "passed") {
            statistics.getThreads.passed++;
          } else if (content.state == "failed") {
            statistics.getThreads.failed++;
          } else if (content.state == "timeout") {
            statistics.getThreads.timeout++;
          }

          if (content.duration > 0) {
            if (statistics.getThreads.minTime == 0 || content.duration < statistics.getThreads.minTime) {
              statistics.getThreads.minTime = content.duration;
            }
          }

          if (content.duration > statistics.getThreads.maxTime) {
            statistics.getThreads.maxTime = content.duration;
          }
          statistics.getThreads.totalTime += content.duration;

          break;
        default:

      }
    };

    this.masterCreateThread = function(content, statistics) {
      if (!statistics.createThread) {
        statistics.createThread = {
          passed: 0,
          failed: 0,
          timeout: 0,
          minTime: 0,
          maxTime: 0,
          meanTime: 0,
          totalTime: 0
        };
      }

      switch (content.type) {
        case "createThread":
          if (content.state == "passed") {
            statistics.createThread.passed++;
          } else if (content.state == "failed") {
            statistics.createThread.failed++;
          } else if (content.state == "timeout") {
            statistics.createThread.timeout++;
          }

          if (content.duration > 0) {
            if (statistics.createThread.minTime == 0 || content.duration < statistics.createThread.minTime) {
              statistics.createThread.minTime = content.duration;
            }
          }

          if (content.duration > statistics.createThread.maxTime) {
            statistics.createThread.maxTime = content.duration;
          }
          statistics.createThread.totalTime += content.duration;

          break;
        default:

      }
    };

    this.masterSendMessage = function(content, statistics) {
      if (!statistics.sendMessage) {
        statistics.sendMessage = {
          passed: 0,
          failed: 0,
          timeout: 0,
          minTime: 0,
          maxTime: 0,
          meanTime: 0,
          totalTime: 0
        };
      }

      switch (content.type) {
        case "sendMessage":
          if (content.state == "passed") {
            statistics.sendMessage.passed++;
          } else if (content.state == "failed") {
            statistics.sendMessage.failed++;
          } else if (content.state == "timeout") {
            statistics.sendMessage.timeout++;
          }

          if (content.duration > 0) {
            if (statistics.sendMessage.minTime == 0 || content.duration < statistics.sendMessage.minTime) {
              statistics.sendMessage.minTime = content.duration;
            }
          }

          if (content.duration > statistics.sendMessage.maxTime) {
            statistics.sendMessage.maxTime = content.duration;
          }
          statistics.sendMessage.totalTime += content.duration;

          break;
        default:

      }
    };

    this.masterGetHistory = function(content, statistics) {
      if (!statistics.getHistory) {
        statistics.getHistory = {
          passed: 0,
          failed: 0,
          timeout: 0,
          minTime: 0,
          maxTime: 0,
          meanTime: 0,
          totalTime: 0
        };
      }

      switch (content.type) {
        case "getHistory":
          if (content.state == "passed") {
            statistics.getHistory.passed++;
          } else if (content.state == "failed") {
            statistics.getHistory.failed++;
          } else if (content.state == "timeout") {
            statistics.getHistory.timeout++;
          }

          if (content.duration > 0) {
            if (statistics.getHistory.minTime == 0 || content.duration < statistics.getHistory.minTime) {
              statistics.getHistory.minTime = content.duration;
            }
          }

          if (content.duration > statistics.getHistory.maxTime) {
            statistics.getHistory.maxTime = content.duration;
          }
          statistics.getHistory.totalTime += content.duration;

          break;
        default:

      }
    };

  }

  module.exports = masterFunctions;
})();
