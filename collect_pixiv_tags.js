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
  var DELAY = 3000

  var adapter = new LocalStorage('pixivDB');
  var db = low(adapter);
  db.defaults({ pixivs: [] }).write();

  var isIllustPage = window.location.href.indexOf('illust_id') > -1;

  $(document).keydown(function (e) {
    if (e.shiftKey && e.keyCode === 68) {
      downLoadAllPixivData();
    }
  });

  if (isIllustPage) {
    //图片页
    console.log('illust page');

    $('.js-nice-button').on('click', function () {
      saveForIllustPage()
    });

    $(document).keydown(function (e) {
      if (e.keyCode === 76) {
        saveForIllustPage();
      }
    });
    setTimeout(function(){
      saveForIllustPage(); //直接触发

    },DELAY)
    
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
    });
    toast('', JSON.stringify(msgs, undefined, 2));
  }

  /**
   * 图片页的保存
   */
  function saveForIllustPage(illustId) {
    var model = {
      date: new Date().getTime(),
    };
    //id
    var id = location.href.split('illust_id=')[1];
    model.id = id

    if(!id){
      console.log('no id')
      return 
    }

    //title
    var title = $('.TTmQ_bQ').text();
    model.title = title

    //tags
    var liTags = $('._3F75o7a').find('li');
    var tags = [];
    liTags.each((i, li) => {
      var text = $(li).text();
      if(text) tags.push(text);
    });
    model.tags = tags

    //author
    var author = $('.JdrBYtD a').text();
    var authorId = $('.JdrBYtD a').attr('href').split('?id=')[1]
    model.author = author
    model.authorId = authorId

    
    if (model && save(model)) {
      toast('SAVED', JSON.stringify(model, undefined, 2));
    }

  }

  //处理脏数据
  // var wrongs = db.get('pixivs').remove({ id: {
  //   "isTrusted": true
  // } }).value();
  // console.log(wrongs)

  function save(model) {
    var existed = db.get('pixivs').remove({ id: model.id }).value();
    if (existed) {
      console.log('remove exist:' + JSON.stringify(existed));
    }
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

      $tip = $('<div id="tip" style="position:fixed;font-size:12px;padding:8px;bottom:10px;left: 10px;border:solid 0.5px #150101;background-color:rgba(0,0,0,0.3);z-index:9999"></div>');

      var $closeBtn = $('<button style="width: 25px;height: 25px;float: right; margin-left: 10px;"> - </button>');
      $closeBtn.off('click').on('click', () => {
        $('#tip pre').toggle();
      });

      var $dlBtn = $('<button style="width: 25px;height: 25px;float: right;margin-left: 10px;"> D </button>');
      $dlBtn.off('click').on('click', downLoadAllPixivData);

      $tip.append($dlBtn);
      $tip.append($closeBtn);

  
      $tip.append($('<pre style="max-height:700px;overflow:y;"></pre>'));
 
      $('body').append($tip);
    }
    $tip.find('pre').text(body).show();
   
  }

})();