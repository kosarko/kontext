/*
 * Copyright (c) 2015 Institute of the Czech National Corpus
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

import React from 'vendor/react';


export function init(dispatcher, mixins, layoutViews, CorpusInfoBox, formStore, listStore) {

    const util = mixins[0];

    // ---------------------------------------------------------------------
    // -------------------------- dataset components -----------------------
    // ---------------------------------------------------------------------

    // -------------------------------- <CorplistHeader /> -----------------


    const CorplistHeader = (props) => {

        return (
            <tr>
                <th>{util.translate('defaultCorparch__corpus_name')}</th>
                <th>{util.translate('defaultCorparch__size_in_positions')}</th>
                <th>{util.translate('defaultCorparch__corpus_labels')}</th>
                <th></th>
                <th></th>
            </tr>
        );
    };

    // -------------------------------- <FavStar /> -----------------

    const FavStar = (props) => {

        const handleClick = () => {
            dispatcher.dispatch({
                actionType: 'LIST_STAR_CLICKED',
                props: {
                    corpusId: props.corpusId,
                    corpusName: props.corpusName,
                    isFav: !props.isFav,
                    type: 'corpus'
                }
            });
        };
        const imgUrl = props.isFav ?
            util.createStaticUrl('img/starred.svg') :
            util.createStaticUrl('img/starred_grey.svg');
        return <img className="starred" src={imgUrl} onClick={handleClick} />;
    };

    // -------------------------------- <CorplistRow /> -----------------

    /**
     * A single dataset row
     */
    const CorplistRow = (props) => {

        const renderFavStar = () => {
            if (props.enableUserActions) {
                return <FavStar corpusId={props.row.id}
                                    corpusName={props.row.name}
                                    isFav={props.row.user_item} />;

            } else {
                return null;
            }
        };

        const handleDetailClick = (corpusId, evt) => {
            props.detailClickHandler(corpusId);
        };

        const keywords = props.row.keywords.map((k, i) => {
            return <CorpKeywordLink key={i} keyword={k[0]} label={k[1]} />;
        });
        const link = util.createActionLink('first_form', [['corpname', props.row.id]]);
        const size = props.row.size_info ? props.row.size_info : '-';

        return (
            <tr>
                <td className="corpname">
                    <a href={link}>
                        {props.row.name}
                    </a>
                </td>
                <td className="num">
                    {size}
                </td>
                <td>
                    {keywords}
                </td>
                <td>
                    {renderFavStar()}
                </td>
                <td>
                    <p className="desc" style={{display: 'none'}}></p>
                    <a className="detail" onClick={handleDetailClick.bind(null, props.row.id)}>
                        {util.translate('defaultCorparch__corpus_details')}
                    </a>
                </td>
            </tr>
        );
    };

    // -------------------------------- <ListExpansion /> -----------------

    /**
     * Provides a link allowing to load more items with current
     * query and filter settings.
     */
    const ListExpansion = (props) => {

        const linkClickHandler = () => {
            dispatcher.dispatch({
                actionType: 'EXPANSION_CLICKED',
                props: {
                    offset: props.offset
                }
            });
        };
        return (
            <tr className="load-more">
                <td colSpan="5">
                    <a onClick={linkClickHandler}>{util.translate('global__load_more')}</a>
                </td>
            </tr>
        );
    };

    // -------------------------------- <CorplistTable /> -----------------

    const CorplistTable = React.createClass({

        changeHandler: function () {
            const data = listStore.getData();
            const detail = listStore.getDetail();
            this.setState({
                rows: data.rows,
                nextOffset: data.nextOffset,
                detailVisible: !!detail,
                detail: detail
            });
        },

        getInitialState: function () {
            return {
                rows: this.props.rows,
                nextOffset: this.props.nextOffset,
                detailVisible: false,
                detail: null
            };
        },

        componentDidMount: function () {
            listStore.addChangeListener(this.changeHandler);
        },

        componentWillUnmount: function () {
            listStore.removeChangeListener(this.changeHandler);
        },

        _detailClickHandler: function (corpusId) {
            this.setState(React.addons.update(this.state, {detailVisible: {$set: true}}));
            dispatcher.dispatch({
                actionType: 'CORPARCH_CORPUS_INFO_REQUIRED',
                props: {
                    corpusId: corpusId
                }
            });
        },

        _detailCloseHandler: function () {
            this.setState(React.addons.update(this.state, {detailVisible: {$set: false}}));
            dispatcher.dispatch({
                actionType: 'CORPARCH_CORPUS_INFO_CLOSED',
                props: {}
            });
        },

        _renderDetailBox: function () {
            if (this.state.detailVisible) {
                return (
                    <layoutViews.PopupBox
                        onCloseClick={this._detailCloseHandler}
                        customStyle={{position: 'absolute', left: '80pt', marginTop: '5pt'}}>
                        <CorpusInfoBox data={this.state.detail} />
                    </layoutViews.PopupBox>
                );

            } else {
                return null;
            }
        },

        render: function () {
            let rows = this.state.rows.map((row, i) => {
                return <CorplistRow key={row.id} row={row}
                                    enableUserActions={!this.props.anonymousUser}
                                    detailClickHandler={this._detailClickHandler} />;
            });
            let expansion = null;
            if (this.state.nextOffset) {
                expansion = <ListExpansion offset={this.state.nextOffset} />;
            }

            return (
                <div>
                    {this._renderDetailBox()}
                    <table className="data corplist">
                        <tbody>
                            <CorplistHeader />
                            {rows}
                            {expansion}
                        </tbody>
                    </table>
                </div>
            );
        }
    });

    // -------------------------------- <CorpKeywordLink /> -----------------

    /**
     * a single keyword link shown within a dataset table row
     */
    const CorpKeywordLink = (props) => {

        const handleClick = (e) => {
            e.preventDefault();
            dispatcher.dispatch({
                actionType: 'KEYWORD_CLICKED',
                props: {
                    keyword: props.keyword,
                    status: true,
                    ctrlKey: e.ctrlKey || e.metaKey
                }
            });
        };

        return (
            <a className="keyword" onClick={handleClick}>
                <span className="overlay">{props.label}</span>
            </a>
        );
    };

    // ------------------------------------------------------------------
    // -------------------------- form components -----------------------
    // ------------------------------------------------------------------

    // -------------------------------- <KeywordLink /> -----------------

    /**
     * A keyword link from the filter form
     */
    const KeywordLink = React.createClass({

        mixins: mixins,

        _changeHandler: function (store, action) {
            this.setState({active: formStore.getKeywordState(this.props.keyword)});
        },

        getInitialState: function () {
            return {active: Boolean(this.props.isActive)};
        },

        componentDidMount: function () {
            formStore.addChangeListener(this._changeHandler);
        },

        componentWillUnmount: function () {
            formStore.removeChangeListener(this._changeHandler);
        },

        _handleClick: function (active) {
            return (e) => {
                e.preventDefault();
                this.props.initWaitingFn();
                dispatcher.dispatch({
                    actionType: 'KEYWORD_CLICKED',
                    props: {
                        keyword: this.props.keyword,
                        status: active,
                        ctrlKey: e.ctrlKey || e.metaKey
                    }
                });
            };
        },

        render: function () {
            let link;
            let style = this.props.overlayColor ? {backgroundColor: this.props.overlayColor} : null;


            if (!this.state.active) {
                link = this.createActionLink("corplist?keyword="+this.props.keyword);
                return (
                    <a className="keyword" href={link}
                            data-keyword-id={this.props.keyword}
                            onClick={this._handleClick(true)}>
                        <span className="overlay" style={style} >{this.props.label}</span>
                    </a>
                );

            } else {
                return (
                    <span className="keyword current"
                                data-keyword-id={this.props.keyword}
                                onClick={this._handleClick(false)}>
                        <span className="overlay" style={style}>{this.props.label}</span>
                    </span>
                );
            }
        }
    });

    // -------------------------------- <ResetLink /> -----------------

    /**
     * A keyword-like link to reset currently set keywords
     */
    const ResetLink = (props) => {

        const handleClick = (e) => {
            e.preventDefault();
            props.initWaitingFn();
            dispatcher.dispatch({
                actionType: 'KEYWORD_RESET_CLICKED',
                props: {}
            });
        };

        return (
            <a className="keyword reset" onClick={handleClick}>
                <span className="overlay">
                    {util.translate('defaultCorparch__no_keyword')}
                </span>
            </a>
        );
    };

    // -------------------------------- <KeywordsField /> -----------------

    /**
     * A form fieldset containing all the available keywords
     */
    const KeywordsField = (props) => {

        const links = props.keywords.map((keyword, i) => {
            return <KeywordLink key={i} keyword={keyword[0]} label={keyword[1]}
                                isActive={keyword[2]} overlayColor={keyword[3]}
                                initWaitingFn={props.initWaitingFn} />;
        });

        return (
            <fieldset className="keywords">
                <legend>{props.label}</legend>
                <ResetLink initWaitingFn={props.initWaitingFn} />
                {links}
                <div className="inline-label hint">
                    ({util.translate('defaultCorparch__hold_ctrl_for_multiple')})
                </div>
            </fieldset>
        );
    };

    // -------------------------------- <MinSizeInput /> -----------------

    /**
     * An input to specify minimum corpus size
     */
    const MinSizeInput = (props) => {

        const changeHandler = (e) => {
            props.initWaitingFn();
            dispatcher.dispatch({
                actionType: 'FILTER_CHANGED',
                props: {minSize: e.target.value}
            });
        };

        return <input className="min-max" type="text"
                    defaultValue={props.minSize}
                    onChange={changeHandler} />;
    };

    // -------------------------------- <MaxSizeInput /> -----------------

    /**
     * An input to specify maximum corpus size
     */
    const MaxSizeInput = (props) => {

        const changeHandler = (e) => {
            props.initWaitingFn();
            dispatcher.dispatch({
                actionType: 'FILTER_CHANGED',
                props: {maxSize: e.target.value}
            });
        };

        return <input className="min-max" type="text"
                        defaultValue={props.maxSize}
                        onChange={changeHandler} />;
    };

    // -------------------------------- <NameSearchInput /> -----------------

    class NameSearchInput extends React.Component {

        constructor(props) {
            super(props);
            this._timer = null;
            this._changeHandler = this._changeHandler.bind(this);
        }

        _changeHandler(e) {
            if (this._timer) {
                clearTimeout(this._timer);
            }
            this._timer = setTimeout(((value) => () => {
                this.props.initWaitingFn();
                dispatcher.dispatch({
                    actionType: 'FILTER_CHANGED',
                    props: {corpusName: value}
                });
                clearTimeout(this._timer);
            })(e.target.value), 300);
        }

        render() {
            return <input type="text" defaultValue={this.props.initialValue} onChange={this._changeHandler} />;
        }
    }

    // -------------------------------- <FilterInputFieldset /> -----------------

    /**
     * A fieldset containing non-keyword filter inputs.
     */
    const FilterInputFieldset = React.createClass({
        mixins: mixins,

        getInitialState : function () {
            return {expanded: this.props.filters.name[0] ? true : false};
        },

        _handleLegendClick : function () {
            this.setState(React.addons.update(this.state, {expanded: {$set: !this.state.expanded}}));
        },

        render: function () {
            let fields;
            let fieldsetClasses;

            if (this.state.expanded) {
                fieldsetClasses = 'advanced-filter';
                fields = (
                    <div>
                        <span>{this.translate('defaultCorparch__size_from')}: </span>
                        <MinSizeInput minSize={this.props.filters.minSize[0]} initWaitingFn={this.props.initWaitingFn} />
                        <span className="inline-label">{this.translate('defaultCorparch__size_to')}: </span>
                        <MaxSizeInput maxSize={this.props.filters.maxSize[0]} initWaitingFn={this.props.initWaitingFn} />
                        <div className="hint">
                            {'(' + this.translate('defaultCorparch__you_can_use_suffixes_size') + ')'}
                        </div>
                        <p>
                            <span>
                            {this.translate('defaultCorparch__corpus_name_input_label')}: </span>
                            <NameSearchInput initialValue={this.props.filters.name[0]} initWaitingFn={this.props.initWaitingFn} />
                        </p>
                    </div>
                );

            } else {
                fieldsetClasses = 'advanced-filter closed';
                fields = null;
            }

            return (
                <fieldset className={fieldsetClasses}>
                    <legend onClick={this._handleLegendClick}>{this.translate('defaultCorparch__advanced_filters')}</legend>
                    {fields}
                </fieldset>
            );
        }
    });

    // -------------------------------- <FilterForm /> -----------------

    /**
     * Filter form root component
     */
    const FilterForm = React.createClass({

        mixins: mixins,

        _storeChangeHandler : function () {
            this.setState({isWaiting: false});
        },

        componentDidMount : function () {
            listStore.addChangeListener(this._storeChangeHandler);
        },

        componentWillUnmount : function () {
            listStore.removeChangeListener(this._storeChangeHandler);
        },

        getInitialState : function () {
            return {isWaiting: false};
        },

        _initWaiting : function () {
            this.setState({isWaiting: true});
        },

        _renderLoader : function () {
            if (this.state.isWaiting) {
                return <img className="ajax-loader" src={this.createStaticUrl('img/ajax-loader-bar.gif')}
                                alt={this.translate('global__loading')} title={this.translate('global__loading')} />;

            } else {
                return null;
            }
        },

        render: function () {
            return (
                <section className="inner">
                    <div style={{height: '1em'}}>
                        {this._renderLoader()}
                    </div>
                    <KeywordsField
                        keywords={this.props.keywords}
                        label={this.translate('defaultCorparch__keywords_field_label')}
                        initWaitingFn={this._initWaiting} />
                    <FilterInputFieldset
                        filters={this.props.filters}
                        initWaitingFn={this._initWaiting} />
                </section>
            )
        }
    });

    return {
        CorplistTable: CorplistTable,
        CorplistHeader: CorplistHeader,
        FilterForm: FilterForm,
        FavStar: FavStar,
        CorpKeywordLink: CorpKeywordLink
    };
}