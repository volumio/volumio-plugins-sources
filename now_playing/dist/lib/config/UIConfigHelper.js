"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _UIConfigHelper_observeSection, _UIConfigHelper_observeSectionContent;
Object.defineProperty(exports, "__esModule", { value: true });
class UIConfigHelper {
    static observe(data) {
        const observedSections = {};
        return new Proxy(data, {
            get: (target, prop) => {
                if (observedSections[prop]) {
                    return observedSections[prop];
                }
                const section = target.sections.find((s) => s.id === prop);
                if (section) {
                    const observed = __classPrivateFieldGet(this, _a, "m", _UIConfigHelper_observeSection).call(this, section);
                    observedSections[prop] = observed;
                    return observed;
                }
                return Reflect.get(target, prop);
            },
            set: (target, prop, value) => {
                if (observedSections[prop]) {
                    delete observedSections[prop];
                }
                return Reflect.set(target, prop, value);
            },
            deleteProperty: (target, prop) => {
                if (observedSections[prop]) {
                    delete observedSections[prop];
                }
                return Reflect.deleteProperty(target, prop);
            }
        });
    }
    static sanitizeNumberInput(value) {
        if (typeof value === 'number') {
            return value;
        }
        if (value === null || value === undefined || value === '') {
            return '';
        }
        return Number(value) || '';
    }
}
exports.default = UIConfigHelper;
_a = UIConfigHelper, _UIConfigHelper_observeSection = function _UIConfigHelper_observeSection(data) {
    if (!data.content) {
        data.content = [];
    }
    let observedContent = __classPrivateFieldGet(this, _a, "m", _UIConfigHelper_observeSectionContent).call(this, data.content);
    return new Proxy(data, {
        get: (target, prop) => {
            if (prop === 'content') {
                return observedContent;
            }
            return Reflect.get(target, prop);
        },
        set: (target, prop, value) => {
            if (prop === 'content') {
                observedContent = __classPrivateFieldGet(this, _a, "m", _UIConfigHelper_observeSectionContent).call(this, value);
            }
            return Reflect.set(target, prop, value);
        }
    });
}, _UIConfigHelper_observeSectionContent = function _UIConfigHelper_observeSectionContent(data) {
    return new Proxy(data, {
        get: (target, prop) => {
            return data.find((c) => c.id === prop) || Reflect.get(target, prop);
        }
    });
};
//# sourceMappingURL=UIConfigHelper.js.map