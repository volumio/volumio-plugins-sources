'use strict';

class ObjectHelper {

    static assignProps(objFrom, objTo, propNames) {
        propNames.forEach( prop => {
            let propName, newPropName;
            if (typeof prop === 'object') {
                propName = Object.keys(prop)[0];
                newPropName = prop[propName];
            }
            else {
                propName = newPropName = prop;
            }
            if (objFrom[propName] !== undefined) {
                objTo[newPropName] = objFrom[propName];
            }
        });
        
        return objTo;
    }
    
    static getProp(obj, propName, defaultVal = null) {
        const p = propName.split('.');
        let v = obj[p.shift()];
        while (v != undefined && typeof v === 'object' && p.length > 0) {
            v = v[p.shift()];
        }
        return v !== undefined && p.length === 0 ? v : defaultVal;
    }
}

module.exports = ObjectHelper;