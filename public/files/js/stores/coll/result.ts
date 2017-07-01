/*
 * Copyright (c) 2017 Charles University in Prague, Faculty of Arts,
 *                    Institute of the Czech National Corpus
 * Copyright (c) 2017 Tomas Machalek <tomas.machalek@gmail.com>
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

/// <reference path="../../types/common.d.ts" />
/// <reference path="../../../ts/declarations/immutable.d.ts" />
/// <reference path="../../../ts/declarations/rsvp.d.ts" />

import * as Immutable from 'vendor/immutable';
import {SimplePageStore, validateGzNumber} from '../../stores/base';
import {PageModel} from '../../tpl/document';
import {CollFormStore} from '../../stores/coll/collForm';
import * as RSVP from 'vendor/rsvp';
import {MultiDict} from '../../util';


export interface CollResultRow {
    pfilter:Array<[string, string]>;
    nfilter:Array<[string, string]>;
    freq:number;
    Stats:Array<{s:string}>;
    str:string;
}

export type CollResultData = Array<CollResultRow>;

export type CollResultHeading = Array<{s:string;n:string;}>;

export interface AjaxResponse extends Kontext.AjaxResponse {
    Head:CollResultHeading;
    Items:CollResultData;
    lastpage:number;
}


export class CollResultsSaveStore extends SimplePageStore {

    private layoutModel:PageModel;

    private mainStore:CollResultStore;

    private formIsActive:boolean;

    private saveformat:string;

    private colheaders:string;

    private heading:string;

    private fromLine:string;

    private toLine:string;

    private saveLinkFn:(string)=>void;

    private static QUICK_SAVE_LINE_LIMIT = 10000;

    constructor(dispatcher:Kontext.FluxDispatcher, layoutModel:PageModel,
            mainStore:CollResultStore, saveLinkFn:(string)=>void) {
        super(dispatcher);
        this.layoutModel = layoutModel;
        this.mainStore = mainStore;
        this.formIsActive = false;
        this.saveformat = 'csv';
        this.fromLine = '1';
        this.toLine = '';
        this.saveLinkFn = saveLinkFn;

        dispatcher.register((payload:Kontext.DispatcherPayload) => {
            switch (payload.actionType) {
                case 'MAIN_MENU_SHOW_SAVE_FORM':
                    this.formIsActive = true;
                    this.toLine = '';
                    this.notifyChangeListeners();
                break;
                case 'MAIN_MENU_DIRECT_SAVE':
                    this.saveformat = payload.props['saveformat'];
                    this.toLine = String(CollResultsSaveStore.QUICK_SAVE_LINE_LIMIT);
                    this.submit();
                    this.toLine = '';
                    this.notifyChangeListeners();
                break;
                case 'COLL_RESULT_CLOSE_SAVE_FORM':
                    this.formIsActive = false;
                    this.notifyChangeListeners();
                break;
                case 'COLL_SAVE_FORM_SET_FORMAT':
                    this.saveformat = payload.props['value'];
                    this.notifyChangeListeners();
                break;
                case 'COLL_SAVE_FORM_SET_FROM_LINE':
                    this.fromLine = payload.props['value'];
                    this.notifyChangeListeners();
                break;
                case 'COLL_SAVE_FORM_SET_TO_LINE':
                    this.toLine = payload.props['value'];
                    this.notifyChangeListeners();
                break;
                case 'COLL_SAVE_FORM_SUBMIT':
                    this.submit();
                    this.notifyChangeListeners();
                break;
            }
        });
    }

    private submit():void {
        const args = this.layoutModel.getConcArgs();
        args.set('saveformat', this.saveformat);
        args.set('colheaders', this.colheaders);
        args.set('heading', this.heading);
        args.set('from_line', this.fromLine);
        args.set('to_line', this.toLine);
        this.saveLinkFn(this.layoutModel.createActionUrl('savecoll', args.items()));
    }

    getFormIsActive():boolean {
        return this.formIsActive;
    }

    // we override here the behavior to expose only the main store
    notifyChangeListeners():void {
        this.mainStore.notifyChangeListeners();
        super.notifyChangeListeners();
    }

    getSaveformat():string {
        return this.saveformat;
    }

    getColheaders():string {
        return this.colheaders;
    }

    getHeading():string {
        return this.heading;
    }

    getFromLine():string {
        return this.fromLine;
    }

    getToLine():string {
        return this.toLine;
    }
}

type WatchdogUpdateCallback = (status:number, err:Error)=>void;

/**
 *
 */
class CalcWatchdog {

    private layoutModel:PageModel;

    private resultStore:CollResultStore;

    private numNoChange:number;

    private lastStatus:number;

    private checkIntervalId:number;

    private onUpdate:WatchdogUpdateCallback;

    /**
     * Specifies after how many checks should client
     * give-up on watching the status.
     */
    static MAX_NUM_NO_CHANGE = 240;

    static CHECK_INTERVAL_SEC = 2;

    constructor(layoutModel:PageModel, resultStore:CollResultStore, onUpdate:WatchdogUpdateCallback) {
        this.layoutModel = layoutModel;
        this.resultStore = resultStore;
        this.onUpdate = onUpdate;
    }

    private checkStatus():void {
        const args = new MultiDict([
            ['corpname', this.layoutModel.getConf<string>('corpname')],
            ['usesubcorp', this.layoutModel.getConf<string>('subcorpname')],
            ['attrname', this.layoutModel.getConf<string>('attrname')]
        ]);
        this.layoutModel.getConf<Array<string>>('workerTasks').forEach(taskId => {
            args.add('worker_tasks', taskId);
        });
        this.layoutModel.ajax(
            'GET',
            this.layoutModel.createActionUrl('wordlist_process'),
            args

        ).then(
            (data:Kontext.AjaxResponse) => {
                if (data['status'] === 100) {
                        this.stopWatching(); // just for sure

                } else if (this.numNoChange >= CalcWatchdog.MAX_NUM_NO_CHANGE) {
                    this.onUpdate(null, new Error(this.layoutModel.translate('global__bg_calculation_failed')));

                } else if (data['status'] === this.lastStatus) {
                    this.numNoChange += 1;
                }
                this.lastStatus = data['status'];
                this.onUpdate(this.lastStatus, null);
            },
            (err) => {
                this.onUpdate(null, new Error(this.layoutModel.translate('global__bg_calculation_failed')));
            }
        );
    }

    startWatching():void {
        this.numNoChange = 0;
        this.checkIntervalId = setInterval(this.checkStatus.bind(this),
                CalcWatchdog.CHECK_INTERVAL_SEC * 1000);
    }

    stopWatching():void {
        clearTimeout(this.checkIntervalId);
    }
}


/**
 *
 */
export class CollResultStore extends SimplePageStore {

    private layoutModel:PageModel;

    private data:Immutable.List<CollResultRow>;

    private heading:Immutable.List<{s:string;n:string}>;

    private currPage:number;

    private formStore:CollFormStore;

    private currPageInput:string; // this is transformed into a real page change once user hits enter/button

    private isWaiting:boolean;

    private pageSize:number;

    private hasNextPage:boolean;

    private sortFn:string;

    private saveStore:CollResultsSaveStore;

    private saveLinesLimit:number;

    private calcStatus:number; // in per-cent (i.e. 0...100)

    private calcWatchdog:CalcWatchdog;

    constructor(dispatcher:Kontext.FluxDispatcher, layoutModel:PageModel,
            formStore:CollFormStore, initialData:CollResultData, resultHeading:CollResultHeading,
            pageSize:number, saveLinkFn:((string)=>void), saveLinesLimit:number,
            unfinished:boolean) {
        super(dispatcher);
        this.layoutModel = layoutModel;
        this.formStore = formStore;
        this.data = Immutable.List<CollResultRow>(initialData);
        this.heading = Immutable.List<{s:string;n:string}>(resultHeading).slice(1).toList();
        this.currPageInput = '1';
        this.currPage = 1;
        this.isWaiting = false;
        this.pageSize = pageSize;
        this.hasNextPage = true; // we do not know in advance in case of collocations
        this.sortFn = resultHeading.length > 0 ? resultHeading[0].s : 'f';
        this.saveStore = new CollResultsSaveStore(dispatcher, layoutModel, this, saveLinkFn);
        this.saveLinesLimit = saveLinesLimit;
        this.calcStatus = unfinished ? 0 : 100;
        this.calcWatchdog = new CalcWatchdog(layoutModel, this, (status, err) => {
            if (err === null) {
                this.calcStatus = status;
                if (this.calcStatus >= 100) {
                    this.calcWatchdog.stopWatching();
                    this.processDataReload();
                }

            } else {
                this.layoutModel.showMessage('error', err);
                this.calcWatchdog.stopWatching();
            }
            this.notifyChangeListeners();
        });
        if (this.calcStatus < 100) {
            this.calcWatchdog.startWatching();
        }

        dispatcher.register((payload:Kontext.DispatcherPayload) => {
            switch (payload.actionType) {
                case 'COLL_RESULT_SET_PAGE_INPUT_VAL':
                    this.currPageInput = payload.props['value'];
                    this.notifyChangeListeners();
                break;
                case 'COLL_RESULT_GET_NEXT_PAGE':
                    this.isWaiting = true;
                    this.notifyChangeListeners();
                    this.currPage += 1;
                    this.currPageInput = String(this.currPage);
                    this.processDataReload();
                break;
                case 'COLL_RESULT_GET_PREV_PAGE':
                    this.isWaiting = true;
                    this.notifyChangeListeners();
                    this.currPage -= 1;
                    this.currPageInput = String(this.currPage);
                    this.processDataReload();
                break;
                case 'COLL_RESULT_CONFIRM_PAGE_VALUE':
                    this.isWaiting = true;
                    this.notifyChangeListeners();
                    this.currPage = parseInt(this.currPageInput, 10);
                    if (validateGzNumber(this.currPageInput)) {
                        this.processDataReload();

                    } else {
                        this.layoutModel.showMessage('error', this.layoutModel.translate('concview__invalid_page_num_err'));
                    }
                break;
                case 'COLL_RESULT_SORT_BY_COLUMN':
                    this.isWaiting = true;
                    this.notifyChangeListeners();
                    this.sortFn = payload.props['sortFn'];
                    this.processDataReload();
                break;
            }
        });
    }

    private processDataReload():void {
        this.loadData().then(
            (_) => {
                this.isWaiting = false;
                this.notifyChangeListeners();
            },
            (err) => {
                this.isWaiting = false;
                this.layoutModel.showMessage('error', err);
                this.notifyChangeListeners();
            }
        );
    }

    private loadData():RSVP.Promise<boolean> {
        const args = this.formStore.getSubmitArgs();
        args.set('format', 'json');
        args.set('collpage', this.currPage);
        args.set('csortfn', this.sortFn);
        return this.layoutModel.ajax<AjaxResponse>(
            'GET',
            this.layoutModel.createActionUrl('collx'),
            args

        ).then(
            (data) => {
                if (data.Items.length === 0) {
                    this.hasNextPage = false;
                    this.currPage -= 1;
                    this.currPageInput = String(this.currPage);
                    this.layoutModel.showMessage('info', this.layoutModel.translate('global__no_more_pages'));

                } else if (data.Items.length < this.pageSize) {
                    this.hasNextPage = false;
                    this.data = Immutable.List<CollResultRow>(data.Items);

                } else {
                    this.heading = Immutable.List<{s:string;n:string}>(data.Head).slice(1).toList();
                    this.sortFn = this.heading.get(0).s;
                    this.data = Immutable.List<CollResultRow>(data.Items);
                }
                return true;
            }
        );
    }

    getData():Immutable.List<CollResultRow> {
        return this.data;
    }

    getHeading():Immutable.List<{s:string;n:string}> {
        return this.heading;
    }

    getCurrPageInput():string {
        return this.currPageInput;
    }

    getCurrPage():number {
        return this.currPage;
    }

    getHasNextPage():boolean {
        return this.hasNextPage;
    }

    getIsWaiting():boolean {
        return this.isWaiting;
    }

    getLineOffset():number {
        return (this.currPage - 1) * this.pageSize;
    }

    getSortFn():string {
        return this.sortFn;
    }

    getCattr():string {
        return this.formStore.getCattr();
    }

    getSaveStore():CollResultsSaveStore {
        return this.saveStore;
    }

    getSaveLinesLimit():number {
        return this.saveLinesLimit;
    }

    getCalcStatus():number {
        return this.calcStatus;
    }
}