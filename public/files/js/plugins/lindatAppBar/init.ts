/*
 * Copyright (c) 2016 Institute of the Czech National Corpus
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
/// <reference path="../../types/plugins.d.ts" />
/// <reference path="../../vendor.d.ts/rsvp.d.ts" />

import * as RSVP from 'vendor/rsvp';
import * as aai from './aai-config';

export class LindatAppBar implements PluginInterfaces.IToolbar {
}

export default function create(pluginApi:Kontext.PluginApi):RSVP.Promise<PluginInterfaces.IToolbar> {
    return new RSVP.Promise((resolve:(ans:PluginInterfaces.IToolbar)=>void, reject:(e:any)=>void) => {
        aai.init();
        resolve(new LindatAppBar());
    });
}



