// ==UserScript==
// @name         Collect Tags [Pixiv]
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.pixiv.net/member_illust.php?mode=medium&illust_id=*
// @grant        none
// @require    http://code.jquery.com/jquery-1.11.0.min.js
// @require    https://unpkg.com/lodash@4/lodash.min.js
// @require    https://unpkg.com/lowdb@0.17/dist/low.min.js
// @require    https://unpkg.com/lowdb@0.17/dist/LocalStorage.min.js
// ==/UserScript==
(function () {
  var adapter = new LocalStorage('pixivDB');
  var db = low(adapter);
  db.defaults({ pixivs: [] }).write();

  saveInfo(); //直接触发
  $('.js-nice-button').on('click', saveInfo);
  $(document).keydown(function (e) {
    if (e.keyCode === 76) {
      saveInfo();
    }
  });
  $(document).keypress(function (e) {
    if (e.shiftKey && e.keyCode == 68) {
      downLoadAllPixivData();
    }
  });

  function saveInfo() {
    var illustId = pixiv.context.illustId;
    if (illustId) {
      if (checkExist(illustId)) {
        var model = info(illustId);
        if (model) {
          save(model);
        }
      }
    }
  }

  function checkExist(illustId) {
    if (db.get('pixivs').find({ id: model.id }).size().value() > 0) {
      console.log('existed,so ingore');
      showMsg('existed,so IGNORE <br/>' + json);
      return false;
    }
    return true;
  }

  function save(model) {
    var json = JSON.stringify(model);
    console.log(json);
    // Set some defaults
    db.get('pixivs').push(model).write();
    console.log('saved');
    showMsg('SAVED<br/>' + json);
  }

  function info(id) {
    var context = pixiv.context;
    var model = {
      id: id,
      title: context.illustTitle,
      date: '',
      tags: [],
      author: context.userId,
      authorId: context.userName,
    };
    var workInfo = $('.work-info');
    //title
    //var title = workInfo.find('.title').text();

    //date
    var date = workInfo.find('ul.meta').children().first().text();
    model.date = date;

    //tags
    var liTags = $('ul.tags').find('li');
    var tags = [];
    liTags.each((i, li) => {
      var text = $(li).find('a.text').text();
      tags.push(text);
    });
    //author
    //var profile = $('div.profile');
    //var userLink = profile.find('a.user-name');
    //var author = userLink.text();
    //var authorId = userLink.href().split('?id=')[1]

    //id
    //var id = pixiv.context.illustId;
    model.tags = tags;

    return model;
  }

  function showAllPixivData() {
    var data = db.get('pixivs').value();
    console.log(data);
  }

  function removeAllPixivData() {
    if (confirm('Are u sure to remove all pixiv data?')) {
      var data = db.get('pixivs').remove({}).write();
      console.log('removed all');
    }
  }

  function downLoadAllPixivData() {
    var data = db.get('pixivs').value();
    downloadFile(dbName + '.json', JSON.stringify(data));
  }

  window.showAllPixivData = showAllPixivData;
  window.removeAllPixivData = removeAllPixivData;
  window.downLoadAllPixivData = downLoadAllPixivData;


  function downloadFile(fileName, content) {
    console.log(content);
    var aLink = document.createElement('a');
    var blob = new Blob([content], { type: 'text/plain' });
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("click", false, false);
    aLink.download = fileName;
    aLink.href = URL.createObjectURL(blob);
    aLink.dispatchEvent(evt);
    aLink.click();
  }

  // ******************** toast *******************//
  //tip是提示信息，type:'success'是成功信息，'danger'是失败信息,'info'是普通信息,'warning'是警告信息
  function showTip(tip, type) {
    type = type ? type : 'info';
    var $tip = $('#myTip');
    if ($tip.length === 0) {
      $tip = $('<strong id="tip" style="position:absolute;padding:5px 2px;top:10px;right: 10px;border:solid 0.5px #150101;background-color:#d6d6d6;max-width:500px;z-index:9999"></strong>');
      $('body').append($tip);
    }
    $tip.stop(true).prop('class', 'alert alert-' + type).text(tip).css('margin-left', -$tip.outerWidth() / 2).fadeIn(500).delay(2000).fadeOut(500);
  }

  function showMsg(msg) {
    showTip(msg, 'info');
  }

  function showSuccess(msg) {
    showTip(msg, 'success');
  }

  function ShowFailure(msg) {
    showTip(msg, 'danger');
  }

  function showWarn(msg, $focus, clear) {
    showTip(msg, 'warning');
    if ($focus) {
      $focus.focus();
      if (clear) $focus.val('');
    }
    return false;
  }
})();