/**
 * @fileOverview Mwap.js端核心代码;
 * @author by ryan.zhu on 15/5/14;
 * @version 0.5;
 */

(function(root, factory) {
    ////"use strict";//启用严格模式
    /**
     * @classdesc
     * 构造函数,可以支持amd,cmd
     */
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define('Mwap', function(exports) {
            return factory(root, exports);
        });

    } else {
        root.Mwap = factory(root, {});
    }
})(this, function(root, Mwap) {
    /**
     * @原生ajax请求
     * @example
     ajax({
        url: "./TestXHR.aspx",              //请求地址
        type: "POST",                       //请求方式
        data: { name: "super", age: 20 },        //请求参数
        dataType: "json",
        success: function (response, xml) {
            // 此处放成功后执行的代码
        },
        fail: function (status) {
            // 此处放失败后执行的代码
        }
     });
     */
    var RAjax=function(options){
            options = options || {};
            options.type = (options.type || "GET").toUpperCase();
            options.dataType = (options.dataType || "text").toUpperCase();;
            options.cache=options.cache||"true ";
            var params = formatParamsB(options.data);
            var responseFields={
                "XML": "responseXML",
                "TEXT": "responseText",
                "JSON": "responseJSON"
            }
            //创建 - 非IE6 - 第一步
            if (window.XMLHttpRequest) {
                var xhr = new XMLHttpRequest();
            } else { //IE6及其以下版本浏览器
                var xhr = new ActiveXObject('Microsoft.XMLHTTP');
            }
            xhr.responseType=options.dataType;//'text'：返回类型为字符串，这是默认值。'arraybuffer'：返回类型为ArrayBuffer。'blob'：返回类型为Blob。'document'：返回类型为Document。'json'：返回类型为JSON object。
            if(!options.cache){ //禁用缓存
                xhr.setRequestHeader("If-Modified-Since","0");
            }
            //接收 - 第三步
            xhr.onreadystatechange = function () {

                if (xhr.readyState == 4) {  //请求完成，响应就绪
                   // var result = xhr.responseType == "text" ? xhr.responseText : xhr.responseXML; //返回值类型
                    var result = xhr[responseFields[options.dataType]]; //返回值类型
                    if (((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) && typeof options.success == 'function') { //成功
                        options.success && options.success(result, xhr.status);
                    } else if (xhr.status >= 400 && xhr.status < 500) { //客户端出错，404啊神马的
                        options.error && options.error(xhr, xhr.status);
                    } else if (xhr.status >= 500) { //服务器端出错
                        options.error && options.error(xhr, xhr.status);
                    }else{
                        options.error && options.error(xhr, xhr.status);
                    }
                }
            }
            //连接 和 发送 - 第二步
            if (options.type == "GET") {
                xhr.open("GET", options.url + "?" + params, true);
                xhr.send(null);
            } else if (options.type == "POST") {
                xhr.open("POST", options.url, true);
                //设置表单提交时的内容类型
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
                xhr.send(params);
            }
            //格式化参数
            function formatParamsA(data) {
                var arr = [];
                for (var name in data) {
                    arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
                }
                arr.push(("v=" + Math.random()).replace("."));
                return arr.join("&");
            }
            function formatParamsB(obj) {
                var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
                for(name in obj) {
                    value = obj[name];
                    if(value instanceof Array) {
                        for(i=0; i<value.length; ++i) {
                            subValue = value[i];
                            fullSubName = name + '[' + i + ']';
                            innerObj = {};
                            innerObj[fullSubName] = subValue;
                            query += param(innerObj) + '&';
                        }
                    }
                    else if(value instanceof Object) {
                        for(subName in value) {
                            subValue = value[subName];
                            fullSubName = name + '[' + subName + ']';
                            innerObj = {};
                            innerObj[fullSubName] = subValue;
                            query += param(innerObj) + '&';
                        }
                    }
                    else if(value !== undefined && value !== null){
                        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
                    }

                }
                return query.length ? query.substr(0, query.length - 1) : query;
            };
    };
    var utils=(function(){
        /**
         * @description 工具类集合
         * @namespace utils
         */
        var util= {
            /**
             * @description escape函数用于对除英文字母外的字符进行编码。如'Visit W3School!'->'Visit%20W3School%21'
             * @memberof utils
             * @method EncodeUtf8
             * */
            EncodeUtf8: function (s1) {
                var s = escape(s1);
                var sa = s.split("%");//sa[1]=u6211
                var retV = "";
                if (sa[0] != "") {
                    retV = sa[0];
                }
                for (var i = 1; i < sa.length; i++) {
                    if (sa[i].substring(0, 1) == "u") {
                        retV += Hex2Utf8(Str2Hex(sa[i].substring(1, 5)));
                        if (sa[i].length >= 6) {
                            retV += sa[i].substring(5);
                        }
                    }
                    else retV += "%" + sa[i];
                }
                return retV;
            },
            /**
             * @description 获取请求处理参数,抽象请求路径。
             * @param  {string} type 事件类型
             * @param  {Object} data 事件参数
             * */
            getRequestFormEventTypes:function(type,data){
                var requeseType="";
                var str=type.split("::")[0];
                if(type==Mwap.eventTypes.record){//如果是录音
                    switch (data.state){
                        case "startrecord":
                            requeseType=Mwap.server+"/native/record/startrecord";
                            break;
                        case "stoprecord":
                            requeseType=Mwap.server+"/native/record/stoprecord";
                            break;
                        case "startplay":
                            requeseType=Mwap.server+"/native/record/startplay";
                            break;
                        case "stopplay":
                            requeseType=Mwap.server+"/native/record/stopplay";
                            break;
                    }
                }else if(type==Mwap.eventTypes.amap){
                    switch (data.state){
                        case "amapPOI":
                            requeseType=Mwap.server+"/native/amap/amapPOI";
                            break;
                        case "amapLocation":
                            requeseType=Mwap.server+"/native/amap/amapLocation";
                            break;
                        case "amapScreenShot":
                            requeseType=Mwap.server+"/native/amap/amapScreenShot";
                            break;
                    }
                }else if(type==Mwap.eventTypes.album){
                    switch (data.state){
                        case "albumSingleSelect":
                            requeseType=Mwap.server+"/native/album/albumSingleSelect";
                            break;
                        case "albumMultiSelect":
                            requeseType=Mwap.server+"/native/album/albumMultiSelect";
                            break;
                    }
                }else{
                    requeseType=Mwap.eventRequest[type.split("::")[1]]||Mwap.businessURLRequest[type.split("::")[1]];
                }
                return requeseType;

            },
            /**
             * @description 异步返回数据处理,抽象事件类型。
             * @param  {string} type 事件类型
             * @param  {Object} data 事件参数
             * */
            getRequestFormNativeTypes:function(type,event){
                var requeseData={};
                requeseData.type=event.type;
                requeseData.data=event.data;
                var str=type.split("::")[0];
                var action=type.split("::")[1];
                    switch (action){
                        case "amapPOI":
                            requeseData.type=str+"::amap";
                            requeseData.state=action;
                            break;
                        case "amapLocation":
                            requeseData.type=str+"::amap" ;
                            requeseData.state=action;
                            break;
                        case "albumSingleSelect":
                            requeseData.type=str+"::album";
                            requeseData.state=action;
                            break;
                        case "albumMultiSelect":
                            requeseData.type=str+"::album";
                            requeseData.state=action;
                            break;
                    }
                return requeseData;

            }
        }
        function Str2Hex(s) {
            var c = "";
            var n;
            var ss = "0123456789ABCDEF";
            var digS = "";
            for(var i = 0; i < s.length; i ++){
                c = s.charAt(i);
                n = ss.indexOf(c);
                digS += Dec2Dig(eval(n));s
            }
            //return value;
            return digS;
        }
        function Dec2Dig(n1){
            var s = "";
            var n2 = 0;
            for(var i = 0; i < 4; i++) {
                n2 = Math.pow(2,3 - i);
                if(n1 >= n2){
                    s += '1';
                    n1 = n1 - n2;
                }
                else
                    s += '0';

            }
            return s;

        }
        function Dig2Dec(s){
            var retV = 0;
            if(s.length == 4){
                for(var i = 0; i < 4; i ++) {
                    retV += eval(s.charAt(i)) * Math.pow(2, 3 - i);
                }
                return retV;
            }
            return -1;
        }
        function Hex2Utf8(s){
            var retS = "";
            var tempS = "";
            var ss = "";
            if(s.length == 16) {
                tempS = "1110" + s.substring(0, 4);
                tempS += "10" +  s.substring(4, 10);
                tempS += "10" + s.substring(10,16);
                var sss = "0123456789ABCDEF";
                for(var i = 0; i < 3; i ++) {
                    retS += "%";
                    ss = tempS.substring(i * 8, (eval(i)+1)*8);
                    retS += sss.charAt(Dig2Dec(ss.substring(0,4)));
                    retS += sss.charAt(Dig2Dec(ss.substring(4,8)));
                }
                return retS;
            }
            return "";
        }
        Mwap.utils=util;
        return util;
    })();
    Mwap.events=(function() {
        /**
         * @description 事件类
         * @exports events
         *
         */
        function Events() {
            this._events = {};
            var isArrayR = Array.isArray;
            /**
             * @description 绑定事件
             * @example Mwap.events.addListener(type, listener)
             * @param  {string} type 事件类型
             * @param  {function} listener 事件名称
             */
            this.addListener = function (type, listener, scope, once) {
                if ('function' !== typeof listener) {
                    throw new Error('addListener only takes instances of Function');
                }
                this.dispatch('newListener', type, typeof listener.listener === 'function' ?
                    listener.listener : listener);
                if (!this._events[type]) {
                    this._events[type] = listener;
                } else if (isArrayR(this._events[type])) {

                    this._events[type].push(listener);
                } else {
                    this._events[type] = [this._events[type], listener];
                }

            };
            /**
             * @description 绑定事件，等同于addListener
             * @example Mwap.events.on(type, listener)
             * @param  {string} type 事件类型
             * @param  {function} listener 事件名称
             */
            this.on =function(type, listener, scope, once){this.addListener.apply(this,arguments)};
            /**
             * @description 只执行一次事件，就自动销毁;
             * @example Mwap.events.once(type, listener)
             * @param type {string} 事件类型
             * @param listener {function} 执行事件
             * @param scope
             * @returns {Events}
             */
            this.once = function (type, listener, scope) {
                if ('function' !== typeof listener) {
                    throw new Error('.once only takes instances of Function');
                }
                var self = this;
                function g() {
                    self.removeListener(type, g);
                    listener.apply(this, arguments);
                };
                g.listener = listener;
                self.on(type, g);
                return this;
            };
            /**
             * @description 删除事件
             * @example Mwap.events.removeListener(type, listener)
             * @param  {string} type 事件类型
             * @param  {function} listener 执行事件
             */
            this.removeListener = function (type, listener, scope) {
                if ('function' !== typeof listener) {
                    throw new Error('removeListener only takes instances of Function');
                }
                if (!this._events[type]) return this;
                var list = this._events[type];
                if (isArrayR(list)) {
                    var position = -1;
                    for (var i = 0, length = list.length; i < length; i++) {
                        if (list[i] === listener ||
                            (list[i].listener && list[i].listener === listener)) {
                            position = i;
                            break;
                        }
                    }
                    if (position < 0) return this;
                    list.splice(position, 1);
                    if (list.length == 0)
                        delete this._events[type];
                } else if (list === listener ||
                    (list.listener && list.listener === listener)) {
                    delete this._events[type];
                }

                return this;
            };
            /**
             * @description 删除事件,等同于removeListener
             * @example Mwap.events.off(type, listener)
             * @param  {string} type 事件类型
             * @param  {function} listener 执行事件
             */
            this.off =function(type, listener, scope, once){this.removeListener.apply(this,arguments)};
            /**
             * @description 删除和关闭所有事件
             * @example Mwap.events.removeAllListeners(type)
             * @param  {string} type 事件类型
             */
            this.removeAllListeners = function (type) {
                if (arguments.length === 0) {
                    this._events = {};
                    return this;
                }
                if (type && this._events && this._events[type]) this._events[type] = null;
                return this;
            };
            /**
             * @description 删除和关闭所有事件,等同于removeAllListeners
             * @example Mwap.events.offAll(type)
             * @param  {string} type 事件类型
             */
            this.offAll =function(type,scope, once){this.removeAllListeners.apply(this,arguments)};
            /**
             * @description 获取所有监听事件;
             * @example Mwap.events.listeners(type)
             * @param type {string} 事件类型
             * @returns {*} 所有监听事件
             */
            this.listeners = function (type) {
                if (!this._events[type]) this._events[type] = [];
                if (!isArrayR(this._events[type])) {
                    this._events[type] = [this._events[type]];
                }
                return this._events[type];
            };
            /**
             * @description 向设备发送调用请求,success或者error都发送dispatch事件
             * @example Mwap.events.trigger(type,data)
             * @param type {string} 请求类型
             * @param data {string} 发送数据
             */
            this.trigger=function(type,data){
                if(!hasInited){
                    console.log("Mwap需要init");
                    return;
                }
                console.log("trigger--->",utils.getRequestFormEventTypes(type,data));
                alert("请求参数:"+JSON.stringify(data));
                var self=this;
                //$.ajax({
                RAjax({
                    //url:"http://h5.toon.com/test/testAjax.php",//测试
                    url:utils.getRequestFormEventTypes(type,data),
                    type:"post",
                    //dataType:"json",
                    //contentType:"text/xml",
                    data:{params:JSON.stringify(data)},
                    success:function(value){
                        alert("sss:"+value);
                        //Mwap.console.log("**success**:",e);
                        console.log("**success**:",value);
                        //alert("ok1:"+type);
                        var _value={value:value,type:type};
                        self.dispatch(type, _value);
                    },
                    error:function(value){
                        alert("eee:"+value);
                        //alert("ok2:"+type);
                        //Mwap.console.log("**error**:",type);
                        //self.dispatch(type,{data:"error"});
                        console.log("**error**:",value);
                        var _value={value:value.status,type:type};
                        self.dispatch(type,_value);
                    }
                })
            };
            /**
             * @description 派发事件;
             * @example Mwap.events.dispatch(type)
             * @param type {string} 请求类型
             * @returns {boolean}
             */
            this.dispatch= function (type) {

                var type = arguments[0];
                var handler = this._events[type];
                console.log("EEEEEEEE",type, arguments[0],handler);
                if (!handler) return false;
                if (typeof handler == 'function') {
                    switch (arguments.length) {
                        // fast cases
                        case 1:
                            handler.call(this);
                            break;
                        case 2:
                            handler.call(this, arguments[1]);
                            break;
                        case 3:
                            handler.call(this, arguments[1], arguments[2]);
                            break;
                        // slower
                        default:
                            var l = arguments.length;
                            var args = new Array(l - 1);
                            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
                            handler.apply(this, args);
                    }
                    return true;

                } else if (isArrayR(handler)) {
                    var l = arguments.length;
                    var args = new Array(l - 1);
                    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

                    var listeners = handler.slice();
                    for (var i = 0, l = listeners.length; i < l; i++) {
                        listeners[i].apply(this, args);
                    }
                    return true;
                } else {
                    return false;
                }
            };
        }
        return new Events();
    })();
    /**
     * @description 是否执行过初始化;
     * @type {boolean}
     */
    var hasInited = false;
    /**
     * @description 版本号 '0.1.2'
     * @type {string}
     * @global
     */
    Mwap.VERSION = '0.1.2';

    /**
     * @description 自动初始化
     */
    window.addEventListener("DOMContentLoaded", function() {
        if (hasInited == false) {
            Mwap.init();
        }
    });
    /**
     * @description 初始化
     * @type {function}
     * @exports init
     */
    Mwap.init = function() {
        console.log("Mwap:init");
        if (hasInited == true) return 'Don\'t repeat initialization!';
        hasInited = true;
    };
    /**
     * @description 打印在native控制台的console;
     * @type {function}
     * @exports console
     */
    Mwap.console={
        /**
         * @description 打印log
         * @example Mwap.console.log(...arg)
         * @param  arg {*} 匿名
         */
        log:function (){
            var str="[ ";
            for(var i=0;i<arguments.length;i++){
                if(i==arguments.length-1){
                    str+=arguments[i]+" ]";
                }else{
                    str+=arguments[i]+" , ";
                }
            }
            var s="";
            if(/(iPhone|iPad|ios)/.test(navigator.userAgent)){
                s=window.location.href="js-To-native://"+"console.log:/"+utils.EncodeUtf8(str);
            }
            //var s=window.location.href="objc://"+"getParam1:withParam2:"+":/"+utils.EncodeUtf8(str);
            //console.log(arguments);
            return s;
        }
    };
    return Mwap;
});
(function(doc,Mwap){
    Mwap.server="http://127.0.0.1:6780";
    /**
     * @description 来自webserver返回的Respons事件集合
     * @namespace eventTypes
     * @type {string}
     * @property {string} error error="systoon:js::error" (错误提示)
     * @property {string} deviceInfo deviceInfo="systoon:js::deviceInfo" (返回设备信息)
     * @property {string} album album="systoon:js::album" (返回图片信息)
     * @property {string} camera camera="systoon:js::camera" (返回图片信息)
     * @property {string} locationInfo locationInfo="systoon:js::locationInfo" (返回地理位置信息)
     * @property {string} closeWebview closeWebview="systoon:js::closeWebview" (请求关闭webview)
     * @property {string} createQrcode createQrcode="systoon:js::createQrcode" (创建二维码)
     * @property {string} scanQrcode scanQrcode="systoon:js::scanQrcode" (扫描二维码)
     * @property {string} redirect redirect="systoon:native::redirect" (重定向)
     * @property {string} upLoad upLoad="systoon:native::upLoad" (图片上传后的返回)
     * @property {string} shake shake="systoon:native::shake" (手机震动)
     */
    Mwap.eventTypes={
        error:"systoon:js::error",
        deviceInfo:"systoon:js::deviceInfo",
        album:"systoon:js::album",
        camera:"systoon:js::camera",
        locationInfo:"systoon:js::locationInfo",
        closeWebview:"systoon:js::closeWebview",
        createQrcode:"systoon:js::createQrcode",
        scanQrcode:"systoon:js::scanQrcode",
        redirect:"systoon:js::redirect",
        shake:"systoon:js::shake",
        amap:"systoon:js::amap",
        screenShot:"systoon:js::screenShot",
        record:"systoon:js::record",
        contact:"systoon:js::contact",
        phone:"systoon:js::phone",
        message:"systoon:js::message",
        upLoad:"systoon:js::upLoad",
        alert:"systoon:js::alert"

    }
    /**
     * @description 来自native端事件类型集合
     * @namespace nativeTypes
     * @type {object}
     * @property {string} error error="systoon:native::error" (native端返回的错误事件类型)
     * @property {string} album album="systoon:native::album" (native端返回的获取相册事件)
     * @property {string} singleSelect singleSelect="systoon:native::singleSelect" (native端返回的获取单张相册事件)
     * @property {string} multiSelect multiSelect="systoon:native::multiSelect" (native端返回的获取多张相册事件)
     * @property {string} camera camera="systoon:native::camera" (native端返回的获取相机事件)
     * @property {string} locationInfo locationInfo="systoon:native::locationInfo" (native端返回的获取地址位置信息)
     * @property {string} scanQrcode scanQrcode="systoon:native::scanQrcode" (扫描二维码)
     * @property {string} amap amap="systoon:native::amap" (操作地图返回)
     * @property {string} amapPOI amapPOI="systoon:native::amapPOI" (操作地图POI返回)
     * @property {string} amapLocation amapPOI="systoon:native::amapLocation" (操作地图返回Location)
     * @property {string} upLoad upLoad="systoon:native::upLoad" (图片上传后的返回)
     * @property {string} loadParams loadParams="systoon:native::loadParams" (通过dispatch传递参数)
     */
    Mwap.nativeTypes={
        error:"systoon:native::error",

        album:"systoon:native::album",
        singleSelect:"systoon:native::albumSingleSelect",
        multiSelect:"systoon:native::albumMultiSelect",

        camera:"systoon:native::camera",
        locationInfo:"systoon:native::locationInfo",
        scanQrcode:"systoon:native::scanQrcode",

        amap:"systoon:native::amap",
        amapPOI:"systoon:native::amapPOI",
        amapLocation:"systoon:native::amapLocation",

        phone:"systoon:native::phone",
        message:"systoon:native::message",

        upLoad:"systoon:native::upLoad",
        loadParams:"systoon:native::loadParams"
    }
    /**
     * @description  来自webserver的Request请求路径集合
     * @namespace eventRequest
     * @type {string}
     * @property {string} error error="error" (错误信息)
     * @property {string} deviceInfo deviceInfo="http://127.0.0.1:6780/deviceInfo" (设备信息路径)
     * @property {string} album album="http://127.0.0.1:6780/album" (相册路径)
     * @property {string} camera camera="http://127.0.0.1:6780/camera" (相机路径)
     * @property {string} locationInfo locationInfo="http://127.0.0.1:6780/locationInfo" (地理位置信息路径)
     * @property {string} closeWebview closeWebview="http://127.0.0.1:6780/close" (关闭当前webview窗口)
     * @property {string} createQrcode createQrcode="http://127.0.0.1:6780/createQrcode" (创建二维码)
     * @property {string} scanQrcode scanQrcode="http://127.0.0.1:6780/scanQrcode" (扫描二维码)
     * @property {string} redirect redirect="http://127.0.0.1:6780/redirect" (重定向)
     * @property {string} shake shake="http://127.0.0.1:6780/shake" (手机震动)
     * @property {string} amap amap="http://127.0.0.1:6780/amap" (调用地图)
     * @property {string} screenShot screenShot="http://127.0.0.1:6780/screenShot" (屏幕截图)
     * @property {string} startrecord startrecord="http://127.0.0.1:6780/record" (支持录音)
     * @property {string} contact contact="http://127.0.0.1:6780/contact" (通讯录访问)
     * @property {string} phone phone="http://127.0.0.1:6780/phone" (拨打电话)
     * @property {string} message message="http://127.0.0.1:6780/message" (发送短信)
     * @property {string} upLoad upLoad="http://127.0.0.1:6780/upLoad" (图片上传)
     * @property {string} alert alert="http://127.0.0.1:6780/alert" (原生alert支持)
     */
    Mwap.eventRequest={
        error:"error",
        deviceInfo:Mwap.server+"/native/deviceInfo",
        album:Mwap.server+"/native/album",
        camera:Mwap.server+"/native/camera",
        locationInfo:Mwap.server+"/native/locationInfo",
        closeWebview:Mwap.server+"/native/close",
        createQrcode:Mwap.server+"/native/createQrcode",
        scanQrcode:Mwap.server+"/native/scanQrcode",
        redirect:Mwap.server+"/native/redirect",
        shake:Mwap.server+"/native/shake",
        amap:Mwap.server+"/native/amap",
        screenShot:Mwap.server+"/native/screenShot",
        record:Mwap.server+"/native/record",
        contact:Mwap.server+"/native/contact",
        phone:Mwap.server+"/native/phone",
        message:Mwap.server+"/native/message",
        upLoad:Mwap.server+"/native/upLoad",
        alert:Mwap.server+"/native/alert"
    }
})(document,Mwap);
(function(doc,Mwap){
    Mwap.server="http://127.0.0.1:6780";

    Mwap.businessRequest={
        createEnterprise:"systoon:js::createEnterprise",
        createOrganization:"systoon:js::createOrganization",
        popWindow:"systoon:js::popWindow"
    };

    Mwap.businessURLRequest={
        createEnterprise:Mwap.server+"/business/createEnterprise",
        createOrganization:Mwap.server+"/business/createOrganization",
        popWindow:Mwap.server+"/business/popWindow"
    };

    Mwap.businessResponse={
        createEnterprise:"systoon:business::createEnterprise",
        createOrganization:"systoon:business::createOrganization",
        popWindow:"systoon:business::popWindow"
    }
})(document,Mwap);
(function(doc,Mwap){
    function paras(data){
        var flag=data.type.split("::")[0];
        var type=data.type.split("::")[1];
        if(Mwap&&flag==="systoon:native"){
            Mwap.events.dispatch(data.type,{type:data.type,value:{state:data.state,data:data.data}});
        }else if(Mwap&&flag==="systoon:business") {
            Mwap.events.dispatch(data.type,{type:data.type,value:{state:data.state,data:data.data}});
        }else{
            console.log("Mwap或者不是systoon:native|systoon:business");
        }
    }
    for(var key in Mwap.nativeTypes) {
        var type=Mwap.nativeTypes[key];
        doc.addEventListener(type,function(event){

            var data=Mwap.utils.getRequestFormNativeTypes(event.type,event);
            console.log("HHHHHHHHHHHH",data);
            paras(data);
        });
    }
    for(var key in Mwap.businessResponse) {
        var type=Mwap.businessResponse[key];
        doc.addEventListener(type,function(event){
            var data=Mwap.utils.getRequestFormNativeTypes(event.type,event);
            paras(data);
        });
    }

})(document,Mwap);


