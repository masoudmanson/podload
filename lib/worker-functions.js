(function() {
  function workerFunctions(params) {
    var CHAT_ACTIONS = params.actions,
      iterate = params.iterate,
      timeout = params.timeout,
      onErrorKillTimeout;

    var actionTimeout = (timeout > 0) ? timeout * 1000 : 20000,
      iterate = (iterate > 0) ? parseInt(iterate) : 1,
      iterationCount = iterate;

    this.workerChatReady = function(chatAgent, process, startTime) {
      params.nodelog && console.log(`    ☰ Worker ${process.pid} \tChat Ready`.magenta);
      process.send({
        type: CHAT_ACTIONS.CHAT_READY,
        content: {
          type: "chatReady",
          state: true,
          duration: new Date().getTime() - startTime
        }
      });
      process.exit();
    };

    this.workerGetThreads = function(chatAgent, process, startTime) {
      var completeCount = 0,
        actionTimeoutInterval = {};

      do {
        actionTimeoutInterval[iterationCount] = setTimeout(() => {
          process.send({
            type: CHAT_ACTIONS.GET_THREADS,
            content: {
              type: "getThreads",
              state: "timeout",
              duration: new Date().getTime() - startTime
            }
          });

          completeCount += 1;

          if (iterate == completeCount) {
            process.exit();
          }
        }, actionTimeout);

        params.nodelog && console.log(`    ☰ Worker ${process.pid} \tGet Thread Request\t ${new Date()}`);
        var getThreadsStartTime = new Date().getTime();

        process.send({
          type: CHAT_ACTIONS.CHAT_READY,
          content: {
            type: "chatReady",
            state: "passed",
            duration: new Date().getTime() - startTime
          }
        });

        chatAgent.getThreads({
          count: 5,
          offset: 0
        }, function(result) {
          params.nodelog && console.log(`    ☰ Worker ${process.pid} \tGet Thread Result (${parseInt(completeCount + 1)} /${iterate})\t ${new Date()}`);
          if (!result.hasError) {
            process.send({
              type: CHAT_ACTIONS.GET_THREADS,
              content: {
                type: "getThreads",
                state: "passed",
                duration: new Date().getTime() - getThreadsStartTime
              }
            });
          } else {
            process.send({
              type: CHAT_ACTIONS.GET_THREADS,
              content: {
                type: "getThreads",
                state: "failed",
                errorCode: result.code,
                duration: new Date().getTime() - getThreadsStartTime
              }
            });
          }

          completeCount += 1;
          if (iterate == completeCount) {
            process.exit();
          }
        });

        iterationCount--;
      } while (iterationCount > 0);
    };

    this.workerCreateThread = function(chatAgent, process, startTime) {
      var completeCount = 0,
        actionTimeoutInterval = {};

      do {
        actionTimeoutInterval[iterationCount] = setTimeout(() => {
          process.send({
            type: CHAT_ACTIONS.CREATE_THREAD,
            content: {
              type: "createThread",
              state: "timeout",
              duration: new Date().getTime() - startTime
            }
          });

          completeCount += 1;
          if (iterate == completeCount) {
            process.exit();
          }
        }, actionTimeout);

        params.nodelog && console.log(`    ☰ Worker ${process.pid} \tCreate Thread Request\t${new Date()}`.grey);
        var createThreadStartTime = new Date().getTime();

        process.send({
          type: CHAT_ACTIONS.CHAT_READY,
          content: {
            type: "chatReady",
            state: "passed",
            duration: new Date().getTime() - startTime
          }
        });

        var time1 = new Date().getTime();
        chatAgent.getContacts({
          count: 50,
          offset: 0
        }, function(contactsResult) {
          if (!contactsResult.hasError) {
            params.nodelog && console.log(`    ☰ Worker ${process.pid} \tGet Contacts List (${new Date().getTime() - time1}ms)`);
            for (var i = 0; i < contactsResult.result.contacts.length; i++) {
              if (contactsResult.result.contacts[i].hasUser) {
                var p2pContactId = contactsResult.result.contacts[i].id;

                var time3 = new Date().getTime();

                chatAgent.createThread({
                  type: "NORMAL",
                  invitees: [{
                    id: p2pContactId,
                    idType: "TO_BE_USER_CONTACT_ID"
                  }]
                }, function(createThreadResult) {
                  if (!createThreadResult.hasError && createThreadResult.result.thread.id > 0) {
                    p2pThreadId = createThreadResult.result.thread.id;
                    params.nodelog && console.log(`    ★ Worker ${process.pid} \tCreate P2P Thread (${new Date().getTime() - time3}ms) \t ${new Date()}`);

                    process.send({
                      type: CHAT_ACTIONS.CREATE_THREAD,
                      content: {
                        type: "createThread",
                        state: "passed",
                        duration: new Date().getTime() - createThreadStartTime
                      }
                    });
                  } else {
                    process.send({
                      type: CHAT_ACTIONS.CREATE_THREAD,
                      content: {
                        type: "createThread",
                        state: "failed",
                        errorCode: createThreadResult.code,
                        duration: new Date().getTime() - createThreadStartTime
                      }
                    });

                    process.send({
                      type: CHAT_ACTIONS.SYSTEM,
                      content: {
                        type: "error",
                        errorCode: createThreadResult.code
                      }
                    });
                  }

                  completeCount += 1;
                  if (iterate == completeCount) {
                    process.exit();
                  }
                });
                break;
              }
            }
          } else {
            process.send({
              type: CHAT_ACTIONS.CREATE_THREAD,
              content: {
                type: "createThread",
                state: "failed",
                errorCode: contactsResult.code,
                duration: new Date().getTime() - createThreadStartTime
              }
            });

            process.send({
              type: CHAT_ACTIONS.SYSTEM,
              content: {
                type: "error",
                errorCode: createThreadResult.code
              }
            });

            completeCount += 1;
            if (iterate == completeCount) {
              process.exit();
            }
          }
        });
        iterationCount--;
      } while (iterationCount > 0);
    };

    this.workerSendMessage = function(chatAgent, process, startTime) {
      var completeCount = 0,
        actionTimeoutInterval = {};

      process.send({
        type: CHAT_ACTIONS.SEND_MESSAGE,
        content: {
          type: "chatReady",
          state: "passed",
          duration: new Date().getTime() - startTime
        }
      });

      actionTimeoutInterval[iterationCount] = setTimeout(() => {
        process.send({
          type: CHAT_ACTIONS.SEND_MESSAGE,
          content: {
            type: "sendMessage",
            state: "failed",
            duration: new Date().getTime() - startTime
          }
        });

        completeCount += 1;
        if (iterate == completeCount) {
          process.exit();
        }
      }, actionTimeout);

      chatAgent.getThreads({
        count: 1,
        offset: 0
      }, function(result) {
        if (!result.hasError) {
          var sendMessageStartTime = [];
          do {
            var sendMessageStartTime = new Date().getTime();

            actionTimeoutInterval[iterationCount] = setTimeout(() => {
              process.send({
                type: CHAT_ACTIONS.SEND_MESSAGE,
                content: {
                  type: "sendMessage",
                  state: "timeout",
                  duration: new Date().getTime() - startTime
                }
              });

              completeCount += 1;
              if (iterate == completeCount) {
                process.exit();
              }
            }, actionTimeout);

            if (result.result.threads.length > 0) {
              var THREAD_ID = result.result.threads[0].id;

              params.nodelog && console.log(`    ☰ Worker ${process.pid} \tSend Message Request\t ${new Date()}`);

              chatAgent.sendTextMessage({
                threadId: THREAD_ID,
                content: "TEST"
              }, {
                onSent: function(result) {
                  params.nodelog && console.log(`    ☰ Worker ${process.pid} \tSend Message Result (${parseInt(completeCount + 1)} /${iterate})\t ${new Date()}`);

                  process.send({
                    type: CHAT_ACTIONS.SEND_MESSAGE,
                    content: {
                      type: "sendMessage",
                      state: "passed",
                      duration: new Date().getTime() - sendMessageStartTime
                    }
                  });

                  completeCount += 1;
                  if (iterate == completeCount) {
                    process.exit();
                  }
                },
                onDeliver: function(result) {},
                onSeen: function(result) {}
              });

            } else {
              process.send({
                type: CHAT_ACTIONS.SEND_MESSAGE,
                content: {
                  type: "sendMessage",
                  state: "failed",
                  duration: new Date().getTime() - sendMessageStartTime
                }
              });

              completeCount += 1;
              if (iterate == completeCount) {
                process.exit();
              }
            }

            iterationCount--;
          } while (iterationCount > 0);

        } else {
          process.send({
            type: CHAT_ACTIONS.SEND_MESSAGE,
            content: {
              type: "sendMessage",
              state: "failed",
              errorCode: result.code,
              duration: new Date().getTime() - sendMessageStartTime
            }
          });

          process.send({
            type: CHAT_ACTIONS.SYSTEM,
            content: {
              type: "error",
              errorCode: result.code
            }
          });

          completeCount += 1;
          if (iterate == completeCount) {
            process.exit();
          }
        }

      });
    };

    this.errorHandler = function(process, error) {
      console.log(`    ☰ Worker ${process.pid} \tHad Error!`.red);
      process.send({
        type: CHAT_ACTIONS.SYSTEM,
        content: {
          type: "error",
          errorCode: error.code,
          error: error
        }
      });

      if (params.autoReconnect != true) {
        process.exit(100);
      } else {
        console.log(`    ☰ Worker ${process.pid} \twill be exit after ${actionTimeout / 1000} seconds.`.yellow);
        onErrorKillTimeout && clearTimeout(onErrorKillTimeout);

        onErrorKillTimeout = setTimeout(function() {
          process.exit(101);
        }, actionTimeout);
      }
    };
  }

  module.exports = workerFunctions;
})();
