#!/usr/bin/env node

'use strict';

const cluster = require('cluster');
const http = require('http');
const OS = require('os');
const colors = require('colors');
const program = require("commander");
const clui = require("clui");
const clear = require('clear');
const figlet = require('figlet');
const Chat = require("podchat");
const WF = require("./lib/worker-functions");
const MF = require("./lib/master-functions");

var CHAT_ACTIONS = {
    SYSTEM: 0,
    CHAT_READY: 1,
    GET_THREADS: 2,
    CREATE_THREAD: 3,
    SEND_MESSAGE: 4
  },
  USERS = [];

program.version("1.1.0")
  .option("-w, --workers-count [count]", "Workers Count")
  .option("-a, --action <type>", "Chat Action (chatReady|getThreads|createThread|sendMessage)", /^(chatReady|getThreads|createThread|sendMessage)$/i)
  .option("-c, --action-count [actionCount]", "Action repeat Count")
  .option("-t, --action-timeout <actionTimeout>", "Action Timeout in Seconds")
  .option("--auto-reconnect", "Reconnect Socket On close")
  .option("--chatlog", "Enable Chat Logs")
  .option("--nodelog", "Enable Node Logs")
  .parse(process.argv);

var workerFunctions = new WF({
  actions: CHAT_ACTIONS,
  nodelog: program.nodelog,
  autoReconnect: program.autoReconnect,
  timeout: program.actionTimeout,
  iterate: program.actionCount
});

var masterFunctions = new MF({
  actions: CHAT_ACTIONS,
  nodelog: program.nodelog,
  autoReconnect: program.autoReconnect,
  timeout: program.actionTimeout
});

var params = {
    TOKENS: [
      "7cba09ff83554fc98726430c30afcfc6", // Zizi
      "fbd4ecedb898426394646e65c6b1d5d1", // Jiji
      "5fb88da4c6914d07a501a76d68a62363" // Fifi
    ],
    workersCount: program.workersCount || OS.cpus().length,
    chatLog: program.chatlog,
    nodeLog: program.nodelog
  },
  statistics;

if (cluster.isMaster) {
  clear();
  console.log("\n");
  console.log(figlet.textSync('POD LOAD').green);
  console.log("\n");
  params.nodeLog && console.log(`    ♥ Master ${process.pid} \tis running`.magenta);

  statistics = {
    nodeWorkers: {
      allWorkers: parseInt(params.workersCount),
      startedWorkers: 0,
      passedWorkers: 0,
      failedWorkers: 0,
      terminatedWorkers: 0
    },
    errors: {}
  };

  for (let i = 0; i < params.workersCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    params.nodeLog && console.log(`    ⚫ worker ${worker.process.pid} \tdied`.magenta);
    if (signal || code == 101) {
      statistics.nodeWorkers.terminatedWorkers++;
    } else if (code !== 0 && code != 101) {
      statistics.nodeWorkers.failedWorkers++;
    } else {
      statistics.nodeWorkers.passedWorkers++;;
    }

    if (statistics.nodeWorkers.allWorkers == statistics.nodeWorkers.passedWorkers + statistics.nodeWorkers.failedWorkers + statistics.nodeWorkers.terminatedWorkers) {
      if (statistics.chatReady) {
        if ((statistics.chatReady.passed + statistics.chatReady.failed) > 0) statistics.chatReady.meanTime = Math.ceil(statistics.chatReady.totalTime / (statistics.chatReady.passed + statistics.chatReady.failed));
      }
      if (statistics.getThreads) {
        if ((statistics.getThreads.passed + statistics.getThreads.failed) > 0) statistics.getThreads.meanTime = Math.ceil(statistics.getThreads.totalTime / (statistics.getThreads.passed + statistics.getThreads.failed));
      }
      if (statistics.createThread) {
        if ((statistics.createThread.passed + statistics.createThread.failed) > 0) statistics.createThread.meanTime = Math.ceil(statistics.createThread.totalTime / (statistics.createThread.passed + statistics.createThread.failed));
      }
      if (statistics.sendMessage) {
        if ((statistics.sendMessage.passed + statistics.sendMessage.failed) > 0) statistics.sendMessage.meanTime = Math.ceil(statistics.sendMessage.totalTime / (statistics.sendMessage.passed + statistics.sendMessage.failed));
      }
      console.log(statistics);
    }
  });

  function eachWorker(callback) {
    for (const id in cluster.workers) {
      callback(cluster.workers[id]);
    }
  }

  eachWorker((worker) => {
    worker.send(params.TOKENS[worker.id - 1]);
    worker.on('message', workerMessageHandler);
  });

  function workerMessageHandler(msg) {
    if (msg) {
      var content = msg.content;
      switch (msg.type) {
        case CHAT_ACTIONS.SYSTEM:
          masterFunctions.masterSystemCalls(content, statistics, USERS);
          break;

        case CHAT_ACTIONS.CHAT_READY:
          masterFunctions.masterGetReady(content, statistics);
          break;

        case CHAT_ACTIONS.GET_THREADS:
          masterFunctions.masterGetThreads(content, statistics);
          break;

        case CHAT_ACTIONS.CREATE_THREAD:
          masterFunctions.masterCreateThread(content, statistics);
          break;

        case CHAT_ACTIONS.SEND_MESSAGE:
          masterFunctions.masterSendMessage(content, statistics);
          break;

        default:
          break;
      }
    }
  }

} else {
  params.nodeLog && console.log(`    ⚪ Worker ${process.pid} \tstarted`.magenta);

  process.send({
    type: CHAT_ACTIONS.SYSTEM,
    content: {
      type: "startedWorkers",
      state: true
    }
  });

  process.on('message', (msg) => {
    var chatReadyStartTime = new Date().getTime();

    var chatAgent = new Chat({
      socketAddress: "ws://172.16.106.26:8003/ws",
      ssoHost: "http://172.16.110.76",
      platformHost: "http://172.16.106.26:8080/hamsam",
      fileServer: "http://172.16.106.26:8080/hamsam",
      serverName: "chat-server",
      token: msg,
      reconnectOnClose: program.autoReconnect,
      asyncLogging: {
        workerId: process.pid,
        onFunction: program.chatlog,
        onMessageReceive: program.chatlog,
        onMessageSend: program.chatlog,
        actualTiming: program.chatlog
      }
    });

    chatAgent.on("chatReady", () => {
      chatAgent.getUserInfo((user) => {

        process.send({
          type: CHAT_ACTIONS.SYSTEM,
          content: {
            type: "userInfo",
            user: user
          }
        });

        switch (program.action) {
          case "chatReady":
            workerFunctions.workerChatReady(chatAgent, process, chatReadyStartTime, program.actionCount);
            break;

          case "getThreads":
            workerFunctions.workerGetThreads(chatAgent, process, chatReadyStartTime);
            break;

          case "createThread":
            workerFunctions.workerCreateThread(chatAgent, process, chatReadyStartTime);
            break;

          case "sendMessage":
            workerFunctions.workerSendMessage(chatAgent, process, chatReadyStartTime);
            break;

          default:
            process.exit();
            break;
        }
      });
    });

    chatAgent.on("error", (error) => {
      console.log(error);
      workerFunctions.errorHandler(process, error);
    });
  });
}
