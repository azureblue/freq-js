import { RectBoundElement } from "../base.js";

export class GraphGrid extends RectBoundElement {
    /**
     * @param {GridStyle} gridStyle
     */
    constructor(gridStyle) {
        super();
        this.svgGrid = this.element.appendChild(createSvgNode("svg", {
            class: "grid"

        }));

        this.gridLinesPath = this.svgGrid.appendChild(createSvgNode("path", {
            class: "grid-line",
            style: ((gridStyle != undefined && gridStyle.gridStyle) ? gridStyle.gridStyle.asStyle() : "")
        }));

        this.gridKeyLinesPath = this.svgGrid.appendChild(createSvgNode("path", {
            class: "grid-line key",
            style: ((gridStyle != undefined && gridStyle.gridKeyStyle != undefined) ? gridStyle.gridKeyStyle.asStyle() : "")
        }));
    }

    updateSize() {
        super.updateSize();
        this.element.setAttributeNS("null", "viewBox", `0 0 ${this.width} ${this.height}`);
    }
}

/**
 * @returns {SVGElement}
 */
function createSvgNode(svgNode, attrs = {}, style = {}) {
    /**@type {SVGElement} */
    let svgElement = document.createElementNS("http://www.w3.org/2000/svg", svgNode);
    for (var p in attrs)
        svgElement.setAttributeNS(null, p, attrs[p]);

    for (var p in style)
        svgElement.style.setProperty(p, style[p]);
    return svgElement;
}

export class GridStyle {
    /**
     * @param {Graph.LineStyle} gridStyle
     * @param {Graph.LineStyle} gridKeyStyle
     */
    constructor(gridStyle, gridKeyStyle) {
        this.gridStyle = gridStyle;
        this.gridKeyStyle = gridKeyStyle;
    }
}
