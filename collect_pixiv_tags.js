// ==UserScript==
// @name         Collect Tags [Pixiv]
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  collect pixiv tags to json
// @author       You
// @include        https://www.pixiv.net/member_illust.php?mode=medium&illust_id=*
// @include       https://www.pixiv.net/member_illust.php?id=*
// @grant        none
// @require    https://cdn.bootcss.com/jslite/1.1.12/JSLite.min.js
// @require    https://unpkg.com/lodash@4/lodash.min.js
// @require    https://unpkg.com/lowdb@0.17/dist/low.min.js
// @require    https://unpkg.com/lowdb@0.17/dist/LocalStorage.min.js
// ==/UserScript==
(function () {
  var adapter = new LocalStorage('pixivDB');
  var db = low(adapter);
  db.defaults({ pixivs: [] }).write();

  var isIllustPage = window.location.href.indexOf('illust_id') > -1;

  $(document).keydown(function (e) {
    if (e.shiftKey && e.keyCode === 68) {
      downLoadAllPixivData();
    }
  });

  toast('', '')

  if (isIllustPage) {
    //图片页
    var illustId = pixiv.context.illustId;
    saveForIllustPage(illustId); //直接触发
    $('.js-nice-button').on('click', function () {
      saveForIllustPage(illustId)
    });

    $(document).keydown(function (e) {
      if (e.keyCode === 76) {
        saveForIllustPage(illustId);
      }
    });
  } else {
    //作品页
    console.log('member page');
    saveForMemberPage();
  }

  /**
   * 作品页的保存
   */
  function saveForMemberPage() {
    var authorName = $('.profile').find('.user-name').text();
    var msgs = [];
    $('._image-items').find('.image-item').each((i, li) => {
      var $img = $(li).find('._layout-thumbnail img');
      var tags = $img.data('tags').split(' ');
      var illustId = "" + $img.data('id');
      if (removeExist(illustId)) {
        console.log("Ignored:" + illustId);
        msgs.push('IGNORED:[' + illustId + ']');
      } else {
        var model = {
          id: illustId,
          title: $(li).find('.title').text(),
          date: new Date().getTime(),
          tags: tags,
          author: authorName,
          authorId: $img.data('user-id'),
        };
        if (save(model)) {
          console.log("SAVED:" + JSON.stringify(model));
          msgs.push('SAVED:[' + model.id + ']');
        }
      }
    });
    toast('', JSON.stringify(msgs, undefined, 2));
  }

  /**
   * 图片页的保存
   */
  function saveForIllustPage(illustId) {
    if (illustId) {
      var exists = removeExist(illustId);
      if (exists) {
        toast('IGNORED', JSON.stringify(exists, undefined, 2));
      } else {
        var model = infoForIllustPage(illustId);
        if (model && save(model)) {
          toast('SAVED', JSON.stringify(model, undefined, 2));
        }
      }
    }
  }

  function infoForIllustPage(id) {
    var context = pixiv.context;
    var model = {
      id: id,
      title: context.illustTitle,
      date: new Date().getTime(),
      tags: [],
      author: context.userName,
      authorId: context.userId,
    };
    var workInfo = $('.work-info');
    //title
    //var title = workInfo.find('.title').text();

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

  /**
   * if exists, delete orig
   */
  function removeExist(illustId) {
    var existed = db.get('pixivs').remove({ id: illustId }).value();
    if (existed) {
      console.log('remove exist:' + JSON.stringify(existed));
    }
    return false;
  }

  //处理脏数据
  // var wrongs = db.get('pixivs').remove({ id: {
  //   "isTrusted": true
  // } }).value();
  // console.log(wrongs)

  function save(model) {
    db.get('pixivs').push(model).write();
    console.log('saved');
    return true;
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
    var pixivs = db.get('pixivs').value();
    var data = JSON.stringify({ pixiv: pixivs }, undefined, 2);
    downloadFile(new Date().toLocaleDateString() + '.json', data);
    
    // window.open('data:text/html;charset=utf-8;Base64,'+window.btoa('ssssdsaa'),'pixiv','width=200,height=100');
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
  function toast(header, body) {
    var $tip = $('#tip');
    if ($tip.length === 0) {
      $tip = $('<div id="tip" style="position:fixed;font-size:15px;padding:8px;top:10px;left: 10px;border:solid 0.5px #150101;background-color:#d6d6d6;z-index:9999"></div>');
      $tip.append($('<strong></strong>'));


      $tip.append($('<pre></pre>'));

      var $dlBtn = $('<button style="width: 75px;height: 25px;margin-right: 10px;">info</button>');
      $dlBtn.off('click').on('click', downLoadAllPixivData);
      $tip.append($dlBtn);

      var $closeBtn = $('<button style="width: 75px;height: 25px;margin-right: 10px;">close</button>');
      $closeBtn.off('click').on('click', () => {
        $('#tip').remove();
      });
      $tip.append($closeBtn);

      $('body').append($tip);
    }
    var $header = $tip.find('strong').text('<' + header + '>');
    $header.off('click').on('click', () => {
      if ($tip.css('left')) {
        $tip.css('left', undefined);
        $tip.css('right', '10px');
      } else {
        $tip.css('left', '10px');
        $tip.css('right', undefined);
      }
    }).show();
    $tip.find('pre').text(body).show();
  }

})();