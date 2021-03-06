var rbx = require('noblox.js');
var ProgressBar = require('progress');
var cookie = process.env.COOKIE
var group = 4683371;

var actionTypeId = 6;
var targetUser = 'MooingChina';
var startPage = 1;
var endPage = 20;
var afterDate = new Date('2020-08-09 00:00 CDT');

rbx.setCookie(cookie)
.then(function () {
  var pages = [];
  for (var i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  var audit = new ProgressBar('Getting audit log [:bar] :current/:total = :percent :etas remaining ', {total: 10000});
  var promise = rbx.getAuditLog({
    group: group,
    action: actionTypeId,
    username: targetUser,
    page: pages
  });
  promise.then(function (audit) {
    var logs = audit.logs;
    var original = {};
    for (var i = 0; i < logs.length; i++) {
      var log = logs[i];
      if (log.date > afterDate) {
        original[log.action.target] = log.action.params[0];
      }
    }
    var reset = [];
    for (var target in original) {
      reset.push({
        target: target,
        role: original[target]
      });
    }
    // Cache the XCSRF token to prepare for a bunch of requests at once
    rbx.getGeneralToken()
    .then(function () {
      var revert = new ProgressBar('Reverting user ranks [:bar] :current/:total = :percent :etas remaining ', {total: 10000});
      console.time('Time: ');
      var thread = rbx.threaded(function (i) {
        return rbx.setRank({
          group: group,
          target: reset[i].target,
          name: reset[i].role
        });
      }, 0, reset.length);
      var ivl = setInterval(function () {
        revert.update(thread.getStatus() / 100);
      }, 1000);
      thread.then(function () {
        clearInterval(ivl);
        console.timeEnd('Time: ');
      });
    });
  });
  var ivl = setInterval(function () {
    audit.update(promise.getStatus() / 100);
  }, 1000);
  promise.then(function () {
    clearInterval(ivl);
  });
});
