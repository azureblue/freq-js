import {isNumeric, createGetParamsMap } from "./utils.js";
import { DOMElementOwner } from "/base.js";

const storage = window.localStorage;

export class MissingConfig {

    constructor(path) {
        this._path = path;
    }

    get message() {
        return "missing config: " + this._path;
    }
}
const whitespaceRegex = /\s/g;
const linkRegex = /@\S+/g;
const calcRegex = /^[0-9.+-/*()\s]+$/g;

export class Config {
    constructor(config, sourceConfig) {
        this.config = config;
        this.sourceConfig = sourceConfig;
    }

    /**
     * @param {string} path
     */
    get(path) {
        let node = this.config;
        for (let part of path.split(".")) {
            node = node[part];
            if (node == undefined)
                return null;
        }
        if (typeof node == "string") {
            return this.resolve(node);
        }
        return node;
    }

    /**
     * @param {string} path
     * @param {any} value
     */
    set(path, value) {
        let node = this.config;
        const pathElements = path.split(".");

        for (let i = 0; i < pathElements.length - 1; i++) {
            const part = pathElements[i];
            if (node[part] == null) {
                node[part] = {}
            }
            node = node[part];
            if (node == undefined)
                return null;
        }
        if (isNumeric(value)) {
            value = Number.isInteger(value) ? Number.parseInt(value) : Number.parseFloat(value);
        }

        if (value === "true")
            value = true;
        else if (value === "false")
            value = false;
        node[pathElements[pathElements.length - 1]] = value;
    }

    /**
     * @param {string} value
     */
    resolveCalc(value) {
        const len = value.length;
        let idx = 1;
        linkRegex.lastIndex = 0;
        value = value.replaceAll(linkRegex, link => this.get(link.substring(1)));
        calcRegex.lastIndex = 0;
        if (!calcRegex.test(value)) {
            throw "invalid calc substitution: " + value;
        }
        /**@type {number} */
        let res = eval(value);
        if (Number.isInteger(res))
            return Math.round(res);
        else
            return res;
    }

    /**
     * @param {string} value
     */
    resolve(value) {
        const len = value.length;
        if (value[0] == "@") {
            const link = value.substring(1);
            return this.get(link);
        } else if (value.startsWith("${")) {
            if (!value.endsWith("}")) {
                throw "invalid ${} substitution";
            }
            return this.resolveCalc(value.substring(2, len - 1));
        }
        return value;
    }

    resolveAll(node = this.config) {
        if (typeof node == "object") {
            if (Array.isArray(node)) {
                for (let i = 0; i < node.length; i++) {
                    if (typeof node[i] == "string") {
                        node[i] = this.resolve(node[i]);
                    } else {
                        this.resolveAll(node[i]);
                    }
                }
            } else {
                for (let prop in node) {
                    if (typeof node[prop] == "string")
                        node[prop] = this.resolve(node[prop]);
                    else
                        this.resolveAll(node[prop])
                }
            }
        }
    }
}

/**
 * @type {Config}
 */
let currentConfig = new Config({});

export class ConfigValue {
    constructor(value) {
        this.value = value;
    }

    toPx() {
        if (Array.isArray(this.value)) {
            return this.value.map(v => convertToPx(v));
        }
        return convertToPx(this.value);
    }

    toPxUIScaled() {
        if (Array.isArray(this.value)) {
            return this.value.map(v => convertToPx(v, true));
        }
        return convertToPx(this.value, true);
    }

    asNumber() {
        const res = Number.parseFloat(this.value);
        if (!Number.isFinite(res)) {
            throw "invalid number: " + this.value;
        }
        return res;
    }

    asObject() {
        if (typeof this.value != "object") {
            throw "invalid type, expected object: " + this.value;
        }
        return this.value;
    }

    asString() {
        if (typeof this.value != "string") {
            throw "invalid type, expected string: " + this.value;
        }
        return this.value;
    }

    asBool() {
        if (typeof this.value != "boolean") {
            throw "invalid type, expected boolean: " + this.value;
        }
        return this.value;
    }

}

export const CONFIG = {
    getJson: function(spaces = 4) {
        return JSON.stringify(currentConfig.sourceConfig, null, spaces);
    },

    save: function(json) {
        const parsed = JSON.parse(json);
        storage.setItem("config", JSON.stringify(parsed));
    },

    loadConfig: async function(defaultConfigFile, forceReset = false) {
        let configJson = storage.getItem("config");
        let saveConfig = false;
        if (configJson == null || forceReset) {
            saveConfig = true;
            configJson = await (await fetch(defaultConfigFile, {cache: "no-cache"})).text();
        }
        try {
            const config = JSON.parse(configJson);
            const configSource = JSON.parse(configJson);
            if (saveConfig)
                storage.setItem("config", JSON.stringify(config));
            const urlParams = createGetParamsMap();
            currentConfig = new Config(config, configSource);
            urlParams.forEach((v, k) => {
                currentConfig.set(k, v == undefined ? true : v);
            })
            currentConfig.resolveAll();
            return true;
        } catch (ex) {
            console.error("unable to load config: " + ex);
        }
    },

    /**
     * @param {string} path
     */
    get: function(path) {
        const res = currentConfig.get(path);
        if (res == null)
            throw "missing path: " + path;
        console.log(path + " = " + res);
        return new ConfigValue(res);
    },


    /**
     * @param {string} path
     * @param {Function} defaultValueSupplier
     */
    getOrDefault: function(path, defaultValueSupplier) {
        const res = currentConfig.get(path);
        if (res == null)
            return new ConfigValue(defaultValueSupplier());

        return new ConfigValue(res);
    }

};

const divUnitConv = new DOMElementOwner("div", ["positionable-element"]);
divUnitConv.addToParentOrDOM();

export function convertToPx(cssSize, uiScaled = false) {
    const scaling = uiScaled ? CONFIG.get("ui.scaling").asNumber() : 1;
    if (Number.isFinite(cssSize))
        return cssSize * scaling;
    divUnitConv.style.width = cssSize;
    return parseFloat(window.getComputedStyle(divUnitConv.element).width) * scaling;
}
