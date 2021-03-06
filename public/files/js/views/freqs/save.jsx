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

import React from 'vendor/react';

export function init(dispatcher, utils, layoutViews, freqSaveStore) {

    /**
     *
     * @param {*} props
     */
    const TRSaveFormatSelect = (props) => {

        const handleSelect = (evt) => {
            dispatcher.dispatch({
                actionType: 'FREQ_SAVE_FORM_SET_FORMAT',
                props: {
                    value: evt.target.value
                }
            });
        };

        return (
            <tr>
                <th>{utils.translate('coll__save_form_select_label')}:</th>
                <td>
                    <select value={props.value} onChange={handleSelect}>
                        <option value="csv">CSV</option>
                        <option value="xlsx">XLSX (Excel)</option>
                        <option value="xml">XML</option>
                        <option value="text">Text</option>
                    </select>
                </td>
            </tr>
        );
    };

    /**
     *
     * @param {*} props
     */
    const TRIncludeHeadingCheckbox = (props) => {

        const handleChange = () => {
            dispatcher.dispatch({
                actionType: 'FREQ_SAVE_FORM_SET_INCLUDE_HEADING',
                props: {
                    value: !props.value
                }
            });
        };

        return (
            <tr className="separator">
                <th><label htmlFor="tr-include-heading-checkbox">{utils.translate('coll__save_form_incl_heading')}</label>:</th>
                <td>
                    <input id="tr-include-heading-checkbox" type="checkbox" checked={props.value} onChange={handleChange} />
                </td>
            </tr>
        );
    }

    /**
     *
     * @param {*} props
     */
    const TRColHeadersCheckbox = (props) => {

        const handleChange = () => {
            dispatcher.dispatch({
                actionType: 'FREQ_SAVE_FORM_SET_INCLUDE_COL_HEADERS',
                props: {
                    value: !props.value
                }
            });
        };

        return (
            <tr className="separator">
                <th><label htmlFor="tr-col-headers-checkbox">{utils.translate('coll__save_form_incl_col_hd')}</label>:</th>
                <td>
                    <input id="tr-col-headers-checkbox" type="checkbox" checked={props.value} onChange={handleChange} />
                </td>
            </tr>
        );
    }

    /**
     *
     * @param {*} props
     */
    const TRSelLineRangeInputs = (props) => {

        const handleFromInput = (evt) => {
            dispatcher.dispatch({
                actionType: 'FREQ_SAVE_FORM_SET_FROM_LINE',
                props: {
                    value: evt.target.value
                }
            });
        };

        const handleToInput = (evt) => {
            dispatcher.dispatch({
                actionType: 'FREQ_SAVE_FORM_SET_TO_LINE',
                props: {
                    value: evt.target.value
                }
            });
        };

        return (
            <tr>
                <th style={{verticalAlign: 'top'}}>
                    {utils.translate('coll__save_form_lines_to_store')}:
                </th>
                <td>
                    {utils.translate('coll__save_form_line_from')}:{'\u00a0'}
                    <input type="text" name="from_line" value={props.fromValue}
                            onChange={handleFromInput}  style={{width: '4em'}} />
                    {'\u00a0'}
                    {utils.translate('coll__save_form_line_to')}:{'\u00a0'}
                    <input type="text" name="to_line" value={props.toValue}
                            onChange={handleToInput} style={{width: '4em'}} />

                    <div className="hint">
                        ({utils.translate('coll__save_form_leave_to_load_to_end')}
                    </div>
                </td>
            </tr>
        )
    };

    /**
     *
     */
    class SaveFreqForm extends React.Component {

        constructor(props) {
            super(props);
            this.state = this._fetchStoreState();
            this._handleStoreChange = this._handleStoreChange.bind(this);
            this._handleSubmitClick = this._handleSubmitClick.bind(this);
        }

        _fetchStoreState() {
            return {
                saveformat: freqSaveStore.getSaveformat(),
                includeColHeaders: freqSaveStore.getIncludeColHeaders(),
                includeHeading: freqSaveStore.getIncludeHeading(),
                fromLine: freqSaveStore.getFromLine(),
                toLine: freqSaveStore.getToLine()
            };
        }

        _handleSubmitClick() {
            dispatcher.dispatch({
                actionType: 'FREQ_SAVE_FORM_SUBMIT',
                props: {}
            });
        }

        _handleStoreChange() {
            this.setState(this._fetchStoreState());
        }

        componentDidMount() {
            freqSaveStore.addChangeListener(this._handleStoreChange);
        }

        componentWillUnmount() {
            freqSaveStore.removeChangeListener(this._handleStoreChange);
        }

        _renderFormatDependentOptions() {
            switch (this.state.saveformat) {
                case 'xml':
                    return <TRIncludeHeadingCheckbox value={this.state.includeHeading} />;
                case 'csv':
                case 'xlsx':
                    return <TRColHeadersCheckbox value={this.state.includeColHeaders} />
                default:
                return <tr><td colSpan="2" /></tr>;
            }
        }

        render() {
            return (
                <layoutViews.ModalOverlay onCloseKey={this.props.onClose}>
                    <layoutViews.CloseableFrame onCloseClick={this.props.onClose} label={utils.translate('freq__save_form_label')}>
                        <form className="SaveFreqForm">
                            <table className="form">
                                <tbody>
                                    <TRSaveFormatSelect value={this.state.saveformat} />
                                    {this._renderFormatDependentOptions()}
                                    <TRSelLineRangeInputs fromValue={this.state.fromLine} toValue={this.state.toLine} />
                                </tbody>
                            </table>
                            <button type="button" className="default-button"
                                    onClick={this._handleSubmitClick}>
                                {utils.translate('coll__save_form_submit_btn')}
                            </button>
                        </form>
                    </layoutViews.CloseableFrame>
                </layoutViews.ModalOverlay>
            );
        }
    }

    return {
        SaveFreqForm: SaveFreqForm
    };

}