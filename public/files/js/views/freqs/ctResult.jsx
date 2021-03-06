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

/// <reference path="../../vendor.d.ts/react.d.ts" />

import React from 'vendor/react';
import {calcTextColorFromBg, importColor, color2str} from '../../util';


export function init(dispatcher, mixins, layoutViews, ctFreqDataRowsStore, ctFlatFreqDataRowsStore) {

    /**
     *
     */
    const QuantitySelect = (props) => {

        const handleSelectChange = (evt) => {
            props.changeQuantity(evt.target.value);
        };

        return (
            <label>
                {mixins.translate('freq__ct_quantity_label')}:{'\u00a0'}
                <select value={props.currValue} onChange={handleSelectChange}>
                    <option value="ipm">i.p.m.</option>
                    <option value="abs">absolute freq.</option>
                </select>
            </label>
        );
    };

    /**
     *
     */
    const MinFreqInput = (props) => {

        const handleInputChange = (evt) => {
            dispatcher.dispatch({
                actionType: 'FREQ_CT_SET_MIN_ABS_FREQ',
                props: {value: evt.target.value}
            });
        };

        return (
            <label>
                {mixins.translate('freq__ct_min_freq_label')}:{'\u00a0'}
                <input type="text" style={{width: '3em'}} value={props.currVal}
                        onChange={handleInputChange} />
            </label>
        );
    };

    /**
     *
     */
    const EmptyVectorVisibilitySwitch = (props) => {

        const handleCheckboxChange = (evt) => {
            dispatcher.dispatch({
                actionType: 'FREQ_CT_SET_EMPTY_VEC_VISIBILITY',
                props: {value: evt.target.checked}
            });
        };

        return (
            <label>
                {mixins.translate('freq__ct_hide_zero_vectors')}:{'\u00a0'}
                <input type="checkbox" onChange={handleCheckboxChange}
                        checked={props.hideEmptyVectors} />
            </label>
        );
    };

    /**
     *
     */
    const TransposeTableCheckbox = (props) => {
        const handleClickTranspose = (evt) => {
            dispatcher.dispatch({
                actionType: 'FREQ_CT_TRANSPOSE_TABLE',
                props: {}
            });
        };

        return (
            <label>
                {mixins.translate('freq__ct_transpose_table')}:{'\u00a0'}
                <input type="checkbox" checked={props.isChecked} onChange={handleClickTranspose}
                        style={{verticalAlign: 'middle'}} />
            </label>
        );
    };

    /**
     *
     * @param {*} props
     */
    const TableSortRowsSelect = (props) => {

        const handleChange = (evt) => {
            dispatcher.dispatch({
                actionType: 'FREQ_CT_SORT_BY_DIMENSION',
                props: {
                    dim: 1,
                    attr: evt.target.value
                }
            });
        };

        return (
            <label>
                {mixins.translate('freq__ct_sort_row_label')}:{'\u00a0'}
                <select onChange={handleChange} value={props.sortAttr}>
                    <option value="ipm">{mixins.translate('freq__ct_sort_row_opt_ipm')}</option>
                    <option value="abs">{mixins.translate('freq__ct_sort_row_opt_abs')}</option>
                    <option value="attr">{mixins.translate('freq__ct_sort_col_opt_attr')}</option>
                </select>
            </label>
        );
    };

    /**
     *
     * @param {*} props
     */
    const TableSortColsSelect = (props) => {

        const handleChange = (evt) => {
            dispatcher.dispatch({
                actionType: 'FREQ_CT_SORT_BY_DIMENSION',
                props: {
                    dim: 2,
                    attr: evt.target.value
                }
            });
        };

        return (
            <label>
                {mixins.translate('freq__ct_sort_col_label')}:{'\u00a0'}
                <select onChange={handleChange} value={props.sortAttr}>
                    <option value="ipm">{mixins.translate('freq__ct_sort_col_opt_ipm')}</option>
                    <option value="abs">{mixins.translate('freq__ct_sort_col_opt_abs')}</option>
                    <option value="attr">{mixins.translate('freq__ct_sort_col_opt_attr')}</option>
                </select>
            </label>
        );
    };

    /**
     *
     * @param {*} props
     */
    const AlphaLevelSelect = (props) => {
        const onChange = (evt) => {
            dispatcher.dispatch({
                actionType: 'FREQ_CT_SET_ALPHA_LEVEL',
                props: {
                    value: evt.target.value
                }
            });
        };

        return (
            <label>
                {mixins.translate('freq__ct_conf_level_label')}:{'\u00a0'}
                <select value={props.alphaLevel} onChange={onChange}>
                    {props.availAlphaLevels.map(item =>
                        <option key={item[0]} value={item[0]}>{item[1]}</option>)}
                </select>
            </label>
        );
    };

    /**
     *
     */
    const CTTableModForm = (props) => {

        return (
            <form className="CTTableModForm">
                <fieldset>
                    <legend>{mixins.translate('freq__ct_data_parameters_legend')}</legend>
                    <ul className="items">
                        <li>
                            <QuantitySelect currVal={props.viewQuantity} changeQuantity={props.changeQuantity} />
                        </li>
                        <li>
                            <MinFreqInput currVal={props.minAbsFreq} />
                        </li>
                        <li>
                            <EmptyVectorVisibilitySwitch hideEmptyVectors={props.hideEmptyVectors} />
                        </li>
                        <li>
                            <AlphaLevelSelect alphaLevel={props.alphaLevel} availAlphaLevels={props.availAlphaLevels} />
                        </li>
                    </ul>
                </fieldset>
                <fieldset>
                    <legend>{mixins.translate('freq__ct_view_parameters_legend')}</legend>
                    <ul className="items">
                        <li>
                            <TableSortRowsSelect sortAttr={props.sortDim1} />
                        </li>
                        <li>
                            <TableSortColsSelect sortAttr={props.sortDim2} />
                        </li>
                        <li>
                            <TransposeTableCheckbox isChecked={props.transposeIsChecked} />
                        </li>
                    </ul>
                </fieldset>
            </form>
        );
    };

    /**
     *
     */
    const CTCellMenu = (props) => {

        const handlePosClick = (evt) => {
            dispatcher.dispatch({
                actionType: 'FREQ_CT_QUICK_FILTER_CONCORDANCE',
                props: {
                    args: props.data.pfilter
                }
            });
        };

        const handleCloseClick = () => {
            props.onClose();
        };

        return (
            <layoutViews.PopupBox onCloseClick={handleCloseClick} customClass="menu">
                <fieldset className="detail">
                    <legend>{mixins.translate('freq__ct_detail_legend')}</legend>
                    {mixins.translate('freq__ct_ipm_freq_label')}:
                    {'\u00a0'}
                    {mixins.formatNumber(props.data.ipm, 1)}
                    {'\u00a0'}
                    ({mixins.formatNumber(props.data.ipmConfInterval[0], 1)}
                    {'\u00a0'}
                    -
                    {'\u00a0'}
                    {mixins.formatNumber(props.data.ipmConfInterval[1], 1)})
                    <br />
                    {mixins.translate('freq__ct_abs_freq_label')}:
                    {'\u00a0'}
                    {mixins.formatNumber(props.data.abs, 0)}
                    {'\u00a0'}
                    ({mixins.formatNumber(props.data.absConfInterval[0], 0)}
                    {'\u00a0'}
                    -
                    {'\u00a0'}
                    {mixins.formatNumber(props.data.absConfInterval[1], 0)})


                </fieldset>
                <form>
                    <fieldset>
                        <legend>{mixins.translate('freq__ct_pfilter_legend')}</legend>
                        <table>
                            <tbody>
                                <tr>
                                    <th>
                                        {props.attr1} =
                                    </th>
                                    <td>
                                        <input type="text" readOnly value={props.label1} />
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        {props.attr2} =
                                    </th>
                                    <td>
                                        <input type="text" readOnly value={props.label2} />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <p>
                            <button type="button" className="default-button"
                                    onClick={handlePosClick}>
                                {mixins.translate('freq__ct_pfilter_btn_label')}
                            </button>
                        </p>
                    </fieldset>
                </form>
            </layoutViews.PopupBox>
        );
    };

    /**
     *
     */
    const CTCell = (props) => {

        const getValue = () => {
            if (isNonEmpty()) {
                switch (props.quantity) {
                    case 'ipm':
                        return mixins.formatNumber(props.data.ipm, 1);
                    case 'abs':
                        return mixins.formatNumber(props.data.abs, 0);
                    default:
                        return NaN;
                }

            } else {
                return '';
            }
        };

        const isNonEmpty = () => {
            const v = (() => {
                switch (props.quantity) {
                    case 'ipm':
                        return props.data ? props.data.ipm : 0;
                    case 'abs':
                        return props.data ? props.data.abs : 0;
                    default:
                        return NaN;
                }
            })();
            return v > 0;
        };

        const handleItemClick = () => {
            props.onClick();
        };

        const shouldWarn = (props) => {
            return (props.data.absConfInterval[1] - props.data.absConfInterval[0]) / props.data.abs  >
                props.confIntervalWarnRatio;
        };

        const renderWarning = (props) => {
            if (shouldWarn(props)) {
                const linkStyle = {color: color2str(calcTextColorFromBg(importColor(props.data.bgColor, 1)))}
                return <span style={linkStyle}
                            title={mixins.translate('freq__ct_conf_interval_too_wide_{threshold}',
                                {threshold: props.confIntervalWarnRatio * 100})}>
                            {'\u26A0'}{'\u00a0'}
                        </span>;

            } else {
                return '';
            }
        };

        if (isNonEmpty()) {
            const bgStyle = {};
            const linkStyle = {color: color2str(calcTextColorFromBg(importColor(props.data.bgColor, 1)))}
            const tdClasses = ['data-cell'];
            if (props.isHighlighted) {
                tdClasses.push('highlighted');

            } else {
                bgStyle['backgroundColor'] = props.data.bgColor;
            }
            return (
                <td className={tdClasses.join(' ')} style={bgStyle}>
                    {renderWarning(props)}
                    <a onClick={handleItemClick} style={linkStyle}
                            title={mixins.translate('freq__ct_click_for_details')}>
                        {getValue()}
                    </a>
                    {props.isHighlighted ? <CTCellMenu onClose={props.onClose}
                                                        data={props.data}
                                                        attr1={props.attr1}
                                                        label1={props.label1}
                                                        attr2={props.attr2}
                                                        label2={props.label2} /> : null}
                </td>
            );

        } else {
            return <td className="empty-cell" />;
        }
    };

    /**
     *
     */
    const THRowColLabels = (props) => {

        const handleClick = () => {
            dispatcher.dispatch({
                actionType: 'MAIN_MENU_SHOW_FREQ_FORM',
                props: {}
            });
        };

        return (
            <th className="attr-label">
                <a onClick={handleClick} title={mixins.translate('freq__ct_change_attrs')}>
                    {props.attr1}
                    {'\u005C'}
                    {props.attr2}
                </a>
            </th>
        );
    };

    /**
     *
     * @param {*} props
     */
    const CTDataTable = (props) => {

        const labels1 = () => {
            return props.d1Labels.filter(x => x[1]).map(x => x[0]);
        };

        const labels2 = () => {
            return props.d2Labels.filter(x => x[1]).map(x => x[0]);
        };

        const isHighlightedRow = (i) => {
            return props.highlightedCoord !== null && props.highlightedCoord[0] === i;
        };

        const isHighlightedCol = (j) => {
            return props.highlightedCoord !== null && props.highlightedCoord[1] === j;
        };

        const isHighlighted = (i, j) => {
            return props.highlightedCoord !== null &&
                    props.highlightedCoord[0] === i &&
                    props.highlightedCoord[1] === j;
        };

        return (
            <table className="ct-data">
                <tbody>
                    <tr>
                        <THRowColLabels attr1={props.attr1} attr2={props.attr2} />
                        {labels2().map((label2, i) =>
                            <th key={`lab-${i}`}
                                    className={isHighlightedCol(i) ? 'highlighted' : null}>
                                {label2}
                            </th>
                        )}
                    </tr>
                    {labels1().map((label1, i) => {
                        const htmlClass = ['vert'];
                        if (isHighlightedRow(i)) {
                            htmlClass.push('highlighted');
                        }
                        return (
                            <tr key={`row-${i}`}>
                                <th className={htmlClass.join(' ')}><span>{label1}</span></th>
                                {labels2().map((label2, j) => {
                                    return <CTCell data={props.data[label1][label2]} key={`c-${i}:${j}`}
                                                    quantity={props.viewQuantity}
                                                    onClick={()=>props.onHighlight(i, j)}
                                                    onClose={props.onResetHighlight}
                                                    attr1={props.attr1}
                                                    label1={label1}
                                                    attr2={props.attr2}
                                                    label2={label2}
                                                    isHighlighted={isHighlighted(i, j)}
                                                    confIntervalWarnRatio={props.confIntervalWarnRatio} />;
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        );
    };

    /**
     *
     * @param {*} props
     */
    const WaitingAnim = (props) => {
        return (
             <table className="ct-data">
                <tbody>
                    <tr>
                        <THRowColLabels attr1={props.attr1} attr2={props.attr2} />
                        <th>{'\u2026'}</th>
                    </tr>
                    <tr>
                        <th>{'\u22EE'}</th>
                        <td style={{padding: '2em'}}>
                            <img src={mixins.createStaticUrl('img/ajax-loader.gif')} alt={mixins.translate('global__loading')} />
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    };

    /**
     *
     */
    class CT2dFreqResultView extends React.Component {

        constructor(props) {
            super(props);
            this.state = this._fetchState();
            this._changeQuantity = this._changeQuantity.bind(this);
            this._handleStoreChange = this._handleStoreChange.bind(this);
            this._highlightItem = this._highlightItem.bind(this);
            this._resetHighlight = this._resetHighlight.bind(this);
        }

        _fetchState() {
            return {
                d1Labels: ctFreqDataRowsStore.getD1Labels(),
                d2Labels: ctFreqDataRowsStore.getD2Labels(),
                data: ctFreqDataRowsStore.getData(),
                attr1: ctFreqDataRowsStore.getAttr1(),
                attr2: ctFreqDataRowsStore.getAttr2(),
                sortDim1: ctFreqDataRowsStore.getSortDim1(),
                sortDim2: ctFreqDataRowsStore.getSortDim2(),
                minAbsFreq: ctFreqDataRowsStore.getMinAbsFreq(),
                viewQuantity: 'ipm',
                highlightedCoord: null,
                transposeIsChecked: ctFreqDataRowsStore.getIsTransposed(),
                hideEmptyVectors: ctFreqDataRowsStore.getFilterZeroVectors(),
                isWaiting: ctFreqDataRowsStore.getIsWaiting(),
                alphaLevel: ctFreqDataRowsStore.getAlphaLevel(),
                availAlphaLevels: ctFreqDataRowsStore.getAvailAlphaLevels(),
                confIntervalWarnRatio: ctFreqDataRowsStore.getConfIntervalWarnRatio()
            };
        }

        _changeQuantity(q) {
            const state = this._fetchState();
            state.viewQuantity = q;
            this.setState(state);
        }

        _handleStoreChange() {
            const newState = this._fetchState();
            newState.viewQuantity = this.state.viewQuantity;
            newState.highlightedCoord = this.state.highlightedCoord;
            this.setState(newState);
        }

        componentDidMount() {
            ctFreqDataRowsStore.addChangeListener(this._handleStoreChange);
        }

        componentWillUnmount() {
            ctFreqDataRowsStore.removeChangeListener(this._handleStoreChange);
        }

        _renderWarning() {
            if (this.state.adHocSpfilterVisibleubcWarning) {
                return (
                    <p className="warning">
                        <img src={mixins.createStaticUrl('img/warning-icon.svg')}
                                alt={mixins.translate('global__warning')} />
                        {mixins.translate('freq__ct_uses_ad_hoc_subcorpus_warn')}
                    </p>
                );
            }
        }

        _resetHighlight() {
            const newState = this._fetchState();
            newState.viewQuantity = this.state.viewQuantity;
            newState.highlightedCoord = null;
            this.setState(newState);
        }

        _highlightItem(i, j) {
            this._resetHighlight();
            const newState = this._fetchState();
            newState.viewQuantity = this.state.viewQuantity;
            newState.highlightedCoord = [i, j];
            this.setState(newState);
        }

        render() {
            return (
                <div className="CT2dFreqResultView">
                    {this._renderWarning()}
                    <div className="toolbar">
                        <CTTableModForm
                                minAbsFreq={this.state.minAbsFreq}
                                viewQuantity={this.state.viewQuantity}
                                changeQuantity={this._changeQuantity}
                                hideEmptyVectors={this.state.hideEmptyVectors}
                                transposeIsChecked={this.state.transposeIsChecked}
                                sortDim1={this.state.sortDim1}
                                sortDim2={this.state.sortDim2}
                                alphaLevel={this.state.alphaLevel}
                                availAlphaLevels={this.state.availAlphaLevels} />
                    </div>
                    {this.state.isWaiting ?
                        <WaitingAnim attr1={this.state.attr1}
                                attr2={this.state.attr2} /> :
                        <CTDataTable
                                attr1={this.state.attr1}
                                attr2={this.state.attr2}
                                d1Labels={this.state.d1Labels}
                                d2Labels={this.state.d2Labels}
                                data={this.state.data}
                                viewQuantity={this.state.viewQuantity}
                                onHighlight={this._highlightItem}
                                onResetHighlight={this._resetHighlight}
                                highlightedCoord={this.state.highlightedCoord}
                                confIntervalWarnRatio={this.state.confIntervalWarnRatio} />
                    }
                </div>
            );
        }
    }

    /**
     *
     * @param {*} props
     */
    const TRFlatListRow = (props) => {

        const shouldWarn = (props) => {
            return (props.data.absConfInterval[1] - props.data.absConfInterval[0]) / props.data.abs  >
                props.confIntervalWarnRatio;
        };

        const formatRange = (interval) => {
            return interval.map(x => mixins.formatNumber(x, 1)).join('-');
        };

        const renderWarning = () => {
            if (shouldWarn(props)) {
                return (
                <span title={mixins.translate('freq__ct_conf_interval_too_wide_{threshold}',
                            {threshold: props.confIntervalWarnRatio * 100})}>
                        {'\u26A0'}{'\u00a0'}
                </span>
                );

            } else {
                return '';
            }
        };

        return (
            <tr>
                <td className="num">{props.idx}.</td>
                <td>{props.data.val1}</td>
                <td>{props.data.val2}</td>
                <td className="num" title={formatRange(props.data.absConfInterval)}>
                    {renderWarning()}
                    {props.data.abs}
                </td>
                <td className="num" title={formatRange(props.data.ipmConfInterval)}>
                    {renderWarning()}
                    {props.data.ipm}
                </td>
            </tr>
        );
    }

    /**
     *
     * @param {*} props
     */
    const THSortableCol = (props) => {

        const handleClick = () => {
            dispatcher.dispatch({
                actionType: 'FREQ_CT_SORT_FLAT_LIST',
                props: {
                    value: props.value,
                    reversed: props.isActive ? !props.isReversed : false
                }
            });
        };

        const renderFlag = () => {
            if (props.isActive) {
                if (props.isReversed) {
                    return <img src={mixins.createStaticUrl('img/sort_desc.svg')} />;

                } else {
                    return <img src={mixins.createStaticUrl('img/sort_asc.svg')} />;
                }
            }
            return null;
        };

        return (
            <th className="sort-col">
                <a onClick={handleClick} title={mixins.translate('global__sort_by_this_col')}>
                    {props.label}
                    {renderFlag()}
                </a>
            </th>
        );
    }

    /**
     *
     */
    class CTFlatFreqResultView extends React.Component {

        constructor(props) {
            super(props);
            this.state = this._fetchStoreState();
            this._handleStoreChange = this._handleStoreChange.bind(this);
        }

        _fetchStoreState() {
            return {
                data: ctFlatFreqDataRowsStore.getData(),
                attr1: ctFlatFreqDataRowsStore.getAttr1(),
                attr2: ctFlatFreqDataRowsStore.getAttr2(),
                minAbsFreq: ctFlatFreqDataRowsStore.getMinAbsFreq(),
                sortCol: ctFlatFreqDataRowsStore.getSortCol(),
                sortColIsReversed: ctFlatFreqDataRowsStore.getSortColIsReversed(),
                confIntervalWarnRatio: ctFlatFreqDataRowsStore.getConfIntervalWarnRatio(),
                alphaLevel: ctFlatFreqDataRowsStore.getAlphaLevel(),
                availAlphaLevels: ctFlatFreqDataRowsStore.getAvailAlphaLevels()
            };
        }

        _handleStoreChange() {
            this.setState(this._fetchStoreState());
        }

        componentDidMount() {
            ctFlatFreqDataRowsStore.addChangeListener(this._handleStoreChange);
        }

        componentWillUnmount() {
            ctFlatFreqDataRowsStore.removeChangeListener(this._handleStoreChange);
        }

        render() {
            return (
                <div className="CTFlatFreqResultView">
                    <div className="toolbar">
                        <form>
                            <fieldset>
                                <legend>{mixins.translate('freq__ct_data_parameters_legend')}</legend>
                                <ul className="items">
                                    <li>
                                        <MinFreqInput currVal={this.state.minAbsFreq} />
                                    </li>
                                    <li>
                                        <AlphaLevelSelect alphaLevel={this.state.alphaLevel}
                                                availAlphaLevels={this.state.availAlphaLevels} />
                                    </li>
                                </ul>
                            </fieldset>
                        </form>
                    </div>
                    <table className="data">
                        <tbody>
                            <tr>
                                <th />
                                <THSortableCol label={this.state.attr1} value={this.state.attr1}
                                        isActive={this.state.sortCol === this.state.attr1}
                                        isReversed={this.state.sortCol === this.state.attr1 && this.state.sortColIsReversed}
                                         />
                                <th>{this.state.attr2}</th>
                                <THSortableCol label={mixins.translate('freq__ct_abs_freq_label')}
                                        value="abs" isActive={this.state.sortCol === 'abs'}
                                        isReversed={this.state.sortCol === 'abs' && this.state.sortColIsReversed}
                                        />
                                <THSortableCol label={mixins.translate('freq__ct_ipm_freq_label')}
                                        value="ipm" isActive={this.state.sortCol === 'ipm'}
                                        isReversed={this.state.sortCol === 'ipm' && this.state.sortColIsReversed} />
                            </tr>
                            {this.state.data.map((item, i) =>
                                <TRFlatListRow key={`r_${i}`} idx={i+1} data={item} confIntervalWarnRatio={this.state.confIntervalWarnRatio} />)}
                        </tbody>
                    </table>
                </div>
            );
        }
    }

    /**
     *
     */
    class CTFreqResultView extends React.Component {

        constructor(props) {
            super(props);
            this.state = {mode: 'table'};
            this._handleModeSwitch = this._handleModeSwitch.bind(this);
        }

        _handleModeSwitch(evt) {
            this.setState({mode: evt.target.value});
        }

        _renderContents() {
            switch (this.state.mode) {
                case 'table':
                    return <CT2dFreqResultView {...this.props} />
                case 'list':
                    return <CTFlatFreqResultView {...this.props} />
                default:
                    return null;
            }
        }

        render() {
            return (
                <div className="CTFreqResultView">
                    <p className="mode-switch">
                        <label>
                            {mixins.translate('freq__ct_view_mode')}:{'\u00a0'}
                            <select onChange={this._handleModeSwitch}>
                                <option value="table">{mixins.translate('freq__ct_switch_table_view')}</option>
                                <option value="list">{mixins.translate('freq__ct_switch_list_view')}</option>
                            </select>
                        </label>
                    </p>
                    {this._renderContents()}
                </div>
            );
        }
    }

    return {
        CTFreqResultView: CTFreqResultView
    };

}
