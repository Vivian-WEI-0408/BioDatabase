window.B = {};

window.S = {
  'set': function (key, value) {

    if (typeof (value) == 'object')
      value = JSON.stringify(value);

    localStorage.setItem(key, value);

  },
  'get': function (key) {
    var value = localStorage.getItem(key);

    try {
      return JSON.parse(value);
    } catch (ex) {
      return value;
    }
  },
  'remove': function (key) {
    if (typeof key == 'object' && key.hasOwnProperty('length'))
      for (var i = 0; i < key.length; i++) {
        localStorage.removeItem(key[i]);
      }
    else
      localStorage.removeItem(key);
  },
  'clear': function () {
    var data = getFields(localStorage, ['lang'], false);
    localStorage.clear();
    for (var name in data) {
      localStorage.setItem(name, data[name]);
    }
  }
};

window.A = {
  'show': function (body, title, type) {
    body = G.t(body);
    title = G.t(title);
    return Sweetalert2.mixin({
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-outline mr10'
      },
      confirmButtonText: G.t('我知道了'),
      showCancelButton: false,
      buttonsStyling: false,
    }).fire(title, body, type || '');
  },
  'ok': function (body, title) {
    body = G.t(body);
    title = G.t(title);
    return Sweetalert2.mixin({
      customClass: {
        confirmButton: 'btn btn-primary',
      },
      confirmButtonText: G.t('我知道了'),
      buttonsStyling: false,
    }).fire(title, body, 'success');
  },
  'err': function (body, title) {
    body = G.t(body);
    title = G.t(title);
    return Sweetalert2.mixin({
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-outline mr10'
      },
      confirmButtonText: G.t('我知道了'),
      showCancelButton: false,
      buttonsStyling: false,
    }).fire(title, body, 'error');
  },
  'toast': function (text, duration, type) {
    text = G.t(text);
    return Sweetalert2.mixin({
      timer: duration || 1000,
      timerProgressBar: true,
      buttonsStyling: false,
      showCancelButton: false,
      showConfirmButton: false
    }).fire(text, '', type || 'success');
  },
  'safety': function (content, type, onlyAlert) {
    content = G.t(content);
    return Sweetalert2.mixin({
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-outline mr10'
      },
      confirmButtonText: G.t('我知道了'),
      cancelButtonText: G.t('取消'),
      buttonsStyling: false,
      showCancelButton: !onlyAlert
    }).fire(G.t('再次确认'), content, type || 'warning');

  },
  'danger': function (content, type, onlyAlert) {
    content = G.t(content);
    return Sweetalert2.mixin({
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-outline mr10'
      },
      confirmButtonText: G.t('我知道了'),
      cancelButtonText: G.t('取消'),
      buttonsStyling: false,
      showCancelButton: !onlyAlert
    }).fire(G.t('危险操作'), content, type || 'warning');

  }
};

Date.prototype.format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1, //月份
    'd+': this.getDate(), //日
    'h+': this.getHours(), //小时
    'm+': this.getMinutes(), //分
    's+': this.getSeconds(), //秒
    'q+': Math.floor((this.getMonth() + 3) / 3), //季度
    'S': this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
  return fmt;
};

Date.now = function () {
  return new Date().format('yyyy-MM-dd hh:mm:ss');
}
Array.prototype.last = function () {
  return this[this.length - 1];
};

Array.prototype.remove = function (item) {
  var index = this.indexOf(item);
  if (index > -1)
    this.splice(index, 1);
  return this;
};

Array.prototype.removeAll = function (items) {

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var index = this.indexOf(item);
    if (index > -1)
      this.splice(index, 1);
  }
  return this;
};

Array.prototype.append = function (items) {
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var index = this.indexOf(item);
    if (index < 0)
      this.push(item);
  }
  return this;
};

Array.prototype.sortByIds = function (ids) {
  if (typeof ids == 'string') {
    ids = ids.split(',');
  }
  let dict = listToDict(this);
  let arr = [];
  ids.forEach(id => {
    let item = dict[Number(id)];
    if (item) {
      arr.push(item);
    }
  });
  return arr;
};

window.getFields = function (model, fields, isInclude) {
  isInclude = isInclude == undefined ? true : isInclude;

  var result = {};

  if (isInclude) {
    for (var i = 0; i < fields.length; i++) {

      var field = fields[i];

      if (typeof field == "string") {
        if (model[field] != null)
          result[field] = model[field];
      } else if (typeof field == "object") {
        for (var source in field) {
          var fieldName = field[source];
          result[fieldName] = model[source];
          break;
        }
      }
    }
  } else {
    for (var name in model) {

      var value = model[name];

      if (fields.indexOf(name) < 0 && value != null)
        result[name] = value;

    }
  }

  return result;
}

window.listToDict = function (list, keyName, dict) {

  keyName = keyName || 'id';

  dict = dict || {};

  if (list && list.length > 0) {
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      dict[item[keyName]] = item;
    }
  }

  return dict;

}

window.listToDict2 = function (list, keyName, valueName) {

  keyName = keyName || 'id';

  var dict = {};

  if (list && list.length > 0) {
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      dict[item[keyName]] = item[valueName];
    }
  }

  return dict;

}

window.mirror = function (source, target) {

  target = target || {};

  for (var name in source) {
    target[name] = source[name];
  }

  return target;
}

window.combineObject = function (o1, o2) {
  var r = {};

  for (var key in o1) {
    r[key] = o1[key];
  }

  for (var key in o2) {
    r[key] = o2[key];
  }

  return r;
}

window.getURLParams = function () {

  if (location.search && location.search.indexOf('?') > -1) {

    var r = location.search.split('?')[1].split('&');

    var obj = {};

    if (r.length > 0) {

      r.forEach(function (item) {
        var _tmp = item.split('=');
        obj[_tmp[0]] = _tmp[1];
      });

      return obj;
    }

  }

  return {};

}

window.paramsToJSON = function (r) {

  r = r.split('&');

  var obj = {};

  if (r.length > 0) {

    r.forEach(function (item) {
      var _tmp = item.split('=');
      obj[_tmp[0]] = _tmp[1];
    });

    return obj;

  }

  return {};

}

window.compressImg = function (file, options, callback) {
  var imgname = file.name;
  var imgtype = (imgname.substring(imgname.lastIndexOf('.') + 1)).toLowerCase();
  if (imgtype == 'jpg' || imgtype == 'jpeg') {
    imgtype = 'image/jpeg';
  } else {
    imgtype = 'image/png';
  }
  // 用FileReader读取文件
  var reader = new FileReader();
  // 将图片读取为base64
  reader.readAsDataURL(file);
  reader.onload = function (evt) {
    var base64 = evt.target.result;
    window._compressImg(base64, options, callback, imgtype);
  }
};

window._compressImg = function (base64, options, callback, imgtype) {
  imgtype = imgtype || 'image/png';
  // 创建图片对象
  var img = new Image();
  // 用图片对象加载读入的base64
  img.src = base64;



  img.onload = function () {
    var that = this,
      canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

    var maxWidth = options.max_width;
    var maxHeight = options.max_height;

    var targetWidth, targetHeight;

    if (img.width > maxWidth && img.height > maxHeight) {
      const rate = Math.min(maxWidth / img.width, maxHeight / img.height)
      targetWidth = img.width * rate
      targetHeight = img.height * rate
    } else if (img.width > maxWidth) {
      targetWidth = maxWidth
      targetHeight = (maxWidth / img.width) * img.height
    } else if (img.height > maxHeight) {
      targetHeight = maxHeight
      targetWidth = (maxHeight / img.height) * img.width
    } else {
      targetWidth = img.width
      targetHeight = img.height
    }

    canvas.setAttribute('width', targetWidth);
    canvas.setAttribute('height', targetHeight);
    // 将图片画入canvas
    ctx.drawImage(that, 0, 0, targetWidth, targetHeight);

    // 压缩到指定体积以下（M）
    if (options.size) {
      var scale = 0.9;
      (function f(scale) {
        if (base64.length / 1024 / 1024 > options.size && scale > 0) {
          base64 = canvas.toDataURL(imgtype, scale);
          scale = scale - 0.1;
          f(scale);
        } else {
          callback(base64);

        }
      })(scale);
    } else if (options.scale) {
      // 按比率压缩
      base64 = canvas.toDataURL(imgtype, options.scale);
      callback(base64);
    } else if (options.max_height || options.max_height) {
      base64 = canvas.toDataURL(imgtype, 1);
      callback(base64);
    }

  }
}

window.getObjectURL = function (file) {
  var url = null;
  if (window.createObjectURL != undefined) { //basic
    url = window.createObjectURL(file);
  } else if (window.URL != undefined) { //mozilla(firefox)兼容火狐
    url = window.URL.createObjectURL(file);
  } else if (window.webkitURL != undefined) { //webkit or chrome
    url = window.webkitURL.createObjectURL(file);
  }
  return url;
}

window.filter = function (arr, fn) {
  var res = [];
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i]))
      res.push(arr[i]);
  }
  return res;
}

window.pluck = function (items, key) {
  var arr = [];
  for (var i = 0; i < items.length; i++) {
    arr.push(items[i][key]);
  }
  return arr;
}

window.pick = function (items, fields) {
  var arr = [];
  for (var i = 0; i < items.length; i++) {
    let item = {};
    for (var j = 0; j < fields.length; j++) {
      item[fields[j]] = items[i][fields[j]];
    }
    arr.push(item);
  }
  return arr;
}

window.ImageUploader = {
  'openSelector': function () {
    document.getElementById('fImage').click();
  },
  'onChange': function () {

    var inputFile = window.event.target;

    var file = inputFile.files[0];

    if (!file)
      return;

    if (file.type.match('image.*')) {
      if (ImageUploader.onSelectImage)
        ImageUploader.onSelectImage(file);
    } else {
      inputFile.value = '';
    }
  },
  'onSelectImage': function () {

  }
};

window.FileUploader = {
  'openSelector': function (mimes, multiple) {
    let f = document.getElementById('fFile');
    f.multiple = multiple !== undefined ? multiple : true;
    f.accept = mimes ? mimes : '*/*';
    f.click();
  },
  'openExcel': function () {
    let f = document.getElementById('fFile');
    f.multiple = false;
    f.accept = '.xls,.xlsx,.csv';
    f.click();
  },
  'onChange': function () {

    var inputFile = window.event.target;

    if (inputFile.files.length == 0)
      return;

    if (FileUploader.onSelectFiles)
      FileUploader.onSelectFiles(inputFile.files);

    inputFile.value = '';
  },
  'onSelectFiles': function (files) { }
};

window.copyFrom = function (source, target) {
  for (let key in source) {
    source[key] = target[key];
  }
}

window.shuffleArray = function (arr) {
  const newArr = [...arr]; // 浅拷贝
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

Array.prototype.unique = function (isStrict) {

  if (this.length < 2)
    return [this[0]] || [];

  var tempObj = {},
    newArr = [];

  for (var i = 0; i < this.length; i++) {

    var v = this[i];

    var condition = isStrict ? (typeof tempObj[v] != typeof v) : false;

    if ((typeof tempObj[v] == "undefined") || condition) {

      tempObj[v] = v;

      newArr.push(v);
    }
  }
  return newArr;
};

Array.prototype.clear = function () {
  this.length = 0;
};

Array.prototype.pick = function (ids, field) {
  field = field || 'id';
  let arr = [];
  if (typeof ids == 'string') {
    ids = ids.split(',');
  }
  else if (typeof ids == 'object' && ids.length) {
    let tmp = [];
    ids.forEach(id => {
      tmp.push(id.toString());
    });
    ids = tmp;
  }

  for (let i = 0; i < this.length; i++) {
    if (ids.indexOf(this[i][field].toString()) > -1) {
      arr.push(this[i]);
    }
  }

  return arr;
};

function printerClasses(selector) {
  var classListArr = [];
  var currentArr = [];
  var allClass = [];
  var parents = selector;
  var filterClassName = ['icon', 'swiper', 'flex', 'text-center', 'ng-scope', 'ng-binding']
  var s = $(parents).children();
  s.each(function (index, item) {
    if (item.localName != 'script') {
      classListArr.push({});
      var its = classListArr[index];
      eachItem(index, item, its);
    }
  });

  function eachItem(index, item, its) {
    if (item.localName == 'img') {
      its.mainClass = 'img';
      return;
    };
    if (item.classList.length > 0) {
      its.secondClass = [];
      its.mainClass = '';
      for (let t = 0; t < item.classList.length; t++) {
        if (item.classList[t].startsWith('_') && its.mainClass.length == 0) {
          its.mainClass = item.classList[t];
        } else {
          its.secondClass.push(item.classList[t]);
        }
        if (t == item.classList.length - 1 && its.mainClass.length == 0) {
          its.mainClass = item.classList[0];
          for (let l = 0; l < its.secondClass.length; l++) {
            if (its.secondClass[l] == its.mainClass) {
              its.secondClass.splice(l, 1);
            }
          }
        }
      }
    };
    if (item.children.length > 0) {
      its.childrens = [];
      let l = 0;
      while (l < item.children.length) {
        let item2 = item.children[l];
        if (item2.localName != 'script') {
          its.childrens.push({});
          eachItem(l, item2, its.childrens[l]);
        }
        l++;
      }
    }
  };

  function filterClass(cla) {
    for (let t = 0; t < filterClassName.length; t++) {
      if (filterClassName[t].startsWith(cla)) {
        return true;
      }
    }
  };

  function addCurrent(item, fu) {
    if (item.mainClass && item.mainClass == 'img') {
      currentArr.push(fu + ' ' + item.mainClass);
      return;
    };
    if (item.mainClass && item.mainClass != 'img') {
      if (!filterClass(item.mainClass)) {
        currentArr.push(fu + ' .' + item.mainClass);
      }
    };
    if (item.secondClass && item.secondClass.length > 0) {
      item.secondClass.forEach(function (item) {
        if (allClass.indexOf('.' + item) == -1) {
          allClass.push('.' + item);
        }
      })
    };
    if (item.childrens && item.childrens.length > 0) {
      let mains = item.mainClass;
      item.childrens.forEach(function (item) {
        addCurrent(item, fu + ' .' + mains);
      })
    }
  }

  classListArr.forEach(function (item, index) {
    if (parents != 'body') {
      addCurrent(item, parents);
    } else {
      addCurrent(item, '');
    }
  });

  var win;
  win = window.open('about:blank', '', 'scroll:1;status:0;help:0;resizable:1;dialogWidth:800px;dialogHeight:600px');
  win.document.write(currentArr.unique().join('{}'));
}

window.initGlobalFuncs = function (moment) {

  let G = window['vapp'].config.globalProperties;

  G.url = function (url) {
    if (!url)
      return url;
    if (url.indexOf('/img') > -1 || url.indexOf('blob:') > -1 || url.indexOf('http') == 0)
      return url;
    else
      return G.sourceUrl + url;
  }

  G.avatar = function (url) {
    if (!url)
      return '/assets/imgs/avatar-2.png';
    if (url.indexOf('/img') > -1 || url.indexOf('blob:') > -1 || url.indexOf('http') == 0)
      return url;
    else
      return G.sourceUrl + url;
  }

  G.url1 = function (urls) {
    return G.sourceUrl + (urls.split(',')[0]);
  }

  G.thumb = function (url) {
    return G.sourceUrl + url.replace('img/', 'thumb/');
  }

  G.thumb1 = function (urls) {
    return G.sourceUrl + (urls.split(',')[0]).replace('img/', 'thumb/');
  }

  G.makeSort = function (sort) {
    let order = [];
    for (let key in sort) {
      if (sort[key] > 0)
        order.push(key + '-' + sort[key]);
    }
    return order.join(',');
  }

  G.sortToggle = function (sort, key) {

    let old = sort[key];

    let value;

    for (let _key in sort) {
      sort[_key] = 0;
    }

    if (old == 0)
      value = 2;
    else if (old == 1)
      value = 2;
    else if (old == 2)
      value = 1;

    sort[key] = value;

  }

  G.stopPropagation = function () {
    event.stopPropagation();
  }

  G.hl = function (text, keywords) {
    if (text) {
      return text.replace(keywords, '<b class="tr">' + keywords + '</b>')
    }
    return "";
  };

  G.br = function (text) {
    if (text) {
      return text.replace(/\n/g, "<br>");
    }
    return "";
  }

  G.t = function (text) {

    if (!text) {
      return text;
    }

    let v = window._i18n[window._language][text];

    if (arguments.length == 1) {
      if (v)
        return v;
    }
    else if (arguments.length > 1) {
      if (!v)
        v = text;

      let arr = [];
      for (let i = 1; i < arguments.length; i++) {
        arr.push(arguments[i]);
      }
      arr.forEach((item, i) => {
        v = v.replace(new RegExp('\\$' + i, 'gi'), item);
      });

      return v;
    }

    return text;
  }

  G.number = function (num) {
    var suffix = '';

    num = Number(num);
    if (num.toString().indexOf('.') > -1) {
      suffix = '.' + num.toString().split('.')[1];
      num = num.toString().split('.')[0];
    }
    var result = [],
      counter = 0;
    num = (num || 0).toString().split('');
    for (var i = num.length - 1; i >= 0; i--) {
      counter++;
      result.unshift(num[i]);
      if (!(counter % 3) && i != 0) {
        result.unshift(',');
      }
    }
    return result.join('') + suffix;
  };

  G.df = function (date) {
    var d = new Date(date);
    return d.format('MM/dd hh:mm');
  };

  G.df2 = function (date) {
    return date.replace(':', '时') + '分';
  };

  G.df3 = function (date) {
    return new Date(date).format('MM月dd日');
  };

  G.df4 = function (date) {
    return new Date(date).format('yyyy.M.d');
  };

  G.df5 = function (date) {
    return new Date(date).format('hh:mm');
  };

  G.df6 = function (date) {
    return new Date(date).format('MM/dd hh:mm');
  };

  G.df7 = function (date) {
    return new Date(date).format('MM/dd');
  };

  G.df8 = function (date) {
    return new Date(date).format('yyMMddhhmm');
  };

  G.plainText = function (html) {
    if (!html) return '';
    var d = document.createElement("div");
    d.innerHTML = html;
    return d.innerText;
  };

  G.n = function (number) {
    return Number(number);
  };

  G.d = function (date) {
    if (!date)
      return '';
    return new Date(date).format('M/d hh:mm')
  };

  G.d2 = function (date) {
    if (!date)
      return '';
    return new Date(date).format('M/d')
  };

  G.d3 = function (date) {
    if (!date)
      return '';
    return new Date(date).format('h:s')
  };

  G.d4 = function (date) {
    if (!date)
      return '';
    return new Date(date).format('yyyy.MM.dd')
  };

  G.firstline = function (text) {
    if (text) {
      return text.split("\n")[0];
    }
    return "";
  };

  G.pad2 = function (v) {
    v = v.toString();
    if (v.length == 1)
      return "0" + v;
    else
      return v;
  };

  G.pad3 = function (v) {
    v = v.toString();
    if (v.length == 1)
      return "00" + v;
    else if (v.length == 2)
      return "0" + v;
    else
      return v;
  };

  G.switchLanguage = function () {
    if (localStorage["_language"] == "zh-cn")
      localStorage["_language"] = "en-us";
    else localStorage["_language"] = "zh-cn";
    location.reload();
  };

  G.cstToLocal = function (time) {

    if (!time)
      return time;

    const today = (new Date()).format('yyyy-MM-dd');

    time = today + ' ' + time;

    const beijingTime = moment.tz(time, "Asia/Shanghai");

    const outsideTime = beijingTime.tz(moment.tz.guess());

    return outsideTime.format('HH:mm');

  }

  G.clearUserData = function () {
    let keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.indexOf('u_') > -1) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('_u');
  }

  G.countStr = function (ids) {
    if (!ids)
      return 0;
    return ids.split(',').length;
  }

  G.friendlyDate = function (dateTime) {
    if (dateTime) {
      dateTime = new Date(dateTime);
      return dateTime.format('yyyy/MM/dd');
    }
    else {
      return '--月--日(星期-)';
    }
  }

  G.friendlyTime = function (dateTime) {

    if (dateTime) {
      dateTime = new Date(dateTime);
      let v = Number(dateTime.format('hh'));
      let prefix = '';
      if (v > 12) {
        prefix = G.t('下午');
        v = v - 12;
      }
      else {
        prefix = G.t('上午');
      }

      if (v < 10) {
        v = '0' + v;
      }
      if (_language == 'en-us') {
        return prefix + ' ' + v + ':' + dateTime.format('mm');
      }
      else {
        return prefix + ' ' + v + '点' + dateTime.format('mm分');
      }
    }
    else {
      if (_language == 'en-us') {
        return '-- --:--';
      }
      else {
        return '-- --点--分';
      }
    }
  }

  G.clearObject = function (obj) {
    for (let key in obj) {
      obj[key] = '';
    }
  }

}

window.randomPD = function (min, max) {
  return Math.random() * (max - min) + min;
};

window.downloadFile = function (url, filename) {
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


window.isDebug = /localhost/.test(location.host);
window.isProd = !window.isDebug;

window.debug = function (fn) {
  if (isDebug) {
    fn();
  }
}

window.prod = function (fn) {
  if (isProd) {
    fn();
  }
}

window.isMobile = /android|iphone|ios/gi.test(navigator.userAgent);
window.__ifrLoad = function () {
  window.ifrLoad && window.ifrLoad();
  let once = window.ifrLoadOnce;
  window.ifrLoadOnce = null;
  setTimeout(() => {
    once && once();
  }, 1000);

}

window.ifr = function () {
  return document.getElementById('ifr');
}

window.ifrWin = function () {
  return ifr().contentWindow;
}

window.ifrDoc = function () {
  return ifrWin().document;
}

window.fillForm = function (formElement, data) {
  for (const [key, value] of Object.entries(data)) {
    const field = formElement.elements[key];
    if (field) {
      if (field.type === 'checkbox') {
        field.checked = Boolean(value);
      } else if (field.type === 'radio') {
        // 支持单选组：设置匹配 value 的 radio 为 checked
        const radioGroup = formElement.querySelectorAll(`[name="${key}"]`);
        radioGroup.forEach(radio => {
          radio.checked = radio.value === String(value);
        });
      } else if (field.tagName === 'SELECT') {
        field.value = value;
      } else {
        // text, email, hidden, 等 input 类型
        field.value = value ?? ''; // null/undefined 转为空字符串
      }
    }
  }
}

window.numberCheck = function (f, err, fields) {
  let valid = true;
  fields.forEach(field => {

    let v = f[field];
    if (v.toString().trim() == '') {
      err[field] = 'Required';
      valid = false;
    }
    if (isNaN(v)) {
      err[field] = 'Invalid';
      valid = false;
    }
  });

  return valid;
}