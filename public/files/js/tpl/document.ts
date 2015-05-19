/*
 * Copyright (c) 2013 Institute of the Czech National Corpus
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2
 * dated June, 1991.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

/// <reference path="../../ts/declarations/jquery.d.ts" />
/// <reference path="../../ts/declarations/common.d.ts" />
/// <reference path="../../ts/declarations/react.d.ts" />
/// <reference path="../../ts/declarations/flux.d.ts" />
/// <reference path="../../ts/declarations/rsvp.d.ts" />

import win = require('win');
import $ = require('jquery');
import queryInput = require('queryInput');
import popupbox = require('popupbox');
import applicationBar = require('plugins/applicationBar');
import flux = require('vendor/Dispatcher');
import documentViews = require('views/document');
import React = require('vendor/react');
import RSVP = require('vendor/rsvp');


/**
 *
 */
class NullStorage implements Storage {
    key(idx:number):string {return null}
    getItem(key:string) {}
    setItem(key:string, value:string) {}
    removeItem(key:string) {}
    clear():void {}
    length:number = 0;
    remainingSpace:number = 0;
    [key: string]: any;
    [index: number]: any;
}

/**
 * Dispatcher payload
 */
class Action {

    /**
     * An object which invoked the action; optional
     */
    source:any;

    /**
     * App-wide action identification
     */
    actionType:string;

    /**
     * Optional message
     */
    message:{msgType:string; message:string};

    /***
     * Action specific data
     */
    data:{[k:string]:any};
}


/**
 *
 * A local storage factory. If a respective
 * API is not supported then @link{NullStorage} is returned.
 */
function getLocalStorage():Storage {
    if (typeof win.localStorage === 'object') {
        return win.localStorage;

    } else {
        new NullStorage();
    }
}

/**
 */
export interface InitCallbackObject {
    plugin:string;
    method:string;
    args?:Array<any>;
}

/**
 * Either a function or an object
 */
export type InitCallback = InitCallbackObject|(()=>void);


/**
 * Functions required by KonText's React components
 */
export interface ComponentCoreMixins {

    /**
     *
     * @param s
     */
    translate(s:string):string;

    /**
     *
     * @param k
     */
    getConf(k:string):any;
}


/**
 *
 */
export class PageModel implements Kontext.PluginProvider {

    /**
     * KonText configuration (per-page dynamic object)
     */
    conf:Kontext.Conf;

    /**
     * Flux Dispatcher (currently not used across the app)
     */
    dispatcher:flux.Dispatcher<any>;

    /**
     * Custom client-side plug-ins implementations
     */
    plugins:{[name:string]:any}; // TODO type

    /**
     * Registered callbacks for plug-ins reinitialization
     */
    pluginResets:Array<()=>void> = []; // TODO

    /**
     *
     * @type {Array}
     */
    initCallbacks:Array<()=>void>;

    /**
     *
     */
    mainMenu:MainMenu;

    /**
     * Results of partial page initializations.
     */
    initActions:InitActions;

    /**
     * Local user settings
     */
    userSettings:UserSettings;

    /**
     *
     * @param conf
     */
    constructor(conf:Kontext.Conf) {
        this.conf = conf;
        this.dispatcher = new flux.Dispatcher();
        this.plugins = {};
        this.initCallbacks = [];
        this.mainMenu = new MainMenu();
        this.initActions = new InitActions();
        this.userSettings = new UserSettings(getLocalStorage(), 'kontext_ui', '__timestamp__',
            this.conf['uiStateTTL']);
    }

    /**
     * Creates an instance of React component using passed factory function
     * (= function a 'view' module provides).
     *
     * @param factory A view factory function
     * @param mixins Additional mixins
     * @returns React component
     */
    initReactComponent(factory:(mixins:Array<{}>)=>any, ...mixins:any[]):any { // TODO type?
        var self = this;
        var componentTools:ComponentCoreMixins = {
            translate(s:string):string {
                return self.translate(s);
            },
            getConf(k:string):any {
                return self.getConf(k);
            }
        };
        return factory.call(factory, this.dispatcher, mixins ? mixins.concat([componentTools]) : [componentTools]);
    }

    /**
     * Renders provided React component with specified mount element.
     *
     * @param reactClass
     * @param target An element whose content will be replaced by rendered React component
     */
    renderReactComponent(reactClass, target:HTMLElement):void {
        React.render(React.createElement(reactClass), target);
    }

    /**
     * @param selectAllElm
     * @param forceStatus
     */
    private toggleSelectAllTrigger(selectAllElm:HTMLInputElement, forceStatus?:string) {
        var currValue:string,
            newValue:string;

        if (!$(selectAllElm).attr('data-status')) {
            $(selectAllElm).attr('data-status', '1');
        }
        currValue = $(selectAllElm).attr('data-status');
        if (forceStatus) {
            newValue = forceStatus;

        } else if (currValue === '1') {
            newValue = '2';

        } else if (currValue === '2') {
            newValue = '1';
        }

        if (currValue !== newValue) {
            $(selectAllElm).attr('data-status', newValue);
            if (newValue === '1') {
                selectAllElm.checked = false;
            }
        }
    }

    /**
     * Adds a plug-in to the model. In general, it is not
     * required to do this on a page using some plug-in but
     * in that case it will not be possible to use plug-in
     * related methods of document.js model.
     *
     * @param name
     * @param plugin
     */
    registerPlugin(name:string, plugin:Kontext.Plugin) {
        this.plugins[name] = plugin;
    }

    /**
     * @param name
     */
    getPlugin(name:string):Kontext.Plugin {
        return this.plugins[name];
    }

    /**
     * Calls a function on a registered plug-in with some additional
     * testing of target's callability.
     *
     * @param {string} name
     * @param {string} fn
     * @param {string} [args]
     * @return the same value as called plug-in method
     */
    callPlugin(name:string, fn:string, args?:any[]) {
        if (typeof this.plugins[name] === 'object'
            && typeof this.plugins[name][fn] === 'function') {
            return this.plugins[name][fn].apply(this.plugins[name][fn], args);

        } else {
            throw new Error("Failed to call method " + fn + " on plug-in " + name);
        }
    }

    /**
     * Registers a callback called during model initialization.
     * It can be either a function or an object specifying plug-in's function
     * ({plugin : 'name', 'method' : 'method name', 'args' : [optional array of arguments]})
     * @param fn
     */
    registerInitCallback(fn:InitCallback):void;
    registerInitCallback(fn:()=>void):void;
    registerInitCallback(fn):void {
        var self = this;

        if (typeof fn === 'function') {
            this.initCallbacks.push(fn);

        } else if (typeof fn === 'object' && fn['plugin'] && fn['method']) {
            this.initCallbacks.push(function () {
                self.callPlugin(fn['plugin'], fn['method'], fn['args']);
            });

        } else {
            throw new Error('Registered invalid callback');
        }
    }

    /**
     * Escapes general string containing HTML elements and entities
     *
     * @param html
     */
    escapeHTML(html:string):string {
        var elm = document.createElement('div');
        elm.appendChild(document.createTextNode(html));
        return elm.innerHTML;
    }

    /**
     * Cuts an end of a text. If a non-empty string is detected
     * at the end then additional characters up to the next whitespace
     * are removed.
     *
     * @param s
     * @param length
     */
    shortenText(s:string, length:number):string {
        var ans = s.substr(0, length),
            items;

        if (ans.length > length && !/\s.|.\s/.exec(s.substr(length - 1, 2))) {
            items = ans.split(/\s+/);
            ans = items.slice(0, items.length - 1).join(' ');
        }
        if (ans.length < s.length) {
            ans += '...';
        }
        return ans;
    }

    /**
     * Normalizes error representation (sometimes it is a string,
     * sometimes it is an object) into an object with well defined
     * properties.
     *
     * @param obj
     */
    unpackError(obj):{message:string; error:Error; reset:boolean} {
        var ans:{message:string; error:Error; reset:boolean} = {message:null, error:null, reset:null};

        if (typeof obj === 'object') {
            ans.message = obj.message;
            ans.error = obj.error;
            ans.reset = obj.reset || false;

        } else {
            ans.message = obj;
            ans.error = null;
            ans.reset = false;
        }
        return ans;
    }

    /**
     * @param elm
     * @param options
     * @return
     */
    appendLoader(elm:HTMLElement, options?:{domId:string; htmlClass:string}) {
        var jImage = $('<img />');

        options = options || {domId:null, htmlClass:null};
        jImage.attr('src', '../files/img/ajax-loader.gif');
        if (options.domId) {
            jImage.addClass(options.domId);
        }
        if (options.htmlClass) {
            jImage.addClass(options.htmlClass);
        }
        $(elm).append(jImage);
        return jImage;
    }

    /**
     * Wrapper for jQuery's $.ajax function which is able
     * to handle error states using client's capabilities
     * (error messages, page reload etc.).
     *
     * @param url
     * @param options
     * @deprecated promise-based solutions should be preferred
     */
    ajax(url:string, options:JQueryAjaxSettings):void {
        var self = this,
            succWrapper,
            origSucc;

        if (arguments.length === 1) {
            options = url;
        }

        if (!options.error) {
            options.error = function (jqXHR, textStatus, errorThrown) {
                self.showMessage('error', errorThrown);
            };
        }

        origSucc = options.success;
        succWrapper = function (data, textStatus, jqXHR) {
            var error;

            if (data.hasOwnProperty('error')) {
                error = self.unpackError(data.error);

                if (error.reset === true) {
                    win.location = self.createActionUrl('first_form');

                } else {
                    options.error(null, null, error.message || 'error');
                }

            } else {
                origSucc(data, textStatus, jqXHR);
            }
        };
        options.success = succWrapper;

        if (arguments.length === 1) {
            $.ajax(options);

        } else {
            $.ajax(url, options);
        }
    }

    /**
     * @param msgType - one of 'info', 'warning', 'error', 'plain'
     * @param message - text of the message
     * @param callback - do something after message is rendered
     */
    showMessage = (msgType:string, message:string, callback?:(msgElm:HTMLElement)=>void) => {
        var innerHTML:string,
            messageListElm:HTMLElement,
            messageElm:HTMLElement,
            timeout:number,
            typeIconMap:{[t:string]:string};

        typeIconMap = {
            info: '../files/img/info-icon.png',
            warning: '../files/img/warning-icon.png',
            error: '../files/img/error-icon.png'
        };

        if (typeof message === 'object' && msgType === 'error') {
            message = message['message'];
        }

        innerHTML = '<img class="icon" alt="message" src="' + typeIconMap[msgType] + '">'
            + '<span>' + message + '</span><a class="close-icon"><img src="../files/img/close-icon.png" /></a>';

        if ($('#content .messages').length === 0) {
            messageListElm = win.document.createElement('div');
            $(messageListElm).addClass('messages');
            $('#content').prepend(messageListElm);

        } else {
            messageListElm = $('#content .messages').get(0);
        }
        messageElm = win.document.createElement('div');
        $(messageElm).addClass('message').addClass(msgType);
        $(messageElm).html(innerHTML);
        $(messageListElm).append(messageElm);


        $(messageElm).find('a.close-icon').bind('click', function () {
            $(messageElm).hide(200);
        });

        if (this.conf['messageAutoHideInterval']) {
            timeout = win.setTimeout(function () {
                $(messageElm).hide(200);
                win.clearTimeout(timeout);
            }, this.conf['messageAutoHideInterval']);
        }

        if (typeof callback === 'function') {
            callback(messageElm);
        }
    };

    /**
     * Transforms an existing element into a context help link with bound pop-up message.
     *
     * @param triggerElm - an element to be transformed into a context help link
     * @param text - a text of the help message
     */
    contextHelp(triggerElm:HTMLElement, text:string):void {
        var image = win.document.createElement('img');

        $(triggerElm).addClass('context-help');
        $(image).attr('data-alt-img', '../files/img/question-mark_s.png')
            .attr('src', '../files/img/question-mark.png')
            .addClass('over-img');
        $(triggerElm).append(image);
        popupbox.bind(triggerElm, text, {width: 'nice'});
    }

    /**
     * Modifies form (actually, it is always the #mainform)
     * in a way that only current corpus is changed. Under
     * normal circumstances, the form submits to the concordance
     * view page via POST method.
     *
     * @param event
     */
    formChangeCorpus(event:JQueryEventObject):void {
        var jqFormElm = $(event.target).closest('form'),
            subcorpSelect = $('#subcorp-selector');

        jqFormElm.attr('action', 'first_form');
        jqFormElm.attr('method', 'GET');
        if (subcorpSelect.val()) {
            subcorpSelect.val(null);
        }
        jqFormElm.submit();
    }

    /**
     * Disables (if state === true) or enables (if state === false)
     * all empty/unused form fields. This is used to reduce number of passed parameters,
     * especially in case of parallel corpora.
     *
     * @param state
     */
    setAlignedCorporaFieldsDisabledState(state:boolean):void {
        var stateStr:string = state.toString();

        $('#mainform input[name="sel_aligned"]').each(function () {
            var corpn = $(this).data('corpus'), // beware - corp may contain special characters colliding with jQuery
                queryType;

            // non empty value of 'sel_aligned' (hidden) input indicates that the respective corpus is active
            if (!$(this).val()) {
                $('select[name="pcq_pos_neg_' + corpn + '"]').attr('disabled', stateStr);
                $('select[name="queryselector_' + corpn + '"]').attr('disabled', stateStr);
                $('[id="qnode_' + corpn + '"]').find('input').attr('disabled', stateStr);
                $(this).attr('disabled', stateStr);

                $(this).parent().find('input[type="text"]').each(function () {
                    $(this).attr('disabled', stateStr);
                });

            } else {
                queryType = $(this).parent().find('[id="queryselector_' + corpn + '"]').val();
                queryType = queryType.substring(0, queryType.length - 3);
                $('[id="qnode_' + corpn + '"]').find('input[type="text"]').each(function () {
                    if (!$(this).hasClass(queryType + '-input')) {
                        $(this).attr('disabled', stateStr);
                    }
                });
            }
        });
        // now let's disable unused corpora completely
        $('.parallel-corp-lang').each(function () {
            if ($(this).css('display') === 'none') {
                $(this).find('input,select').attr('disabled', stateStr);
            }
        });
    }

    /**
     *
     * @param value
     * @param groupSepar - separator character for thousands groups
     * @param radixSepar - separator character for integer and fractional parts
     */
    formatNum(value:number|string, groupSepar:string, radixSepar:string):string {
        var i,
            offset = 0,
            len,
            numParts,
            s;

        numParts = value.toString().split('.');
        s = numParts[0].split('').reverse();
        len = s.length;
        for (i = 3; i < len; i += 3) {
            s.splice(i + offset, 0, groupSepar);
            offset += 1;
        }
        s = s.reverse().join('');
        if (numParts[1] !== undefined) {
            s += radixSepar + numParts[1];
        }
        return s;
    }

    /**
     * @todo rewrite/refactor
     */
    misc():void {
        var self = this;
        $('select.qselector').each(function () {
            $(this).on('change', function (event) {
                queryInput.cmdSwitchQuery(self, event, self.conf['queryTypesHints']);
            });

            // we have to initialize inputs properly (unless it is the default (as loaded from server) state)
            if ($(this).val() !== 'iqueryrow') {
                queryInput.cmdSwitchQuery(self, $(this).get(0), self.conf['queryTypesHints']);
            }
        });

        // remove empty and unused parameters from URL before mainform submit
        $('form').submit(function () { // run before submit
            self.setAlignedCorporaFieldsDisabledState(true);
            $(win).on('unload', function () {
                self.setAlignedCorporaFieldsDisabledState(false);
            });
        });
    }

    /**
     * Renders a query overview within tooltipBox
     * instance based on provided data
     *
     * @param data
     * @param {TooltipBox} tooltipBox
     */
    renderOverview = function (data, tooltipBox):void {
        var self = this,
            url,
            html = '<h3>' + this.translate('query_overview') + '</h3><table border="1">',
            parentElm = tooltipBox.getRootElement();

        html += '<tr><th>' + self.conf.messages.operation + '</th>';
        html += '<th>' + self.conf.messages.parameters + '</th>';
        html += '<th>' + self.conf.messages.num_of_hits + '</th><th></th></tr>';

        $.each(data.Desc, function (i, item:{op:string; arg:string; size:number; tourl:string}) {
            html += '<tr><td>' + self.escapeHTML(item.op) + '</td>';
            html += '<td>' + self.escapeHTML(item.arg) + '</td>';
            html += '<td>' + self.escapeHTML(item.size) + '</td>';
            html += '<td>';
            if (item.tourl) {
                url = 'view?' + item.tourl;
                html += '<a href="' + url + '">' + self.conf.messages.view_result + '</a>';
            }
            html += '</td>';
            html += '</tr>';
        });
        html += '</table>';
        $(parentElm).html(html);
    }

    /**
     *
     */
    queryOverview() {
        var escKeyEventHandlerFunc,
            self = this;

        escKeyEventHandlerFunc = function (boxInstance) {
            return function (event) {
                if (event.keyCode === 27) {
                    $('#conclines tr.active').removeClass('active');
                    if (boxInstance) {
                        boxInstance.close();
                    }
                    $(document).off('keyup.query_overview');
                }
            };
        };

        // query overview
        $('#query-overview-trigger').on('click', function (event) {
            var reqUrl = $(event.target).data('json-href');

            $.ajax(reqUrl, {
                dataType: 'json',
                success: function (data) {
                    var box,
                        leftPos;

                    if (data.Desc) {
                        box = popupbox.open(
                            function (box2, finalize) {
                                self.renderOverview(data, box2);
                                finalize();
                            },
                            null,
                            {
                                type: 'plain',
                                domId: 'query-overview',
                                htmlClass: 'query-overview',
                                closeIcon: true,
                                calculatePosition: false,
                                timeout: null,
                                messages: self.conf['messages'] // TODO
                            }
                        );
                        leftPos = $(window).width() / 2 - box.getPosition().width / 2;
                        box.setCss('left', leftPos + 'px');

                        $(win.document).on('keyup.query_overview', escKeyEventHandlerFunc(box));

                    } else {
                        self.showMessage('error', self.translate('failed_to_load_query_overview'));
                    }
                },
                error: function () {
                    self.showMessage('error', self.translate('failed_to_load_query_overview'));
                }
            });
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
    }

    /**
     * @param {HTMLElement|String|jQuery} elm
     * @param {String|jQuery} context checkbox context selector (parent element or list of checkboxes)
     */
    applySelectAll = function (elm, context) {
        var self = this,
            jqElm = $(elm),
            jqContext = $(context),
            jqCheckboxes,
            updateButtonStatus;

        if (jqContext.length === 1 && jqContext.get(0).nodeName !== 'INPUT') {
            jqCheckboxes = jqContext.find('input[type="checkbox"]:not(.select-all)');

        } else {
            jqCheckboxes = jqContext;
        }

        updateButtonStatus = function () {
            var numChecked = jqCheckboxes.filter(':checked').length;

            if (jqCheckboxes.length > numChecked) {
                self.toggleSelectAllTrigger(elm, '1');

            } else {
                self.toggleSelectAllTrigger(elm, '2');
            }
        };

        jqCheckboxes.on('click', updateButtonStatus);
        updateButtonStatus();

        jqElm.off('click');
        jqElm.on('click', function (event) {
            var evtTarget = event.target;

            if ($(evtTarget).attr('data-status') === '1') {
                jqCheckboxes.each(function () {
                    this.checked = true;
                });
                self.toggleSelectAllTrigger(evtTarget);

            } else if ($(evtTarget).attr('data-status') === '2') {
                jqCheckboxes.each(function () {
                    this.checked = false;
                });
                self.toggleSelectAllTrigger(evtTarget);
            }
        });
    }

    /**
     * @returns {$.Deferred.Promise}
     */
    bindCorpusDescAction() {
        var self = this,
            jqDescLink = $('#corpus-desc-link');

        popupbox.bind(jqDescLink,
            function (box, finalize) {
                var actionRegId;

                // TODO this combination of popupbox.bind and dispatcher.register,
                // dispatcher.unregister is not very clean in terms of app desing
                actionRegId = self.dispatcher.register(function (payload:Action) {
                    if (payload.actionType === 'ERROR') {
                        box.close();
                        self.dispatcher.unregister(actionRegId);
                    }
                });

                self.renderReactComponent(self.initReactComponent(documentViews.corpusInfoBoxFactory),
                    box.getRootElement());
                finalize();
            },
            {
                width: 'auto',
                closeIcon: true,
                messages: self.conf['messages'],
                type: 'plain'
            }
        );
    }

    /**
     *
     */
    bindStaticElements() {
        var self = this,
            citationHtml = $('#corpus-citation-box').html();

        popupbox.bind($('#positions-help-link'), self.conf['messages']['msg1'],
            {messages: self.conf['messages'], width: '30%'});

        popupbox.bind('#corpus-citation-link a',
            function (box, finalizeCallback) {
                $(box.getRootElement()).html(citationHtml).find('a').attr('target', '_blank');
                $('#corpus-citation-box').empty();
                finalizeCallback();
            },
            {
                type: 'plain',
                domId: 'citation-information',
                closeIcon: true,
                calculatePosition: true,
                timeout: null,
                messages: self.conf['messages']
                ,
                width: '40%',
                onClose: function () {
                    $('#corpus-citation-box').html(citationHtml);
                }
            });

        // 'Select all' buttons for structural attribute lists
        $('table.envelope input[class="select-all"]').each(function () {
            self.applySelectAll(this, $(this).closest('table.envelope'));
        });

        // Click which removes the 'error box'
        $('.message a.close-icon').bind('click', function (event) {
            var nextUrl,
                parentElm;

            parentElm = $(event.target).closest('.message').get(0);
            nextUrl = $(parentElm).data('next-url');

            $(parentElm).hide(200, function () {
                if (nextUrl) {
                    win.location = nextUrl;
                }
            });
        });

        // Footer's language switch
        $('#switch-language-box a').each(function () {
            $(this).bind('click', function () {
                self.userSettings.set('set_uilang', $(this).data('lang'));
                win.location.reload();
            });
        });
    }

    timeoutMessages() {
        var timeout,
            jqMessage = $('.message');

        if (jqMessage.length > 0 && this.conf['messageAutoHideInterval']) {
            timeout = win.setTimeout(function () {
                jqMessage.hide(200);
                win.clearTimeout(timeout);
                if (jqMessage.data('next-url')) {
                    win.location = jqMessage.data('next-url');
                }
            }, this.conf['messageAutoHideInterval']);
        }
    }

    mouseOverImages(context?) {
        context = context || win.document;

        $(context).find('.over-img').each(function () {
            var tmp,
                wrappingLink,
                activeElm,
                img = this;

            wrappingLink = $(img).closest('a');
            if (wrappingLink.length > 0) {
                activeElm = wrappingLink.get(0);

            } else {
                activeElm = img;
            }
            if ($(img).attr('data-alt-img')) {
                $(activeElm).off('mouseover.overimg');
                $(activeElm).on('mouseover.overimg', function () {
                    tmp = $(img).attr('src');
                    $(img).attr('src', $(img).attr('data-alt-img'));
                });
                $(activeElm).off('mouseout.overimg');
                $(activeElm).on('mouseout.overimg', function () {
                    $(img).attr('src', tmp);
                });
            }
        });
    }

    /**
     * @todo this is currently a Czech National Corpus specific solution
     */
    enhanceMessages() {
        $('.message .sign-in').each(function () {
            var text = $(this).text(),
                findSignInUrl;

            findSignInUrl = function () {
                return $('#cnc-toolbar-user a:nth-child(1)').attr('href');
            };

            $(this).replaceWith('<a href="' + findSignInUrl() + '">' + text + '</a>');
        });
    }

    /**
     *
     */
    externalHelpLinks() {
        var self = this;

        $('a.external-help').each(function () {
            var href = $(this).attr('href'),
                message = self.translate('more_information_at')
                    + ' <a href="' + href + '" target="_blank">' + href + '</a>';
            popupbox.bind(this, message, {});
        });
    }

    /**
     *
     */
    reload():void {
        win.document.location.reload();
    }

    /**
     * Creates unbound HTML tree containing message 'loading...'
     *
     * @returns {jQuery}
     */
    createAjaxLoader():JQuery {
        return $('<div class="ajax-loading-msg"><span>' + this.translate('loading') + '</span></div>');
    }

    /**
     *
     * @param msg
     * @returns {*}
     */
    translate(msg:string):string {
        msg = msg || '';
        return this.conf['messages'][msg] ? this.conf['messages'][msg] : msg;
    }

    /**
     * note: must preserve 'this'
     */
    createSmallAjaxLoader:()=>JQuery = () => {
        return $('<img src="../files/img/ajax-loader.gif" '
            + 'alt="' + this.translate('loading') + '" '
            + 'title="' + this.translate('loading') + '" '
            + 'style="width: 24px; height: 24px" />');
    };

    /**
     *
     */
    resetPlugins():void {
        for (var i = 0; i < this.pluginResets.length; i += 1) {
            this.pluginResets[i]();
        }
    }

    createStaticUrl(path) {
        var staticPath = this.conf['staticUrl'];

        if (path.indexOf('/') === 0) {
            path = path.substr(1);
        }
        return staticPath + path;
    }

    createActionUrl(path) {
        var staticPath = this.conf['rootPath'];

        if (path.indexOf('/') === 0) {
            path = path.substr(1);
        }
        return staticPath + path;
    }

    getConf(item:string):any {
        return this.conf[item];
    }

    pluginApi():PluginApi {
        return new PluginApi(this.conf, this);
    }


    private registerCoreEvents():void {
        var self = this;

        this.dispatcher.register(function (payload:Action) {
            if (payload.message && payload.message.hasOwnProperty('msgType')) {
                self.showMessage(payload.message.msgType, payload.message.message);
            }
        });
    }

    /**
     *
     */
    init():InitActions {
        var self = this;
        this.userSettings.init();

        this.initActions.add({
            misc: self.misc(),
            bindQueryHelpers: queryInput.bindQueryHelpers(self.pluginApi()),
            bindStaticElements: self.bindStaticElements(),
            bindCorpusDescAction: self.bindCorpusDescAction(),
            queryOverview: self.queryOverview(),
            mainMenuInit: self.mainMenu.init(),
            timeoutMessages: self.timeoutMessages(),
            mouseOverImages: self.mouseOverImages(),
            enhanceMessages: self.enhanceMessages(),
            externalHelpLinks: self.externalHelpLinks()
        });

        // init plug-ins
        this.registerPlugin('applicationBar', applicationBar.createInstance(self.pluginApi()));

        $.each(this.initCallbacks, function (i, fn:()=>void) {
            fn();
        });

        this.registerCoreEvents();

        return this.initActions;
    }
}


/**
 * KonText main menu
 */
export class MainMenu {

    /**
     * Wrapping element for whole main-menu
     */
    jqMenuBar:JQuery;

    /**
     * Wrapper where sub-menu is rendered
     */
    jqMenuLevel2:JQuery;

    constructor() {
        this.jqMenuBar = $('#menu-bar');
        this.jqMenuLevel2 = $('#menu-level-2');
    }

    /**
     *
     * @returns {*}
     */
    getActiveSubmenuId() {
        return this.jqMenuLevel2.attr('data-current-menu');
    }

    /**
     *
     * @param {string} id
     */
    setActiveSubmenuId(id) {
        this.jqMenuLevel2.attr('data-current-menu', id);
    }

    /**
     * @param {string} [menuId]
     */
    closeSubmenu(menuId?) {
        var jqPrevMenuUl = this.jqMenuLevel2.find('ul');

        if (!menuId) {
            menuId = this.getActiveSubmenuId();
        }

        if (menuId) {
            $('#' + menuId).removeClass('active').append(jqPrevMenuUl);
            jqPrevMenuUl.css('display', 'none');
            this.setActiveSubmenuId(null);
        }
    }

    /**
     *
     * @param li
     * @returns {*}
     */
    getHiddenSubmenu(li):JQuery {
        return $(li).find('ul');
    }

    /**
     *
     * @param activeLi - active main menu item LI
     */
    openSubmenu(activeLi:HTMLElement|JQuery) {
        var menuLeftPos,
            jqSubMenuUl,
            jqActiveLi = $(activeLi);

        jqSubMenuUl = this.getHiddenSubmenu(jqActiveLi);
        if (jqSubMenuUl.length > 0) {
            jqActiveLi.addClass('active');
            jqSubMenuUl.css('display', 'block');
            this.jqMenuLevel2.addClass('active').empty().append(jqSubMenuUl);
            menuLeftPos = jqActiveLi.offset().left + jqActiveLi.width() / 2 - jqSubMenuUl.width() / 2;
            if (menuLeftPos < this.jqMenuBar.offset().left) {
                menuLeftPos = this.jqMenuBar.offset().left;

            } else if (menuLeftPos + jqSubMenuUl.width() > this.jqMenuBar.offset().left + this.jqMenuBar.width()) {
                menuLeftPos = this.jqMenuBar.offset().left + this.jqMenuBar.width() - jqSubMenuUl.width();
            }
            jqSubMenuUl.css('left', menuLeftPos);

        } else {
            this.jqMenuLevel2.removeClass('active');
        }
    }

    /**
     * Initializes main menu logic
     */
    init():void {
        var self = this;

        $('#menu-level-1 li.disabled a').each(function () {
            $(this).attr('href', '#');
        });

        $('#menu-level-1 a.trigger').each(function () {
            $(this).on('mouseover', function (event) {
                var jqMenuLi = $(event.target).closest('li'),
                    prevMenuId,
                    newMenuId = jqMenuLi.attr('id');

                prevMenuId = self.getActiveSubmenuId();
                if (prevMenuId !== newMenuId) {
                    self.closeSubmenu(prevMenuId);

                    if (!jqMenuLi.hasClass('disabled')) {
                        self.setActiveSubmenuId(jqMenuLi.attr('id'));
                        self.openSubmenu(jqMenuLi);
                    }
                }
            });
        });

        self.jqMenuBar.on('mouseleave', function (event) {
            self.closeSubmenu(self.getActiveSubmenuId());
        });

        $(win).on('resize', function () {
            self.closeSubmenu();
        });

        popupbox.abbr();
    }

}


export class PluginApi implements Kontext.PluginApi {

    _conf:any; // TODO type

    pageModel:PageModel;

    constructor(conf:any, pageModel:PageModel) {
        this._conf = conf;
        this.pageModel = pageModel;
    }

    getConf(key) {
        if (this._conf.hasOwnProperty(key)) {
            return this._conf[key];

        } else {
            throw new Error('Unknown configuration key requested: ' + key);
        }
    }

    createStaticUrl(path) {
        return this.pageModel.createStaticUrl(path);
    }

    createActionUrl(path) {
        return this.pageModel.createActionUrl(path);
    }

    ajax() {
        return this.pageModel.ajax.apply(self, arguments);
    }

    ajaxAnim() {
        return this.pageModel.createAjaxLoader.apply(self, arguments);
    }

    ajaxAnimSmall() {
        return this.pageModel.createSmallAjaxLoader.apply(self, arguments);
    }

    appendLoader() {
        return this.pageModel.appendLoader.apply(self, arguments);
    }

    showMessage() {
        return this.pageModel.showMessage.apply(self, arguments);
    }

    translate(msg) {
        return this.pageModel.translate(msg);
    }

    applySelectAll(elm, context) {
        this.pageModel.applySelectAll(elm, context);
    }

    registerReset(fn) {
        this.pageModel.pluginResets.push(fn);
    }

    resetToHomepage(params) {
        var p,
            ans = [];

        for (p in params) {
            if (params.hasOwnProperty(p)) {
                ans.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
            }
        }
        win.location = this.pageModel.createActionUrl('first_form?' + ans.join('&'));
    }

    userIsAnonymous() {
        return this.getConf('anonymousUser');
    }

    contextHelp(triggerElm, text) {
        return this.pageModel.contextHelp(triggerElm, text);
    }

    formChangeCorpus(event) {
        return this.pageModel.formChangeCorpus(event);
    }

    shortenText(s, length) {
        return this.pageModel.shortenText(s, length);
    }

    dispatcher() {
        return this.pageModel.dispatcher;
    }
}

/**
 * This object stores all the initialization actions performed on page when
 * it loads. These actions may be asynchronous in general which is why a Promise
 * objects are required here. If an action si synchronous then it may return null/undefined
 * @todo this should be either finished (and respected by action pages) or rewritten in some way
 */
export class InitActions {

    prom:{[k:string]:any};

    constructor() {
        this.prom = {};
    }

    /**
     * Adds one (.add(key, promise)) or multiple (.add({...})) promises to the collection.
     * Returns self.
     */
    add<T>(arg0:string, arg1:RSVP.Promise<T>):InitActions;
    add(arg0:{[name:string]:any}, arg1?):InitActions;
    add(arg0, arg1):InitActions {
        var prop;

        if (typeof arg0 === 'object' && arg1 === undefined) {
            for (prop in arg0) {
                if (arg0.hasOwnProperty(prop)) {
                    this.add(prop, arg0[prop]);
                }
            }

        } else if (typeof arg0 === 'string' && arg1 !== undefined) {
            this.prom[arg0] = arg1;
        }
        return this;
    }

    /**
     * Tests whether there is a promise with the 'key'
     *
     */
    contains(key):boolean {
        return this.prom.hasOwnProperty(key);
    }

    /**
     * Gets a promise of the specified name. In case
     * no such init action exists, error is thrown.
     */
    get<T>(key):RSVP.Promise<T> {
        if (this.contains(key)) {
            return this.prom[key];

        } else {
            throw new Error('No such init action: ' + key);
        }
    }

    /**
     * Binds a function to be run after a promise
     * identified by 'actionId' is fulfilled. In case
     * there is no promise under the 'actionId' key (please
     * note that the key must be still present) then
     * ad-hoc one is created and immediately resolved.
     *
     * type T specifies a value returned by actionId action
     * type U specifies a value function fn is producing
     *
     * @param actionId - an identifier of an action (= any function initializing
     * a part of a page and registered via the add() method)
     * @param fn - a function to be run after the action 'actionId' is finished
     */
    doAfter<T, U>(actionId:string, fn:(prev?:T)=>U):RSVP.Promise<U> {
        var prom1:RSVP.Promise<T>;

        prom1 = this.get(actionId);

        if (!prom1) {
            return new RSVP.Promise(function (fulfill, reject) {
                try {
                    fulfill(fn());

                } catch (err) {
                    reject(err);
                }
            });

        } else {
            return prom1.then(
                function (v:T) {
                    var prom2:RSVP.Promise<U> = new RSVP.Promise(function (resolve, reject) {
                        try {
                            resolve(fn(v));

                        } catch (err) {
                            reject(err);
                        }
                    });
                    return prom2;
                }
                // TODO on reject?
            );
        }
    }
}

/**
 * Local user settings
 */
export class UserSettings {


    storage:Storage;

    storageKey:string;

    timestampKey:string;

    uiStateTTL:number;

    data:{[k:string]:any};

    constructor(storage:Storage, storageKey:string, timestampKey:string, uiStateTTL:number) {
        this.storage = storage;
        this.storageKey = storageKey;
        this.timestampKey = timestampKey;
        this.uiStateTTL = uiStateTTL;
        this.data = {};
    }


    getTimstamp():number {
        return new Date().getTime() / 1000;
    }

    dataIsRecent(data) {
        return !data[this.timestampKey] || data[this.timestampKey]
            && ( (new Date().getTime() / 1000 - data[this.timestampKey]) < this.uiStateTTL);
    }

    dumpToStorage() {
        this.data[this.timestampKey] = this.getTimstamp();
        this.storage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
        this.dumpToStorage();
    }

    init() {
        var tmp;
        if (this.storage.getItem(this.storageKey)) {
            tmp = JSON.parse(this.storage.getItem(this.storageKey));
            if (this.dataIsRecent(tmp)) {
                this.data = tmp;
            }

        } else {
            this.data[this.timestampKey] = this.getTimstamp();
        }
    }
}