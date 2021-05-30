import { PositionableElement, RectBoundElement } from "../base.js";
import { Graph } from "./graph.js";
import { FontSizeCache, measureTextDiv } from "../utils.js";
import { TextStyle } from "./style.js";

class LabelManager {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        this._graph = graph;
    }

    clearLabels() {
    }

    /**
     *
     * @param {*} graphRect
     * @param {*} labelData
     */
    addLabel() {
    }
}


export class NoteCentsFreqLabelStyle {

    /**
     * @param {TextStyle} note
     * @param {TextStyle} cents
     * @param {TextStyle} freq
     * @param {Array<number>} spacing
     * @param {string} lineColor
     * @param {number} lineWidth
     */
    constructor(note, cents, freq, spacing, lineColor, lineWidth) {
        this.note = note;
        this.cents = cents;
        this.freq = freq;
        this.spacing = spacing;
        this.lineColor = lineColor;
        this.lineWidth = lineWidth;
    }

    clone() {
        return new NoteCentsFreqLabelStyle(this.note.clone(), this.cents.clone(), this.freq.clone(),
            new Array(...this.spacing), this.lineColor, this.lineWidth);
    }
}

NoteCentsFreqLabelStyle.defaultStyle = new NoteCentsFreqLabelStyle(
    Graph.defaultStyle.labelStyle.textStyle,
    Graph.defaultStyle.labelStyle.textStyle,
    Graph.defaultStyle.labelStyle.textStyle,
    [10, 10, 10, 10],
    "rgb(158, 87, 190)",
    2
);


export class NoteCentsFreqLabelManager extends LabelManager {

    /**
     * @param {Graph} graph
     * @param {NoteCentsFreqLabelStyle} labelStyle
     */
    constructor(graph, labelStyle, uniqueName) {
        super(graph);
        this._fontWidthCache = new FontSizeCache();
        this._fontCentsWidthCache = new FontSizeCache();
        this.labelConstructor = () => new NoteCentsFreqLabel(uniqueName, labelStyle.spacing, this._fontCentsWidthCache, this._fontWidthCache);

        /** @type {NoteFreqCentsLabelCache<NoteCentsFreqLabel>} */
        this._cache = new NoteFreqCentsLabelCache(this.labelConstructor);
        /** @type {Array<NoteCentsFreqLabel>} */
        this._added = [];
        this._graphScreenRect = this._graph.calculateGraphScreenRect();
        this._graphUpdateSizeListener = () => {
            this._graphScreenRect = this._graph.calculateGraphScreenRect();
        }
        this._graph.addUpdateSizeListener(this._graphUpdateSizeListener);
        this._reuseIdx = 0;
        this._uniqueClassName = uniqueName;
        this._style = labelStyle;
        this.updateStyle();
    }

    updateStyle() {

        /**@type {HTMLStyleElement} */
        let customStyles = document.getElementById("custom-style")

        let label = this.labelConstructor();
        label.change({
            note: "G",
            cents: "+123",
            freq: "123.1"
        });

        let idx;
        idx = customStyles.sheet.insertRule(`.${this._uniqueClassName}.note {
            ${this._style.note.asStyle()};
        }`);

        const noteHeight = measureTextDiv(label.note.element).height;
        customStyles.sheet.deleteRule(idx);
        customStyles.sheet.insertRule(`.${this._uniqueClassName}.note {
            ${this._style.note.asStyle()};
            line-height: ${noteHeight}px;
        }`);

        idx = customStyles.sheet.insertRule(`.${this._uniqueClassName}.cents {
            ${this._style.cents.asStyle()};
        }`);

        const centsHeight = measureTextDiv(label.cents.element).height;
        customStyles.sheet.deleteRule(idx);

        customStyles.sheet.insertRule(`.${this._uniqueClassName}.cents {
            ${this._style.cents.asStyle()};
            line-height: ${centsHeight}px;
        }`);

        idx = customStyles.sheet.insertRule(`.${this._uniqueClassName}.freq {
            ${this._style.freq.asStyle()};
        }`);

        const freqHeight = measureTextDiv(label.cents.element).height;
        customStyles.sheet.deleteRule(idx);

        customStyles.sheet.insertRule(`.${this._uniqueClassName}.freq {
            ${this._style.freq.asStyle()};
            line-height: ${freqHeight}px;
        }`);

        customStyles.sheet.insertRule(`.${this._uniqueClassName}.absolutelabel-vertical-line {
            width: ${this._style.lineWidth}px;
            background-color: ${this._style.lineColor};
        }`)

        label.remove();

        this._fontWidthCache.calculate(this._style.freq.fontString(), "0123456789.");
        this._fontCentsWidthCache.calculate(this._style.cents.fontString(), "0123456789+-");
    }

    reuseAll() {
        this._reuseIdx = 0;
    }

    /**
     * @param {number} freq
     * @param {NoteCentsFreqLabelData} labelData
     */
    addLabel(freq, labelData) {
        const graphRect = this._graphScreenRect;
        const xMid = Math.ceil(this._graph.xpos(freq) * 10) / 10;
        /**@type {NoteCentsFreqLabel} */
        let lab;
        if (this._reuseIdx < this._added.length)
            lab = this._added[this._reuseIdx];
        else {
            lab = this._cache.get();
            this._added.push(lab);
        }
        lab.change(labelData);
        lab.position({
            x: graphRect.x + xMid,
            topY: graphRect.y,
            bottomY: graphRect.y + graphRect.height
        });
        this._reuseIdx++;
    }

    cleanNotUsed() {
        for (let i = this._reuseIdx; i < this._added.length; i++) {
            this._cache.ret(this._added.pop());
        }
    }

    cleanAll() {
        this._added.forEach(lab => this._cache.ret(lab));
        this._added.length = 0;
    }
}

/**
 * @typedef {Object} NoteCentsFreqLabelData
 * @property {string} note
 * @property {number} cents
 * @property {number} freq
 */

/**
* @typedef {Object} NoteCentsFreqLabelPosition
* @property {integer} x
* @property {integer} topY
* @property {integer} bottomY
*/

/**
 * @typedef {Object NoteCentsFreqLabelSizeCache}
 * @property {number} noteHeight
 * @property {number} centsHeight
 * @property {number} freqHeight
 */

export class NoteCentsFreqLabel {

    /**
     * @param {string} groupClassName
     * @param {FontSizeCache} freqFontWidthCache
     * @param {FontSizeCache} centsFontWidthCache
     */
    constructor(groupClassName = "", spacing = [0, 0, 0, 0], centsFontWidthCache, freqFontWidthCache) {
        this._spacing = spacing;
        this._freqFontWidthCache = freqFontWidthCache;
        this._centsFontWidthCache = centsFontWidthCache;
        this.note = new PositionableElement($(/*html*/`<div class = "absolutelabel note ${groupClassName}"></div>`)[0]);
        this.cents = new PositionableElement($(/*html*/`<div class = "absolutelabel cents ${groupClassName}"></div>`)[0]);
        this.freq = new RectBoundElement($(/*html*/`<div class = "absolutelabel freq ${groupClassName}"></div>`)[0]);
        this.verticalLine = new RectBoundElement($(/*html*/`<div class = "absolutelabel-vertical-line ${groupClassName}"></div>`)[0]);
        this.verticalLine.rounding = true;
        this.note.addToParentOrDOM();
        this.cents.addToParentOrDOM();
        this.freq.addToParentOrDOM();
        this._centsOffset = 0;
        this.verticalLine.addToParentOrDOM();
        /** @type {NoteCentsFreqLabelSizeCache} */
        this._sizeCache = {};
    }

    /**
     * @param {NoteCentsFreqLabelPosition} position
     */
    position(position) {
        let currentH = position.topY + this._spacing[0];

        this.note.position(position.x, currentH);

        if (this._sizeCache.noteHeight == undefined)
            this._sizeCache.noteHeight = this.note.getScreenRect().height;
        currentH += this._sizeCache.noteHeight + this._spacing[1];

        this.cents.position(position.x + this._centsOffset, currentH);

        if (this._sizeCache.centsHeight == undefined)
            this._sizeCache.centsHeight = this.cents.getScreenRect().height;
        currentH += this._sizeCache.centsHeight + this._spacing[2];


        this.freq.position(position.x, currentH);

        currentH += this.freq.height + this._spacing[3];

        this.verticalLine.position(position.x - 1, currentH);
        this.verticalLine.height = position.bottomY - currentH;
    }

    hide() {
        this.note.x = -500;
        this.cents.x = -500;
        this.freq.x = -500;
        this.verticalLine.x = -500;
    }

    remove() {
        this.note.remove();
        this.cents.remove();
        this.freq.remove();
        this.verticalLine.remove();
    }

    /**
     * @param {NoteCentsFreqLabelData} params
     */
    change(params = {}) {
        for (let prop in params) {
            /**@type {HTMLElement} */
            let el = this[prop].element;
            if (el != undefined) {
                const value = params[prop];
                el.textContent = value;
                if (prop == "freq") {
                    this.freq.height = this._freqFontWidthCache.calculateWidth(value);
                } else if (prop == "cents") {
                    if (value.length > 2) {
                        this._centsOffset = - this._centsFontWidthCache._widthSet.get(value.charAt(0)) - this._centsFontWidthCache._widthSet.get(value.charAt(1))
                            + this._centsFontWidthCache._widthSet.get(value.substring(0, 2));
                    } else {
                        this._centsOffset = - this._centsFontWidthCache._widthSet.get(value.charAt(0)) - this._centsFontWidthCache._widthSet.get(value.charAt(1)) / 2
                            - this._centsFontWidthCache._widthSet.get(value.substring(0, 2));
                    }
                }
            }
        }
    }
}

class NoteFreqCentsLabelCache {

    constructor(constructor) {
        this._constructor = constructor;
        this.cache = [];
    }

    /**
     * @returns {NoteCentsFreqLabel}
     */
    get() {
        if (this.cache.length > 0) {
            let label = this.cache.pop();
            return label;
        } else {
            let label = this._constructor();
            return label;
        }
    }

    /**
     * @param {NoteCentsFreqLabel} label
     */
    ret(label) {
        label.hide();
        this.cache.push(label);
    }
}
